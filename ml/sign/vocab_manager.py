import json
import os
from collections import Counter
from pathlib import Path

def manage_vocabulary(processed_dir, meta_dir, min_samples=8):
    import glob
    import numpy as np
    
    npz_files = glob.glob(os.path.join(processed_dir, "*.npz"))
    
    gloss_counts = Counter()
    for f in npz_files:
        try:
            data = np.load(f)
            label = str(data["label"]).upper().strip()
            gloss_counts[label] += 1
        except Exception:
            pass
            
    # Normalize/Merge duplicates logic (e.g. "THANKYOU" -> "THANK YOU")
    # For now, just rely on raw string matches.
    merged_counts = gloss_counts
    
    valid_vocab = {k: v for k, v in merged_counts.items() if v >= min_samples}
    dropped_vocab = {k: v for k, v in merged_counts.items() if v < min_samples}
    
    # Generate mapping file
    mapping = []
    for i, (gloss, count) in enumerate(sorted(valid_vocab.items())):
        mapping.append({
            "id": i,
            "raw_gloss": gloss,
            "display_word": gloss.replace("_", " ").title(),
            "samples": count
        })
        
    Path(meta_dir).mkdir(parents=True, exist_ok=True)
    with open(os.path.join(meta_dir, "vocab_mapping.json"), "w") as f:
        json.dump(mapping, f, indent=2)
        
    with open(os.path.join(meta_dir, "dropped_vocab.json"), "w") as f:
        json.dump(dropped_vocab, f, indent=2)
        
    print(f"Vocab managed. Kept: {len(valid_vocab)}, Dropped: {len(dropped_vocab)}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=str, default="data/processed_landmarks")
    parser.add_argument("--output", type=str, default="data/metadata")
    parser.add_argument("--min_samples", type=int, default=8)
    args = parser.parse_args()
    
    manage_vocabulary(args.input, args.output, args.min_samples)
