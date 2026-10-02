import json
import glob
import os
import random
import numpy as np
from pathlib import Path

def create_signer_independent_splits(processed_dir, output_meta_dir, seed=42, min_samples_per_class=8):
    random.seed(seed)
    np.random.seed(seed)
    
    npz_files = glob.glob(os.path.join(processed_dir, "*.npz"))
    
    # 1. Gather all stats
    registry = {}
    class_counts = {}
    signer_to_samples = {}
    
    for f in npz_files:
        path = Path(f)
        try:
            # We don't need to load the massive arrays, just read metadata from filename if encoded,
            # or load the npz lightweight dict. Since we saved label and signer_id in npz:
            data = np.load(f)
            label = str(data["label"])
            signer_id = str(data["signer_id"])
            source = str(data["source"])
            
            if label not in registry:
                registry[label] = []
            if label not in class_counts:
                class_counts[label] = 0
                
            class_counts[label] += 1
            
            if signer_id not in signer_to_samples:
                signer_to_samples[signer_id] = []
                
            sample_info = {"file": f, "label": label, "signer_id": signer_id, "source": source}
            registry[label].append(sample_info)
            signer_to_samples[signer_id].append(sample_info)
            
        except Exception as e:
            print(f"Error reading {f}: {e}")

    # 2. Filter classes by min_samples
    valid_classes = [k for k, v in class_counts.items() if v >= min_samples_per_class]
    dropped_classes = [k for k, v in class_counts.items() if v < min_samples_per_class]
    print(f"Valid classes (>= {min_samples_per_class} samples): {len(valid_classes)}")
    print(f"Dropped classes: {len(dropped_classes)}")
    
    # 3. Create splits
    # Strategy: 80% Train, 10% Val, 10% Test (by signer)
    all_signers = list(signer_to_samples.keys())
    random.shuffle(all_signers)
    
    n_signers = len(all_signers)
    train_split_idx = int(0.8 * n_signers)
    val_split_idx = int(0.9 * n_signers)
    
    train_signers = set(all_signers[:train_split_idx])
    val_signers = set(all_signers[train_split_idx:val_split_idx])
    test_signers = set(all_signers[val_split_idx:])
    
    # Assert zero overlap
    assert len(train_signers.intersection(val_signers)) == 0
    assert len(train_signers.intersection(test_signers)) == 0
    
    splits = {"train": [], "val": [], "test": []}
    
    for signer in all_signers:
        samples = [s for s in signer_to_samples[signer] if s["label"] in valid_classes]
        if signer in train_signers:
            splits["train"].extend(samples)
        elif signer in val_signers:
            splits["val"].extend(samples)
        else:
            splits["test"].extend(samples)
            
    # Write metadata
    Path(output_meta_dir).mkdir(parents=True, exist_ok=True)
    with open(os.path.join(output_meta_dir, "splits.json"), "w") as f:
        json.dump(splits, f, indent=2)
        
    # Write registry stats
    with open(os.path.join(output_meta_dir, "sign_datasets.json"), "w") as f:
        json.dump({
            "total_classes": len(valid_classes),
            "dropped_classes": dropped_classes,
            "total_signers": n_signers,
            "train_samples": len(splits["train"]),
            "val_samples": len(splits["val"]),
            "test_samples": len(splits["test"]),
            "valid_classes_list": valid_classes
        }, f, indent=2)
        
    print(f"Split completed. Train: {len(splits['train'])}, Val: {len(splits['val'])}, Test: {len(splits['test'])}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=str, default="data/processed_landmarks")
    parser.add_argument("--output", type=str, default="data/metadata")
    parser.add_argument("--min_samples", type=int, default=8)
    args = parser.parse_args()
    
    create_signer_independent_splits(args.input, args.output, min_samples_per_class=args.min_samples)
