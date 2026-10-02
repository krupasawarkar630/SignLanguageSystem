"""
Unit and Integration Tests for GESTURA ML Pipeline & Endpoints
"""
import json
import shutil
from pathlib import Path
import numpy as np
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from ml.dataset import (
    load_dataset_for_training,
    validate_and_extract_features,
)
from ml.trainer import (
    train_and_evaluate_models,
    benchmark_inference_latency,
    search_unknown_threshold,
    verify_onnx_parity,
)


@pytest.fixture
def mock_dataset_dir(tmp_path: Path) -> Path:
    """Generates a structured multi-class fixture dataset in tmp_path."""
    data_dir = tmp_path / "data"
    raw_dir = data_dir / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)
    
    # Load canonical fixture landmark vector
    fixture_path = Path("data/metadata/fixture_vectors.json")
    with open(fixture_path, "r", encoding="utf-8") as f:
        fixtures_data = json.load(f)

    fixtures_list = fixtures_data["fixtures"]
    open_hand = fixtures_list[0]["rawLandmarks"]
    fist = fixtures_list[1]["rawLandmarks"]

    # Generate 15 samples of OPEN_HAND across 2 sessions and 15 samples of FIST across 2 sessions
    samples = []
    for i in range(15):
        samples.append({
            "id": f"sample_open_{i}",
            "label": "OPEN_HAND",
            "hand": "Right",
            "landmarks": open_hand,
            "session_id": "session_1" if i < 8 else "session_2",
            "created_at": "2026-10-02T10:00:00Z",
        })
    for i in range(15):
        samples.append({
            "id": f"sample_fist_{i}",
            "label": "FIST",
            "hand": "Right",
            "landmarks": fist,
            "session_id": "session_1" if i < 8 else "session_2",
            "created_at": "2026-10-02T10:00:00Z",
        })

    with open(raw_dir / "samples.jsonl", "w", encoding="utf-8") as f:
        for s in samples:
            f.write(json.dumps(s) + "\n")

    return data_dir


def test_guard_rail_empty_dataset(tmp_path: Path):
    """Dataset loader must raise ValueError when dataset is empty."""
    empty_dir = tmp_path / "empty_data"
    empty_dir.mkdir()
    with pytest.raises(ValueError, match="Dataset is empty"):
        load_dataset_for_training(empty_dir)


def test_guard_rail_single_class(tmp_path: Path):
    """Dataset loader must raise ValueError when < 2 classes exist."""
    data_dir = tmp_path / "single_class"
    raw_dir = data_dir / "raw"
    raw_dir.mkdir(parents=True)
    samples = [
        {"id": f"s_{i}", "label": "SINGLE_CLASS", "hand": "Right", "landmarks": [[0.1, 0.2, 0.3]] * 21}
        for i in range(10)
    ]
    with open(raw_dir / "samples.jsonl", "w", encoding="utf-8") as f:
        for s in samples:
            f.write(json.dumps(s) + "\n")

    with pytest.raises(ValueError, match="requires at least 2 distinct gesture classes"):
        load_dataset_for_training(data_dir, min_samples_per_class=3)


def test_guard_rail_insufficient_samples_per_class(tmp_path: Path):
    """Dataset loader must raise ValueError with detailed class breakdown if counts < min_samples."""
    data_dir = tmp_path / "low_samples"
    raw_dir = data_dir / "raw"
    raw_dir.mkdir(parents=True)
    samples = [
        {"id": "s_1", "label": "CLASS_A", "hand": "Right", "landmarks": [[0.1, 0.2, 0.3]] * 21},
        {"id": "s_2", "label": "CLASS_B", "hand": "Right", "landmarks": [[0.1, 0.2, 0.3]] * 21},
    ]
    with open(raw_dir / "samples.jsonl", "w", encoding="utf-8") as f:
        for s in samples:
            f.write(json.dumps(s) + "\n")

    with pytest.raises(ValueError, match="Insufficient samples for training"):
        load_dataset_for_training(data_dir, min_samples_per_class=5)


def test_feature_extraction_pipeline(mock_dataset_dir: Path):
    """Feature extraction must yield (N, 82) float32 arrays and matched labels."""
    dataset = load_dataset_for_training(mock_dataset_dir, min_samples_per_class=5, seed=42)
    assert dataset["X_train"].shape[1] == 82
    assert dataset["X_train"].dtype == np.float32
    assert len(dataset["classes"]) == 2
    assert "OPEN_HAND" in dataset["classes"]
    assert "FIST" in dataset["classes"]


def test_end_to_end_training_and_artifacts(mock_dataset_dir: Path, tmp_path: Path):
    """Full pipeline execution produces all 8 artifacts and valid ONNX parity."""
    output_dir = tmp_path / "models_out"
    
    results = train_and_evaluate_models(
        data_dir=mock_dataset_dir,
        output_dir=output_dir,
        models_to_train=["RandomForest", "SVM", "KNN", "MLP"],
        seed=42,
        min_samples_per_class=5,
    )

    # Verify best model selected
    assert results["best_model"] in ["RandomForest", "SVM", "KNN", "MLP"]
    
    # Verify all 8 files exist
    expected_files = [
        "model.pkl",
        "model.onnx",
        "labels.json",
        "metadata.json",
        "metrics.json",
        "confusion_matrix.json",
        "classification_report.json",
        "comparison.json",
    ]
    for filename in expected_files:
        p = output_dir / filename
        assert p.exists(), f"Expected artifact {filename} was not created"
        assert p.stat().st_size > 0, f"Artifact {filename} is empty"

    # Verify ONNX Parity Status
    meta = results["metadata"]
    assert meta["onnx_parity_verification"]["status"] == "PASSED"
    assert meta["onnx_parity_verification"]["label_match_rate"] == 1.0

    # Verify Unknown Threshold Discovery
    assert 0.40 <= meta["unknown_threshold"]["optimal_threshold"] <= 0.95
    assert meta["unknown_threshold"]["strategy"] == "validation_accuracy_coverage_tradeoff"

    # Verify Latency Benchmarks
    latency = results["metrics"]["latency_benchmark"]
    assert latency["median_ms"] > 0.0
    assert latency["p95_ms"] >= latency["median_ms"]


def test_backend_model_api_endpoints():
    """Verify FastAPI model inspection endpoints return real serialized data."""
    client = TestClient(app)
    
    # 1. Metadata endpoint
    res = client.get("/api/model/metadata")
    assert res.status_code == 200
    meta = res.json()
    assert meta["feature_dimensions"] == 82
    assert "RandomForest" in ["RandomForest", "SVM", "KNN", "MLP"]

    # 2. Metrics endpoint
    res = client.get("/api/model/metrics")
    assert res.status_code == 200
    metrics = res.json()
    assert "test_metrics" in metrics
    assert "latency_benchmark" in metrics

    # 3. Comparison endpoint
    res = client.get("/api/model/comparison")
    assert res.status_code == 200
    comp = res.json()
    assert "models" in comp
    assert "best_model" in comp

    # 4. Confusion Matrix endpoint
    res = client.get("/api/model/confusion-matrix")
    assert res.status_code == 200
    cm = res.json()
    assert "matrix" in cm
    assert "labels" in cm

    # 5. Training Status endpoint
    res = client.get("/api/model/train/status")
    assert res.status_code == 200
    status_data = res.json()
    assert status_data["status"] in ["idle", "running", "completed", "failed"]
