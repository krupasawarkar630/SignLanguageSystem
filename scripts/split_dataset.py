#!/usr/bin/env python3
"""
GESTURA Dataset Splitting Script
Produces train/validation/test splits with fixed seed.
Uses session-level grouping to PREVENT DATA LEAKAGE from consecutive video frames.
Writes split metadata to data/metadata/split_metadata.json.
"""
import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import random
import sys
from typing import Dict, List, Any


def split_dataset(
    data_dir: Path,
    train_ratio: float = 0.70,
    val_ratio: float = 0.15,
    test_ratio: float = 0.15,
    seed: int = 42,
) -> Dict[str, Any]:
    raw_jsonl_path = data_dir / "raw" / "samples.jsonl"
    if not raw_jsonl_path.exists():
        print(f"[ERROR] Raw dataset file not found at: {raw_jsonl_path}")
        return {}

    # Set deterministic random seed
    random.seed(seed)

    # 1. Load all samples
    samples: List[Dict[str, Any]] = []
    with open(raw_jsonl_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    samples.append(json.loads(line))
                except json.JSONDecodeError:
                    continue

    if not samples:
        print("[WARNING] Dataset is empty (0 samples).")
        return {"total_samples": 0}

    # 2. Group samples by Label -> Session ID to prevent frame leakage
    label_sessions: Dict[str, Dict[str, List[Dict[str, Any]]]] = {}
    for s in samples:
        lbl = s.get("label", "UNKNOWN").upper()
        sess = s.get("session_id", "default_session")
        if lbl not in label_sessions:
            label_sessions[lbl] = {}
        if sess not in label_sessions[lbl]:
            label_sessions[lbl][sess] = []
        label_sessions[lbl][sess].append(s)

    train_samples: List[Dict[str, Any]] = []
    val_samples: List[Dict[str, Any]] = []
    test_samples: List[Dict[str, Any]] = []

    per_class_counts: Dict[str, Dict[str, int]] = {}

    # 3. Stratified allocation by session per class
    for lbl, sessions in label_sessions.items():
        session_keys = list(sessions.keys())
        random.shuffle(session_keys)

        per_class_counts[lbl] = {"train": 0, "validation": 0, "test": 0, "total": 0}

        num_sessions = len(session_keys)
        if num_sessions == 1:
            # Single session: split frames chronologically into 70/15/15 chunks
            sess_samples = sessions[session_keys[0]]
            n = len(sess_samples)
            n_train = max(1, int(n * train_ratio))
            n_val = int(n * val_ratio)

            c_train = sess_samples[:n_train]
            c_val = sess_samples[n_train : n_train + n_val]
            c_test = sess_samples[n_train + n_val :]

            train_samples.extend(c_train)
            val_samples.extend(c_val)
            test_samples.extend(c_test)

            per_class_counts[lbl]["train"] += len(c_train)
            per_class_counts[lbl]["validation"] += len(c_val)
            per_class_counts[lbl]["test"] += len(c_test)
            per_class_counts[lbl]["total"] += n
        else:
            # Multiple sessions: assign full sessions to splits
            n_train_sess = max(1, round(num_sessions * train_ratio))
            n_val_sess = max(0, round(num_sessions * val_ratio))
            if n_train_sess + n_val_sess >= num_sessions and num_sessions > 2:
                n_train_sess = num_sessions - 2
                n_val_sess = 1

            train_sess_keys = session_keys[:n_train_sess]
            val_sess_keys = session_keys[n_train_sess : n_train_sess + n_val_sess]
            test_sess_keys = session_keys[n_train_sess + n_val_sess :]

            if not test_sess_keys and len(val_sess_keys) > 1:
                test_sess_keys = [val_sess_keys.pop()]

            for k in train_sess_keys:
                train_samples.extend(sessions[k])
                per_class_counts[lbl]["train"] += len(sessions[k])
            for k in val_sess_keys:
                val_samples.extend(sessions[k])
                per_class_counts[lbl]["validation"] += len(sessions[k])
            for k in test_sess_keys:
                test_samples.extend(sessions[k])
                per_class_counts[lbl]["test"] += len(sessions[k])

            per_class_counts[lbl]["total"] += sum(len(sessions[k]) for k in session_keys)

    # 4. Write split files
    for split_name, split_list in [
        ("train", train_samples),
        ("validation", val_samples),
        ("test", test_samples),
    ]:
        out_dir = data_dir / split_name
        out_dir.mkdir(parents=True, exist_ok=True)
        out_file = out_dir / "samples.jsonl"
        with open(out_file, "w", encoding="utf-8") as f:
            for item in split_list:
                f.write(json.dumps(item) + "\n")
        print(f"[OK] Wrote {len(split_list)} samples to: {out_file}")

    # 5. Metadata generation
    metadata = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "split_method": "session_grouped_stratified",
        "seed": seed,
        "total_samples": len(samples),
        "split_counts": {
            "train": len(train_samples),
            "validation": len(val_samples),
            "test": len(test_samples),
        },
        "target_ratios": {
            "train": train_ratio,
            "validation": val_ratio,
            "test": test_ratio,
        },
        "per_class_distribution": per_class_counts,
    }

    meta_dir = data_dir / "metadata"
    meta_dir.mkdir(parents=True, exist_ok=True)
    meta_file = meta_dir / "split_metadata.json"
    with open(meta_file, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"[OK] Wrote split metadata to: {meta_file}")

    return metadata


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Split GESTURA raw dataset into train/val/test sets.")
    parser.add_argument("--data-dir", type=str, default="data", help="Root data directory")
    parser.add_argument("--train-ratio", type=float, default=0.70, help="Train ratio (default: 0.70)")
    parser.add_argument("--val-ratio", type=float, default=0.15, help="Validation ratio (default: 0.15)")
    parser.add_argument("--test-ratio", type=float, default=0.15, help="Test ratio (default: 0.15)")
    parser.add_argument("--seed", type=int, default=42, help="Deterministic random seed (default: 42)")

    args = parser.parse_args()
    data_path = Path(args.data_dir).resolve()

    print(f"=== GESTURA DATASET SPLITTER ===")
    print(f"Data Dir: {data_path}")
    print(f"Seed: {args.seed}")
    print(f"Ratios: {args.train_ratio} train / {args.val_ratio} val / {args.test_ratio} test")

    meta = split_dataset(
        data_dir=data_path,
        train_ratio=args.train_ratio,
        val_ratio=args.val_ratio,
        test_ratio=args.test_ratio,
        seed=args.seed,
    )
    print(f"=== SPLIT COMPLETE: {meta.get('total_samples', 0)} total samples ===")
