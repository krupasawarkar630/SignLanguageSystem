"""
FastAPI Model Management Endpoints
Provides REST APIs for inspecting model metadata, evaluation metrics, comparisons,
downloading ONNX binaries, real-time prediction, and triggering / monitoring training jobs.
"""
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import FileResponse

from backend.schemas.model import (
    ModelMetadataResponse,
    ModelMetricsResponse,
    ModelComparisonResponse,
    TrainRequest,
    TrainStatusResponse,
    PredictRequest,
    PredictResponse,
)
from backend.services.model_service import model_service

router = APIRouter(prefix="/api/model", tags=["Model"])


@router.get(
    "/metadata",
    response_model=ModelMetadataResponse,
    summary="Get active model metadata & provenance",
)
async def get_model_metadata():
    """Retrieve active model architecture, parameters, dataset hash, and parity verification."""
    data = model_service.get_metadata()
    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No trained model found. Please run training first via POST /api/model/train or 'python train.py'.",
        )
    return data


@router.get(
    "/labels",
    summary="Get active model label mappings",
)
async def get_model_labels():
    """Retrieve class labels and index mappings for the active model."""
    data = model_service.get_labels()
    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No labels found. Please train a model first.",
        )
    return data


@router.get(
    "/onnx",
    summary="Download active ONNX model binary",
)
async def get_onnx_model():
    """Download the float32 ONNX model binary for browser WASM execution."""
    onnx_path = model_service.get_onnx_path()
    if not onnx_path or not onnx_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No ONNX model found. Please train a model first.",
        )
    return FileResponse(
        path=str(onnx_path),
        media_type="application/octet-stream",
        filename="model.onnx",
    )


@router.get(
    "/metrics",
    response_model=ModelMetricsResponse,
    summary="Get test evaluation metrics for the active model",
)
async def get_model_metrics():
    """Retrieve test accuracy, macro F1, latency benchmarks, and calibration details."""
    data = model_service.get_metrics()
    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No trained model metrics found. Please train a model first.",
        )
    return data


@router.get(
    "/comparison",
    response_model=ModelComparisonResponse,
    summary="Get model comparison across all evaluated algorithms",
)
async def get_model_comparison():
    """Retrieve side-by-side benchmark comparison of RandomForest, SVM, KNN, and MLP."""
    data = model_service.get_comparison()
    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No model comparison found. Please run training to compare models.",
        )
    return data


@router.get(
    "/confusion-matrix",
    summary="Get confusion matrix on test set",
)
async def get_confusion_matrix():
    """Retrieve 2D confusion matrix with label mappings."""
    data = model_service.get_confusion_matrix()
    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No confusion matrix found. Please train a model first.",
        )
    return data


@router.get(
    "/classification-report",
    summary="Get detailed classification report on test set",
)
async def get_classification_report():
    """Retrieve per-class precision, recall, and F1 scores."""
    data = model_service.get_classification_report()
    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No classification report found. Please train a model first.",
        )
    return data


@router.post(
    "/predict",
    response_model=PredictResponse,
    summary="Run real-time inference on landmark frame",
)
async def predict_landmarks(req: PredictRequest):
    """Run real-time landmark classification with feature extraction & threshold checking."""
    try:
        result = model_service.predict(
            landmarks=req.landmarks,
            hand=req.hand,
            is_mirrored=req.is_mirrored,
        )
        return result
    except FileNotFoundError as fnf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(fnf))
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference failed: {str(e)}",
        )


@router.post(
    "/train",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Start background ML training job",
)
async def start_training(req: TrainRequest = TrainRequest()):
    """Trigger an asynchronous training job across specified candidate models."""
    try:
        result = model_service.start_training_job(
            models=req.models,
            seed=req.seed,
            min_samples_per_class=req.min_samples_per_class,
        )
        return result
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start training: {str(e)}",
        )


@router.get(
    "/train/status",
    response_model=TrainStatusResponse,
    summary="Get training job status and logs",
)
async def get_training_status():
    """Poll the status, progress logs, and output metrics of the ML training job."""
    return model_service.get_training_status()
