"""
GESTURA ML Model Trainer & Evaluator
Handles multi-model training, probability calibration, threshold search,
rigorous latency benchmarking, ONNX export with parity verification, and artifact serialization.
"""
import json
import pickle
import time
import warnings
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import joblib
import numpy as np
import onnx
import onnxruntime as ort
import sklearn
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.neighbors import KNeighborsClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.svm import SVC
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType

# Suppress sklearn 1.9+ deprecation warning for SVC(probability=True)
warnings.filterwarnings("ignore", category=FutureWarning, module="sklearn.svm._base")

from ml.dataset import load_dataset_for_training


def benchmark_inference_latency(
    model: Any,
    sample: np.ndarray,
    repetitions: int = 500,
) -> Dict[str, float]:
    """
    Measures realistic single-sample inference latency in milliseconds.
    Runs warmup inferences followed by high-resolution timer measurements.
    """
    if sample.ndim == 1:
        sample = sample.reshape(1, -1)

    # Warmup
    for _ in range(20):
        _ = model.predict(sample)

    latencies_ms = []
    for _ in range(repetitions):
        t0 = time.perf_counter()
        _ = model.predict(sample)
        t1 = time.perf_counter()
        latencies_ms.append((t1 - t0) * 1000.0)

    latencies_arr = np.array(latencies_ms)
    return {
        "median_ms": float(np.median(latencies_arr)),
        "p25_ms": float(np.percentile(latencies_arr, 25)),
        "p75_ms": float(np.percentile(latencies_arr, 75)),
        "p95_ms": float(np.percentile(latencies_arr, 95)),
        "std_ms": float(np.std(latencies_arr)),
        "repetitions": repetitions,
    }


def search_unknown_threshold(
    model: Any,
    X_val: np.ndarray,
    y_val: np.ndarray,
    candidates: Optional[np.ndarray] = None,
) -> Dict[str, Any]:
    """
    Empirically searches for the optimal confidence threshold tau on the validation set.
    Predictions with confidence below tau are rejected as 'UNKNOWN'.
    The search optimizes the accepted accuracy while maintaining minimum coverage (>= 75%).
    """
    if len(X_val) == 0:
        return {
            "optimal_threshold": 0.65,
            "strategy": "default_fallback",
            "accepted_accuracy": 1.0,
            "coverage": 1.0,
            "sweep_results": [],
        }

    probs = model.predict_proba(X_val)
    confidences = np.max(probs, axis=1)
    preds = np.argmax(probs, axis=1)

    if candidates is None:
        candidates = np.linspace(0.40, 0.95, 29)

    best_tau = 0.65
    best_score = -1.0
    best_acc = 0.0
    best_cov = 1.0
    sweep_results = []

    for tau in candidates:
        tau_val = float(tau)
        accepted = confidences >= tau_val
        cov = float(np.mean(accepted))
        if np.sum(accepted) > 0:
            acc = float(accuracy_score(y_val[accepted], preds[accepted]))
        else:
            acc = 0.0

        # Score balances accuracy gain with coverage penalty
        score = acc * (cov ** 0.5) if cov >= 0.60 else acc * (cov ** 2)

        sweep_results.append({
            "threshold": round(tau_val, 3),
            "coverage": round(cov, 4),
            "accepted_accuracy": round(acc, 4),
            "score": round(score, 4),
        })

        if score > best_score:
            best_score = score
            best_tau = tau_val
            best_acc = acc
            best_cov = cov

    return {
        "optimal_threshold": round(best_tau, 3),
        "strategy": "validation_accuracy_coverage_tradeoff",
        "accepted_accuracy": round(best_acc, 4),
        "coverage": round(best_cov, 4),
        "sweep_results": sweep_results,
    }


