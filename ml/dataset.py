"""
GESTURA ML Dataset Loader & Validator
Loads raw or pre-split datasets, validates minimum requirements, and extracts 82D feature vectors.
"""
import hashlib
import json
from pathlib import Path
from typing import Dict, List, Tuple, Any, Optional
import numpy as np
from sklearn.preprocessing import LabelEncoder

from ml.preprocessor import preprocess_landmarks


def compute_dataset_hash(file_paths: List[Path]) -> str:
    """Generates SHA-256 hash across dataset files for provenance tracking."""
    hasher = hashlib.sha256()
    for fp in sorted(file_paths):
        if fp.exists():
            with open(fp, "rb") as f:
                while chunk := f.read(65536):
                    hasher.update(chunk)
    return hasher.hexdigest()[:16]


def load_jsonl_samples(file_path: Path) -> List[Dict[str, Any]]:
    samples = []
    if not file_path.exists():
        return samples
    with open(file_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    samples.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
    return samples


def validate_and_extract_features(
    samples: List[Dict[str, Any]],
) -> Tuple[np.ndarray, np.ndarray, List[str]]:
    """
    Extracts 82D feature vectors from raw samples.
    Returns:
        X: np.ndarray of shape (N, 82)
        y_labels: np.ndarray of shape (N,) containing raw string labels
        valid_sessions: list of session IDs
    """
    feature_list = []
    labels_list = []
    sessions_list = []

    for s in samples:
        landmarks = s.get("landmarks", [])
        if len(landmarks) != 21:
            continue

        hand = s.get("hand", "Right")
        label = s.get("label", "UNKNOWN").upper().strip()
        session_id = s.get("session_id", "default_session")

        try:
            vec = preprocess_landmarks(landmarks, hand=hand, is_mirrored=False)
            if np.isfinite(vec).all() and len(vec) == 82:
                feature_list.append(vec)
                labels_list.append(label)
                sessions_list.append(session_id)
        except Exception:
            continue

    if not feature_list:
        return np.empty((0, 82), dtype=np.float32), np.empty((0,), dtype=object), []

    X = np.stack(feature_list, axis=0).astype(np.float32)
    y = np.array(labels_list, dtype=object)
    return X, y, sessions_list


def load_dataset_for_training(
    data_dir: Path,
    min_samples_per_class: int = 5,
    seed: int = 42,
) -> Dict[str, Any]:
    """
    Loads dataset respecting train/val/test splits or auto-splits raw samples.
    Enforces strict validation guard rails.
    """
    train_file = data_dir / "train" / "samples.jsonl"
    val_file = data_dir / "validation" / "samples.jsonl"
    test_file = data_dir / "test" / "samples.jsonl"
    raw_file = data_dir / "raw" / "samples.jsonl"

    # Check if pre-split files exist and have data
    train_samples = load_jsonl_samples(train_file)
    val_samples = load_jsonl_samples(val_file)
    test_samples = load_jsonl_samples(test_file)

    if not train_samples and raw_file.exists():
        # Auto-run session-based splitter
        from scripts.split_dataset import split_dataset
        split_dataset(data_dir, seed=seed)
        train_samples = load_jsonl_samples(train_file)
        val_samples = load_jsonl_samples(val_file)
        test_samples = load_jsonl_samples(test_file)

    all_samples = train_samples + val_samples + test_samples
    if not all_samples and raw_file.exists():
        all_samples = load_jsonl_samples(raw_file)

    if len(all_samples) == 0:
        raise ValueError(
            "Dataset is empty (0 samples found). "
            "Please record gesture samples at http://localhost:3001/dataset before training."
        )

    # Class count analysis
    class_counts: Dict[str, int] = {}
    for s in all_samples:
        lbl = s.get("label", "UNKNOWN").upper().strip()
        class_counts[lbl] = class_counts.get(lbl, 0) + 1

    distinct_classes = sorted(list(class_counts.keys()))

    # Guard rail 1: Minimum 2 classes required
    if len(distinct_classes) < 2:
        raise ValueError(
            f"Training requires at least 2 distinct gesture classes. "
            f"Currently found {len(distinct_classes)} class: {distinct_classes}. "
            "Please record at least one additional gesture class at /dataset."
        )

    # Guard rail 2: Minimum samples per class
    insufficient_classes = {
        lbl: cnt for lbl, cnt in class_counts.items() if cnt < min_samples_per_class
    }
    if insufficient_classes:
        error_details = ", ".join(
            [f"'{lbl}': {cnt}/{min_samples_per_class} samples" for lbl, cnt in insufficient_classes.items()]
        )
        raise ValueError(
            f"Insufficient samples for training. Each class requires at least {min_samples_per_class} samples "
            f"(recommended 20-100+ across multiple sessions). Insufficient classes: {error_details}."
        )

    # Extract features per split
    X_train, y_train_raw, _ = validate_and_extract_features(train_samples)
    X_val, y_val_raw, _ = validate_and_extract_features(val_samples)
    X_test, y_test_raw, _ = validate_and_extract_features(test_samples)

    # If val or test is empty due to small dataset, create stratified fallback splits
    if len(X_val) == 0 or len(X_test) == 0:
        X_all, y_all_raw, _ = validate_and_extract_features(all_samples)
        from sklearn.model_selection import train_test_split

        X_train, X_temp, y_train_raw, y_temp_raw = train_test_split(
            X_all, y_all_raw, test_size=0.30, random_state=seed, stratify=y_all_raw
        )
        X_val, X_test, y_val_raw, y_test_raw = train_test_split(
            X_temp, y_temp_raw, test_size=0.50, random_state=seed, stratify=y_temp_raw
        )

    # Encode labels
    encoder = LabelEncoder()
    encoder.fit(distinct_classes)
    y_train = encoder.transform(y_train_raw)
    y_val = encoder.transform(y_val_raw)
    y_test = encoder.transform(y_test_raw)

    dataset_hash = compute_dataset_hash([raw_file, train_file, val_file, test_file])

    return {
        "X_train": X_train,
        "y_train": y_train,
        "X_val": X_val,
        "y_val": y_val,
        "X_test": X_test,
        "y_test": y_test,
        "classes": distinct_classes,
        "encoder": encoder,
        "class_counts": class_counts,
        "dataset_hash": dataset_hash,
        "total_samples": len(all_samples),
    }
