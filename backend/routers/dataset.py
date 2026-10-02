"""
FastAPI Dataset Endpoints
Provides REST APIs for creating samples, batch recording, querying, statistics, and exporting.
"""
from typing import Optional, Literal
from fastapi import APIRouter, HTTPException, Query, Response, status
from fastapi.responses import PlainTextResponse

from backend.schemas.dataset import (
    SampleCreate,
    BatchSampleCreate,
    SampleResponse,
    SampleListResponse,
    DatasetStats,
    DeleteResult,
)
from backend.services.dataset_service import dataset_service

router = APIRouter(prefix="/api/dataset", tags=["Dataset"])


@router.post(
    "/samples",
    response_model=SampleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record a landmark sample",
)
async def create_sample(sample_in: SampleCreate):
    """
    Persist a 21-landmark mathematical coordinate vector with validation.
    No images or video frames are stored.
    """
    try:
        sample = dataset_service.create_sample(sample_in)
        return sample
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to persist sample: {str(e)}",
        )


@router.post(
    "/samples/batch",
    response_model=list[SampleResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Record a burst batch of samples",
)
async def create_samples_batch(batch_in: BatchSampleCreate):
    """Atomically record multiple samples captured during burst collection."""
    try:
        samples = dataset_service.create_samples_batch(batch_in)
        return samples
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record batch: {str(e)}",
        )


@router.get(
    "/samples",
    response_model=SampleListResponse,
    summary="List recorded samples with filtering",
)
async def list_samples(
    label: Optional[str] = Query(None, description="Filter by gesture label"),
    hand: Optional[str] = Query(None, description="Filter by hand (left, right, unspecified)"),
    source: Optional[str] = Query(None, description="Filter by source"),
    session_id: Optional[str] = Query(None, description="Filter by capture session"),
    limit: int = Query(50, ge=1, le=500, description="Page limit"),
    offset: int = Query(0, ge=0, description="Page offset"),
):
    """Retrieve samples with optional label and handedness filtering."""
    samples, total = dataset_service.list_samples(
        label=label,
        hand=hand,
        source=source,
        session_id=session_id,
        limit=limit,
        offset=offset,
    )
    return SampleListResponse(
        total=total,
        limit=limit,
        offset=offset,
        samples=samples,
    )


@router.get(
    "/samples/{sample_id}",
    response_model=SampleResponse,
    summary="Get single sample details",
)
async def get_sample(sample_id: str):
    sample = dataset_service.get_sample(sample_id)
    if not sample:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sample '{sample_id}' not found",
        )
    return sample


@router.delete(
    "/samples/{sample_id}",
    response_model=DeleteResult,
    summary="Delete a sample",
)
async def delete_sample(sample_id: str):
    deleted = dataset_service.delete_sample(sample_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sample '{sample_id}' not found",
        )
    return DeleteResult(
        success=True,
        deleted_count=1,
        message=f"Sample '{sample_id}' deleted successfully",
    )


@router.delete(
    "/labels/{label}",
    response_model=DeleteResult,
    summary="Delete all samples for a gesture class",
)
async def delete_label(label: str):
    count = dataset_service.delete_label(label)
    return DeleteResult(
        success=True,
        deleted_count=count,
        message=f"Deleted {count} samples for gesture class '{label.upper()}'",
    )


@router.get(
    "/stats",
    response_model=DatasetStats,
    summary="Compute real dataset statistics & class balance",
)
async def get_stats():
    """Compute real sample distribution, class imbalance ratios, and counts."""
    return dataset_service.get_dataset_stats()


@router.get(
    "/export",
    summary="Export dataset as JSON or CSV file",
)
async def export_dataset(
    format: Literal["json", "csv"] = Query("json", description="Export format (json or csv)")
):
    """Download the full dataset in structured JSON or tabular flattened CSV format."""
    content = dataset_service.export_dataset(format_type=format)
    if format == "csv":
        return Response(
            content=content,
            media_type="text/csv",
            headers={"Content-Disposition": 'attachment; filename="gestura_dataset.csv"'},
        )
    else:
        return Response(
            content=content,
            media_type="application/json",
            headers={"Content-Disposition": 'attachment; filename="gestura_dataset.json"'},
        )
