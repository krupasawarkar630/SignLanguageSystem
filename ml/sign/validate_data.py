import glob
import os
import json
import numpy as np
from pathlib import Path

def run_validation(processed_dir, output_meta_dir):
    npz_files = glob.glob(os.path.join(processed_dir, "*.npz"))
    
    report = {
        "total_files": len(npz_files),
        "files_with_nans": [],
        "zero_length_sequences": [],
        "avg_sequence_length": 0,
        "missing_hand_ratio_per_class": {},
        "near_duplicates": []
    }
    
    total_frames = 0
    class_missing_frames = {}
    class_total_frames = {}
    
    for f in npz_files:
        try:
            data = np.load(f)
            features = data["features"]
            masks = data["masks"]
            label = str(data["label"])
            
            seq_len = features.shape[0]
            total_frames += seq_len
            
            if seq_len == 0:
                report["zero_length_sequences"].append(f)
                continue
                
            if np.isnan(features).any():
                report["files_with_nans"].append(f)
                
            if label not in class_missing_frames:
                class_missing_frames[label] = 0
                class_total_frames[label] = 0
                
            # mask shape is (seq_len, 2) where 1 means missing
            missing_frames_count = np.sum(masks > 0)
            class_missing_frames[label] += missing_frames_count
            class_total_frames[label] += (seq_len * 2) # Two hands per frame
            
        except Exception as e:
            print(f"Validation error on {f}: {e}")
            
    if report["total_files"] > 0:
        report["avg_sequence_length"] = total_frames / report["total_files"]
        
    for label in class_missing_frames:
        if class_total_frames[label] > 0:
            report["missing_hand_ratio_per_class"][label] = class_missing_frames[label] / class_total_frames[label]
            
    Path(output_meta_dir).mkdir(parents=True, exist_ok=True)
    report_path = os.path.join(output_meta_dir, "data_quality_report.json")
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)
        
    print(f"Validation complete. Found {len(report['files_with_nans'])} files with NaNs and {len(report['zero_length_sequences'])} empty sequences.")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=str, default="data/processed_landmarks")
    parser.add_argument("--output", type=str, default="data/metadata")
    args = parser.parse_args()
    
    run_validation(args.input, args.output)
