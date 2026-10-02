"""
Health check router.
"""
import time
from fastapi import APIRouter
from backend.schemas.health import HealthResponse
from backend.core.config import get_settings

router = APIRouter(tags=["Health"])
START_TIME = time.time()
settings = get_settings()


@router.get("/health", response_model=HealthResponse, summary="Backend Health Check")
async def health_check():
    """
    Returns server operational status, version, and uptime.
    Used by the frontend to confirm real-time backend connectivity.
    """
    return HealthResponse(
        status="healthy",
        service="gestura-backend",
        version=settings.APP_VERSION,
        uptime_seconds=round(time.time() - START_TIME, 2),
    )
