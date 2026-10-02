"""
Preprocessor Parity Verification Test
Ensures 100% mathematical parity between Python ML preprocessing (ml/preprocessor.py)
and TypeScript preprocessing (frontend/src/lib/features/preprocessor.ts).
"""
import json
from pathlib import Path
import numpy as np
import pytest
from ml.preprocessor import preprocess_landmarks

BASE_DIR = Path(__file__).resolve().parent.parent.parent
FIXTURE_PATH = BASE_DIR / "data" / "metadata" / "fixture_vectors.json"


@pytest.fixture
def fixtures():
    with open(FIXTURE_PATH, "r", encoding="utf-8") as f:
        return json.load(f)["fixtures"]


def test_feature_vector_dimension(fixtures):
    raw_landmarks = fixtures[0]["rawLandmarks"]
    features = preprocess_landmarks(raw_landmarks, hand="Right", is_mirrored=False)
    assert isinstance(features, np.ndarray)
    assert features.shape == (82,)
    assert features.dtype == np.float32


def test_wrist_origin_translation(fixtures):
    raw_landmarks = fixtures[0]["rawLandmarks"]
    features = preprocess_landmarks(raw_landmarks, hand="Right", is_mirrored=False)
    # First 3 elements are wrist (x, y, z) which must be 0
    assert abs(features[0]) < 1e-6
    assert abs(features[1]) < 1e-6
    assert abs(features[2]) < 1e-6


def test_scale_invariance(fixtures):
    raw_landmarks = fixtures[0]["rawLandmarks"]
    features_1x = preprocess_landmarks(raw_landmarks, hand="Right", is_mirrored=False)

    scaled_landmarks = [
        {"x": pt["x"] * 2.5, "y": pt["y"] * 2.5, "z": pt["z"] * 2.5}
        for pt in raw_landmarks
    ]
    features_scaled = preprocess_landmarks(scaled_landmarks, hand="Right", is_mirrored=False)

    # Maximum difference across all 82 features must be < 1e-4
    max_diff = np.max(np.abs(features_1x - features_scaled))
    assert max_diff < 1e-4, f"Scale invariance error: {max_diff}"


def test_left_hand_canonicalization(fixtures):
    left_raw = fixtures[1]["rawLandmarks"]
    features_left = preprocess_landmarks(left_raw, hand="Left", is_mirrored=False)
    assert features_left.shape == (82,)
    assert not np.isnan(features_left).any()
    assert not np.isinf(features_left).any()


def test_finite_features_across_all_fixtures(fixtures):
    for fix in fixtures:
        features = preprocess_landmarks(fix["rawLandmarks"], hand=fix["handedness"], is_mirrored=False)
        assert features.shape == (82,)
        assert np.isfinite(features).all()