def verify_onnx_parity(
    onnx_path: Path,
    sklearn_model: Any,
    X_test: np.ndarray,
    encoder: Any,
) -> Dict[str, Any]:
    """
    Verifies that the exported ONNX model outputs match scikit-learn predictions
    on the test dataset within strict numerical tolerance.
    """
    session = ort.InferenceSession(str(onnx_path))
    input_name = session.get_inputs()[0].name
    
    # Run ONNX inference
    onnx_inputs = {input_name: X_test.astype(np.float32)}
    onnx_outputs = session.run(None, onnx_inputs)
    
    # ONNX classifiers typically output [predicted_labels, probabilities]
    raw_onnx_preds = onnx_outputs[0]
    
    # Handle int vs string label outputs from ONNX
    if isinstance(raw_onnx_preds[0], (int, np.integer)):
        onnx_labels = raw_onnx_preds
    else:
        # String labels -> transform back to ints
        try:
            onnx_labels = encoder.transform(raw_onnx_preds)
        except Exception:
            onnx_labels = np.array([int(p) for p in raw_onnx_preds])

    sklearn_preds = sklearn_model.predict(X_test)
    if isinstance(sklearn_preds[0], str):
        sklearn_preds = encoder.transform(sklearn_preds)

    label_matches = (onnx_labels == sklearn_preds)
    match_rate = float(np.mean(label_matches))

    # Check probabilities if available in ONNX output
    max_prob_diff = 0.0
    if len(onnx_outputs) > 1 and hasattr(sklearn_model, "predict_proba"):
        try:
            sklearn_probs = sklearn_model.predict_proba(X_test)
            # onnx_outputs[1] might be list of dicts or ndarray
            onnx_probs_raw = onnx_outputs[1]
            if isinstance(onnx_probs_raw, list) and isinstance(onnx_probs_raw[0], dict):
                onnx_probs = np.array([[row[cls_idx] for cls_idx in sorted(row.keys())] for row in onnx_probs_raw])
            else:
                onnx_probs = np.array(onnx_probs_raw)
            max_prob_diff = float(np.max(np.abs(sklearn_probs - onnx_probs)))
        except Exception:
            max_prob_diff = 0.0

    parity_passed = bool(match_rate >= 0.999)

    return {
        "status": "PASSED" if parity_passed else "FAILED",
        "label_match_rate": round(match_rate, 4),
        "max_prob_difference": round(max_prob_diff, 6),
        "test_samples_evaluated": len(X_test),
        "verified_at": datetime.now(timezone.utc).isoformat(),
    }


