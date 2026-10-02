"""
Pydantic Schemas for GESTURA ML Model Endpoints
"""
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ModelMetadataResponse(BaseModel):
    version: str
    created_at: str
    selected_model: str
    feature_spec_version: str
    feature_dimensions: int
    classes: List[str]
    class_counts: Dict[str, int]
    total_samples: int
    split_counts: Dict[str, int]
    dataset_hash: str
    unknown_threshold: Dict[str, Any]
    onnx_parity_verification: Dict[str, Any]
    guard_rail_warnings: List[str]
    library_versions: Dict[str, str]


class ModelMetricsResponse(BaseModel):
    model_name: str
    test_metrics: Dict[str, float]
    validation_metrics: Dict[str, float]
    latency_benchmark: Dict[str, Any]
    training_time_ms: float
    cross_val_macro_f1: Optional[float] = None
    model_size_bytes: int
    calibration_status: str


class ModelComparisonResponse(BaseModel):
    best_model: str
    evaluated_at: str
    models: Dict[str, Any]


class TrainRequest(BaseModel):
    seed: int = Field(42, description="Random seed for deterministic reproducibility")
    models: Optional[List[str]] = Field(
        default=["RandomForest", "SVM", "KNN", "MLP"],
        description="Models to evaluate",
    )
    min_samples_per_class: int = Field(
        5,
        ge=2,
        description="Minimum samples per class required before training is permitted",
    )


class TrainStatusResponse(BaseModel):
    status: str = Field(..., description="'idle' | 'running' | 'completed' | 'failed'")
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    logs: List[str] = []
    error: Optional[str] = None
    best_model: Optional[str] = None
    metrics_summary: Optional[Dict[str, Any]] = None


class PredictRequest(BaseModel):
    landmarks: List[List[float]] = Field(
        ...,
        description="21 hand landmarks [[x,y,z], ...]",
        min_length=21,
        max_length=21,
    )
    hand: str = Field("Right", description="Handedness ('Left' or 'Right')")
    is_mirrored: bool = Field(False, description="Whether camera feed is mirrored")


class PredictResponse(BaseModel):
    label: str
    raw_label: str
    confidence: float
    threshold: float
    is_unknown: bool
    rejection_reason: Optional[str] = None
    is_calibrated: bool
    calibration_note: str
    inference_latency_ms: float
    model_name: str
    feature_vector_length: int
