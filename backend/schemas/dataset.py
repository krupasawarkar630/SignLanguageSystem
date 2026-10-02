"""
Pydantic Schemas for GESTURA Dataset Pipeline
Defines strict mathematical validation for 21-landmark 3D coordinate vectors.
"""
from datetime import datetime, timezone
import math
import re
from typing import List, Dict, Optional, Literal
from pydantic import BaseModel, Field, field_validator, model_validator


class Point3D(BaseModel):
    x: float = Field(..., description="Normalized X coordinate [0.0, 1.0]")
    y: float = Field(..., description="Normalized Y coordinate [0.0, 1.0]")
    z: float = Field(..., description="Relative Z depth coordinate")

    @field_validator("x", "y", "z")
    @classmethod
    def check_finite(cls, v: float) -> float:
        if math.isnan(v) or math.isinf(v):
            raise ValueError("Landmark coordinates must be finite numbers (no NaN or Inf)")
        return v


class SampleBase(BaseModel):
    label: str = Field(..., min_length=1, max_length=32, description="Gesture class identifier")
    hand: Literal["left", "right", "unspecified"] = Field(
        default="unspecified", description="Handedness of the captured gesture"
    )
    landmarks: List[Point3D] = Field(
        ..., min_length=21, max_length=21, description="21 3D joint landmark coordinates"
    )
    handedness_score: float = Field(
        default=1.0, ge=0.0, le=1.0, description="MediaPipe handedness classification confidence"
    )
    source: Literal["collected", "custom", "demo"] = Field(
        default="collected", description="Provenance of the dataset sample"
    )
    session_id: str = Field(
        default="default_session", min_length=1, max_length=64, description="Session grouping ID"
    )

    @field_validator("label")
    @classmethod
    def validate_label(cls, v: str) -> str:
        clean = v.strip()
        if not clean:
            raise ValueError("Label cannot be empty or whitespace only")
        if not re.match(r"^[a-zA-Z0-9_\-\s]+$", clean):
            raise ValueError("Label can only contain alphanumeric characters, hyphens, underscores, and spaces")
        return clean.upper()


class SampleCreate(SampleBase):
    pass


class BatchSampleCreate(BaseModel):
    samples: List[SampleCreate] = Field(
        ..., min_length=1, max_length=500, description="Batch of samples for burst capture"
    )


class SampleResponse(SampleBase):
    id: str = Field(..., description="Unique sample identifier")
    created_at: str = Field(..., description="ISO 8601 UTC creation timestamp")


class SampleListResponse(BaseModel):
    total: int
    limit: int
    offset: int
    samples: List[SampleResponse]


class DatasetStats(BaseModel):
    total_samples: int = Field(..., description="Total count of samples in dataset")
    class_counts: Dict[str, int] = Field(default_factory=dict, description="Sample counts per gesture label")
    hand_counts: Dict[str, int] = Field(default_factory=dict, description="Sample counts per hand")
    session_count: int = Field(default=0, description="Count of distinct capture sessions")
    imbalance_ratio: float = Field(default=1.0, description="Max class count / min class count")
    has_imbalance: bool = Field(default=False, description="True if max/min class count exceeds 3.0")
    imbalance_warning: Optional[str] = Field(default=None, description="Actionable recommendation if imbalanced")
    low_sample_classes: List[str] = Field(
        default_factory=list, description="Classes with fewer than recommended samples (<20)"
    )


class DeleteResult(BaseModel):
    success: bool
    deleted_count: int
    message: str