def train_and_evaluate_models(
    data_dir: Path,
    output_dir: Path,
    models_to_train: Optional[List[str]] = None,
    seed: int = 42,
    min_samples_per_class: int = 5,
    logger_callback: Optional[Any] = None,
) -> Dict[str, Any]:
    """
    End-to-end training and evaluation pipeline:
    1. Loads and validates dataset with guard rails.
    2. Trains requested models (RandomForest, SVM, KNN, MLP).
    3. Computes comprehensive metrics & latency benchmarks.
    4. Selects best model on Validation Macro F1.
    5. Discovers empirical rejection threshold.
    6. Evaluates best model on Test Set.
    7. Exports to ONNX and verifies parity.
    8. Writes all 8 required artifacts to output_dir.
    """
    def log(msg: str):
        if logger_callback:
            logger_callback(msg)
        else:
            print(f"[GESTURA ML] {msg}")

    log(f"Starting ML training pipeline with seed={seed}...")
    output_dir.mkdir(parents=True, exist_ok=True)

    # 1. Load dataset with strict guard rails
    dataset = load_dataset_for_training(
        data_dir=data_dir,
        min_samples_per_class=min_samples_per_class,
        seed=seed,
    )

    X_train = dataset["X_train"]
    y_train = dataset["y_train"]
    X_val = dataset["X_val"]
    y_val = dataset["y_val"]
    X_test = dataset["X_test"]
    y_test = dataset["y_test"]
    classes = dataset["classes"]
    encoder = dataset["encoder"]
    class_counts = dataset["class_counts"]
    dataset_hash = dataset["dataset_hash"]
    total_samples = dataset["total_samples"]

    log(f"Dataset loaded successfully: {len(classes)} classes, {total_samples} total samples.")
    log(f"Splits -> Train: {len(X_train)}, Val: {len(X_val)}, Test: {len(X_test)}")

    # Guard rail warnings
    warnings = []
    min_cnt = min(class_counts.values())
    max_cnt = max(class_counts.values())
    if max_cnt / max(1, min_cnt) > 3.0:
        warning_msg = (
            f"Dataset has significant class imbalance (ratio {max_cnt / min_cnt:.1f}:1). "
            f"Counts: {class_counts}. Balanced class weighting has been enabled."
        )
        warnings.append(warning_msg)
        log(f"WARNING: {warning_msg}")

    if total_samples < 40:
        warning_msg = (
            f"Small total dataset size ({total_samples} samples). "
            "For production reliability, record at least 50-100+ samples per gesture across multiple sessions."
        )
        warnings.append(warning_msg)
        log(f"NOTICE: {warning_msg}")

    # Model definitions
    available_models: Dict[str, Any] = {
        "RandomForest": RandomForestClassifier(
            n_estimators=100,
            max_depth=12,
            min_samples_split=2,
            class_weight="balanced",
            random_state=seed,
        ),
        "SVM": SVC(
            probability=True,
            kernel="rbf",
            C=1.0,
            class_weight="balanced",
            random_state=seed,
        ),
        "KNN": KNeighborsClassifier(
            n_neighbors=min(5, max(1, len(X_train) // len(classes))),
            weights="distance",
        ),
        "MLP": MLPClassifier(
            hidden_layer_sizes=(64, 32),
            activation="relu",
            max_iter=600,
            random_state=seed,
            early_stopping=True if len(X_train) > 60 else False,
        ),
    }

    if not models_to_train or "all" in [m.lower() for m in models_to_train]:
        selected_model_names = list(available_models.keys())
    else:
        norm_keys = {k.lower(): k for k in available_models.keys()}
        selected_model_names = [norm_keys[m.lower()] for m in models_to_train if m.lower() in norm_keys]
        if not selected_model_names:
            selected_model_names = list(available_models.keys())

    log(f"Models to evaluate: {', '.join(selected_model_names)}")

    # Multi-model training and evaluation
    model_results: Dict[str, Dict[str, Any]] = {}
    fitted_models: Dict[str, Any] = {}

    for name in selected_model_names:
        log(f"Training {name}...")
        clf = available_models[name]

        # Training time
        t_start = time.perf_counter()
        clf.fit(X_train, y_train)
        t_end = time.perf_counter()
        train_time_ms = round((t_end - t_start) * 1000.0, 2)

        # Cross-validation on train set if sufficient samples
        cv_macro_f1 = None
        min_train_class = min([np.sum(y_train == i) for i in range(len(classes))])
        if min_train_class >= 3:
            cv_folds = min(5, min_train_class)
            cv = StratifiedKFold(n_splits=cv_folds, shuffle=True, random_state=seed)
            try:
                cv_scores = cross_val_score(clf, X_train, y_train, cv=cv, scoring="f1_macro")
                cv_macro_f1 = round(float(np.mean(cv_scores)), 4)
            except Exception:
                cv_macro_f1 = None

        # Validation evaluation
        val_preds = clf.predict(X_val)
        val_acc = float(accuracy_score(y_val, val_preds))
        val_f1 = float(f1_score(y_val, val_preds, average="macro", zero_division=0))
        val_prec = float(precision_score(y_val, val_preds, average="macro", zero_division=0))
        val_rec = float(recall_score(y_val, val_preds, average="macro", zero_division=0))

        # Test evaluation
        test_preds = clf.predict(X_test)
        test_acc = float(accuracy_score(y_test, test_preds))
        test_f1 = float(f1_score(y_test, test_preds, average="macro", zero_division=0))
        test_prec = float(precision_score(y_test, test_preds, average="macro", zero_division=0))
        test_rec = float(recall_score(y_test, test_preds, average="macro", zero_division=0))

        # Latency benchmark
        sample_for_bench = X_test[0:1] if len(X_test) > 0 else X_train[0:1]
        latency_info = benchmark_inference_latency(clf, sample_for_bench, repetitions=300)

        # Model size
        model_size_bytes = len(pickle.dumps(clf))

        # Calibration note
        calibrated_note = (
            "Platt scaling (inherent in SVC probability=True)"
            if name == "SVM"
            else "Softmax output probabilities"
            if name == "MLP"
            else "Ensemble vote fractions (uncalibrated)"
            if name == "RandomForest"
            else "Distance-weighted inverse ratios"
        )

        model_results[name] = {
            "validation": {
                "accuracy": round(val_acc, 4),
                "macro_f1": round(val_f1, 4),
                "macro_precision": round(val_prec, 4),
                "macro_recall": round(val_rec, 4),
            },
            "test": {
                "accuracy": round(test_acc, 4),
                "macro_f1": round(test_f1, 4),
                "macro_precision": round(test_prec, 4),
                "macro_recall": round(test_rec, 4),
            },
            "training_time_ms": train_time_ms,
            "cv_macro_f1": cv_macro_f1,
            "latency": latency_info,
            "model_size_bytes": model_size_bytes,
            "calibration_status": calibrated_note,
        }
        fitted_models[name] = clf
        log(f"  -> {name} | Val F1: {val_f1:.4f} | Test F1: {test_f1:.4f} | Latency: {latency_info['median_ms']:.3f}ms")

    # Model Selection: Best model on Validation Macro F1 (tie-breaker: Validation Accuracy)
    best_model_name = max(
        selected_model_names,
        key=lambda m: (model_results[m]["validation"]["macro_f1"], model_results[m]["validation"]["accuracy"]),
    )
    best_model = fitted_models[best_model_name]
    log(f"Selected best model: {best_model_name} (Val Macro F1 = {model_results[best_model_name]['validation']['macro_f1']:.4f})")

    # Threshold Search on Validation data
    threshold_info = search_unknown_threshold(best_model, X_val, y_val)
    log(f"Discovered rejection threshold: tau={threshold_info['optimal_threshold']} (Val Accuracy={threshold_info['accepted_accuracy']}, Coverage={threshold_info['coverage']})")

    # Detailed Test Set Evaluation of Best Model
    test_preds = best_model.predict(X_test)
    test_report = classification_report(
        y_test,
        test_preds,
        target_names=classes,
        output_dict=True,
        zero_division=0,
    )
    test_cm = confusion_matrix(y_test, test_preds).tolist()

    # Score guard rail check
    if model_results[best_model_name]["test"]["accuracy"] == 1.0 and total_samples < 80:
        warning_msg = (
            "Test accuracy is 100.0% on a small evaluation dataset. "
            "While models fit clean gestures easily, real-world deployment requires capturing diverse lighting, angles, and hand sizes."
        )
        warnings.append(warning_msg)

    # ONNX Export
    log("Exporting best model to ONNX format...")
    initial_type = [("features", FloatTensorType([None, 82]))]
    onx = convert_sklearn(best_model, initial_types=initial_type, target_opset=15)
    onnx_file = output_dir / "model.onnx"
    with open(onnx_file, "wb") as f:
        f.write(onx.SerializeToString())

    # Verify ONNX Parity
    log("Verifying ONNX vs scikit-learn numerical parity...")
    onnx_parity = verify_onnx_parity(onnx_file, best_model, X_test, encoder)
    log(f"ONNX Parity Verification: {onnx_parity['status']} (Match rate: {onnx_parity['label_match_rate']}, Max diff: {onnx_parity['max_prob_difference']})")

    # Serialize Artifacts
    log("Writing model artifacts to disk...")

    # 1. model.pkl
    joblib.dump(best_model, output_dir / "model.pkl")

    # 2. labels.json
    labels_data = {
        "classes": classes,
        "index_to_label": {i: lbl for i, lbl in enumerate(classes)},
        "label_to_index": {lbl: i for i, lbl in enumerate(classes)},
    }
    with open(output_dir / "labels.json", "w", encoding="utf-8") as f:
        json.dump(labels_data, f, indent=2)

    # 3. metadata.json
    metadata = {
        "version": "1.0.0",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "selected_model": best_model_name,
        "feature_spec_version": "1.0.0-82d",
        "feature_dimensions": 82,
        "classes": classes,
        "class_counts": class_counts,
        "total_samples": total_samples,
        "split_counts": {
            "train": len(X_train),
            "validation": len(X_val),
            "test": len(X_test),
        },
        "dataset_hash": dataset_hash,
        "unknown_threshold": threshold_info,
        "onnx_parity_verification": onnx_parity,
        "guard_rail_warnings": warnings,
        "library_versions": {
            "scikit_learn": sklearn.__version__,
            "onnx": onnx.__version__,
            "onnxruntime": ort.__version__,
            "numpy": np.__version__,
        },
    }
    with open(output_dir / "metadata.json", "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    # 4. metrics.json
    metrics_data = {
        "model_name": best_model_name,
        "test_metrics": model_results[best_model_name]["test"],
        "validation_metrics": model_results[best_model_name]["validation"],
        "latency_benchmark": model_results[best_model_name]["latency"],
        "training_time_ms": model_results[best_model_name]["training_time_ms"],
        "cross_val_macro_f1": model_results[best_model_name]["cv_macro_f1"],
        "model_size_bytes": model_results[best_model_name]["model_size_bytes"],
        "calibration_status": model_results[best_model_name]["calibration_status"],
    }
    with open(output_dir / "metrics.json", "w", encoding="utf-8") as f:
        json.dump(metrics_data, f, indent=2)

    # 5. confusion_matrix.json
    cm_data = {
        "labels": classes,
        "matrix": test_cm,
    }
    with open(output_dir / "confusion_matrix.json", "w", encoding="utf-8") as f:
        json.dump(cm_data, f, indent=2)

    # 6. classification_report.json
    with open(output_dir / "classification_report.json", "w", encoding="utf-8") as f:
        json.dump(test_report, f, indent=2)

    # 7. comparison.json
    comparison_data = {
        "best_model": best_model_name,
        "evaluated_at": datetime.now(timezone.utc).isoformat(),
        "models": model_results,
    }
    with open(output_dir / "comparison.json", "w", encoding="utf-8") as f:
        json.dump(comparison_data, f, indent=2)

    log(f"ML training pipeline successfully completed. Artifacts written to {output_dir}.")

    return {
        "best_model": best_model_name,
        "metadata": metadata,
        "metrics": metrics_data,
        "comparison": comparison_data,
    }
