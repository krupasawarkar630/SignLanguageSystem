"""
GESTURA ML Model Service
Coordinates model artifact access, training job lifecycle, real-time prediction, and status reporting.
"""
import json
import threading
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import joblib
import numpy as np

from backend.core.config import get_settings
from ml.preprocessor import preprocess_landmarks
from ml.trainer import train_and_evaluate_models

settings = get_settings()


class ModelService:
    def __init__(self):
        self.models_dir = Path("models").resolve()
        self.data_dir = Path("data").resolve()
        self._lock = threading.Lock()
        self._cached_model = None
        self._cached_model_mtime: float = 0.0
        self._cached_labels = None
        self._cached_metadata = None
        self._train_state = {
            "status": "idle",
            "start_time": None,
            "end_time": None,
            "logs": [],
            "error": None,
            "best_model": None,
            "metrics_summary": None,
        }

    def get_metadata(self) -> Optional[Dict[str, Any]]:
        meta_path = self.models_dir / "metadata.json"
        if not meta_path.exists():
            return None
        with open(meta_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def get_labels(self) -> Optional[Dict[str, Any]]:
        labels_path = self.models_dir / "labels.json"
        if not labels_path.exists():
            return None
        with open(labels_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def get_metrics(self) -> Optional[Dict[str, Any]]:
        metrics_path = self.models_dir / "metrics.json"
        if not metrics_path.exists():
            return None
        with open(metrics_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def get_comparison(self) -> Optional[Dict[str, Any]]:
        comp_path = self.models_dir / "comparison.json"
        if not comp_path.exists():
            return None
        with open(comp_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def get_confusion_matrix(self) -> Optional[Dict[str, Any]]:
        cm_path = self.models_dir / "confusion_matrix.json"
        if not cm_path.exists():
            return None
        with open(cm_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def get_classification_report(self) -> Optional[Dict[str, Any]]:
        cr_path = self.models_dir / "classification_report.json"
        if not cr_path.exists():
            return None
        with open(cr_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def get_onnx_path(self) -> Optional[Path]:
        onnx_file = self.models_dir / "model.onnx"
        if onnx_file.exists():
            return onnx_file
        return None

    def _get_or_load_model(self) -> Tuple[Any, List[str], Dict[str, Any]]:
        pkl_path = self.models_dir / "model.pkl"
        if not pkl_path.exists():
            raise FileNotFoundError("Trained model binary 'model.pkl' does not exist. Train a model first.")

        mtime = pkl_path.stat().st_mtime
        if self._cached_model is None or mtime > self._cached_model_mtime:
            self._cached_model = joblib.load(pkl_path)
            self._cached_model_mtime = mtime
            self._cached_labels = self.get_labels()
            self._cached_metadata = self.get_metadata()

        classes = self._cached_labels.get("classes", []) if self._cached_labels else []
        meta = self._cached_metadata or {}
        return self._cached_model, classes, meta

    def predict(
        self,
        landmarks: List[List[float]],
        hand: str = "Right",
        is_mirrored: bool = False,
    ) -> Dict[str, Any]:
        """
        Runs real-time inference on a single 21-landmark frame with feature extraction
        and threshold-based UNKNOWN rejection.
        """
        model, classes, meta = self._get_or_load_model()

        # 1. Feature extraction
        features = preprocess_landmarks(landmarks, hand=hand, is_mirrored=is_mirrored)
        X = features.reshape(1, -1).astype(np.float32)

        # 2. Time inference
        t0 = time.perf_counter()
        if hasattr(model, "predict_proba"):
            probs = model.predict_proba(X)[0]
            max_idx = int(np.argmax(probs))
            confidence = float(probs[max_idx])
        else:
            pred_val = model.predict(X)[0]
            max_idx = int(pred_val) if isinstance(pred_val, (int, np.integer)) else classes.index(pred_val)
            confidence = 1.0
        t1 = time.perf_counter()
        latency_ms = round((t1 - t0) * 1000.0, 3)

        raw_label = classes[max_idx] if max_idx < len(classes) else str(max_idx)

        # 3. Threshold check
        threshold_info = meta.get("unknown_threshold", {})
        tau = float(threshold_info.get("optimal_threshold", 0.65))

        is_unknown = confidence < tau
        final_label = "UNKNOWN" if is_unknown else raw_label
        rejection_reason = (
            f"Confidence {confidence:.2f} is below acceptance threshold {tau:.2f}"
            if is_unknown
            else None
        )

        model_name = meta.get("selected_model", type(model).__name__)
        calibrated = "Platt" in str(meta) or "Softmax" in str(meta) or "Calibrated" in str(type(model))

        return {
            "label": final_label,
            "raw_label": raw_label,
            "confidence": round(confidence, 4),
            "threshold": round(tau, 3),
            "is_unknown": is_unknown,
            "rejection_reason": rejection_reason,
            "is_calibrated": calibrated,
            "calibration_note": "Platt calibrated probabilities" if calibrated else "Ensemble voting score",
            "inference_latency_ms": latency_ms,
            "model_name": model_name,
            "feature_vector_length": len(features),
        }

    def get_training_status(self) -> Dict[str, Any]:
        with self._lock:
            return dict(self._train_state)

    def _run_training_job(
        self,
        models_to_train: List[str],
        seed: int,
        min_samples_per_class: int,
    ):
        def log_cb(msg: str):
            with self._lock:
                self._train_state["logs"].append(f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] {msg}")

        try:
            log_cb(f"Starting background training with models={models_to_train}, seed={seed}")
            results = train_and_evaluate_models(
                data_dir=self.data_dir,
                output_dir=self.models_dir,
                models_to_train=models_to_train,
                seed=seed,
                min_samples_per_class=min_samples_per_class,
                logger_callback=log_cb,
            )
            with self._lock:
                self._train_state["status"] = "completed"
                self._train_state["end_time"] = datetime.now(timezone.utc).isoformat()
                self._train_state["best_model"] = results["best_model"]
                self._train_state["metrics_summary"] = {
                    "accuracy": results["metrics"]["test_metrics"]["accuracy"],
                    "macro_f1": results["metrics"]["test_metrics"]["macro_f1"],
                    "latency_median_ms": results["metrics"]["latency_benchmark"]["median_ms"],
                }
                self._train_state["error"] = None
                self._cached_model = None  # Force reload on next prediction
            log_cb("Training job finished successfully.")
        except Exception as e:
            with self._lock:
                self._train_state["status"] = "failed"
                self._train_state["end_time"] = datetime.now(timezone.utc).isoformat()
                self._train_state["error"] = str(e)
            log_cb(f"Training failed: {str(e)}")

    def start_training_job(
        self,
        models: Optional[List[str]] = None,
        seed: int = 42,
        min_samples_per_class: int = 5,
    ) -> Dict[str, Any]:
        with self._lock:
            if self._train_state["status"] == "running":
                raise ValueError("A training job is already in progress. Please check /status.")

            models_to_train = models or ["RandomForest", "SVM", "KNN", "MLP"]
            self._train_state = {
                "status": "running",
                "start_time": datetime.now(timezone.utc).isoformat(),
                "end_time": None,
                "logs": [f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] Job queued."],
                "error": None,
                "best_model": None,
                "metrics_summary": None,
            }

        thread = threading.Thread(
            target=self._run_training_job,
            args=(models_to_train, seed, min_samples_per_class),
            daemon=True,
        )
        thread.start()

        return {"status": "started", "message": "Training job initiated in background."}


model_service = ModelService()
