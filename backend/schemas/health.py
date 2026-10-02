"""
Health check schema definitions.
"""
from datetime import datetime, timezone
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(default="healthy", description="Current status of the backend API")
    service: str = Field(default="gestura-backend", description="Service identifier")
    version: str = Field(default="0.1.0", description="API semantic version")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="UTC timestamp of the health check")
    uptime_seconds: float = Field(..., description="Server uptime in seconds")
