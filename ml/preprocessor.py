"""
GESTURA Feature Preprocessor (Python Implementation)
Strict mathematical parity implementation of docs/PREPROCESSING.md.
Converts 21 raw MediaPipe 3D landmarks into a canonical 82-dimensional feature vector.
"""
import math
from typing import List, Dict, Union, Any, Tuple
import numpy as np


def euclidean_distance(p1: Union[Dict[str, float], np.ndarray], p2: Union[Dict[str, float], np.ndarray]) -> float:
    if isinstance(p1, dict) and isinstance(p2, dict):
        dx = p1["x"] - p2["x"]
        dy = p1["y"] - p2["y"]
        dz = p1["z"] - p2["z"]
    else:
        dx = p1[0] - p2[0]
        dy = p1[1] - p2[1]
        dz = p1[2] - p2[2]
    return math.sqrt(dx * dx + dy * dy + dz * dz)


def dot_product(v1: np.ndarray, v2: np.ndarray) -> float:
    return float(np.dot(v1, v2))


def vector_length(v: np.ndarray) -> float:
    return float(np.linalg.norm(v))


def cross_product(u: np.ndarray, v: np.ndarray) -> np.ndarray:
    return np.cross(u, v)


def preprocess_landmarks(
    landmarks: List[Dict[str, float]],
    hand: str = "Right",
    is_mirrored: bool = False,
) -> np.ndarray:
    """
    Transforms 21 raw 3D landmarks into a canonical 82D feature vector.

    Args:
        landmarks: List of 21 dictionaries with keys 'x', 'y', 'z'.
        hand: 'Right', 'Left', 'right', 'left', or 'unspecified'.
        is_mirrored: Boolean indicating if input came from mirrored selfie video.

    Returns:
        np.ndarray of shape (82,) and dtype np.float32.
    """
    if len(landmarks) != 21:
        raise ValueError(f"preprocess_landmarks requires exactly 21 landmarks, received {len(landmarks)}")

    # Convert to Nx3 numpy array
    raw_coords = np.array([[pt["x"], pt["y"], pt["z"]] for pt in landmarks], dtype=np.float64)

    # 1. Wrist-Origin Translation (P_0 at (0, 0, 0))
    wrist = raw_coords[0]
    translated = raw_coords - wrist

    # 2. Scale Normalization (Distance from Wrist to Middle MCP [9])
    middle_mcp = translated[9]
    scale = float(np.linalg.norm(middle_mcp))
    scale_factor = scale if scale > 1e-6 else 1.0
    normalized = translated / scale_factor

    # 3. Handedness Mirroring Canonicalization
    effective_hand = hand.strip().capitalize()
    if is_mirrored:
        effective_hand = "Right" if effective_hand == "Left" else "Left"

    is_left = effective_hand == "Left"
    canonical = normalized.copy()
    if is_left:
        canonical[:, 0] = -canonical[:, 0]

    # 63D Normalized Coordinates (flattened)
    norm_63d = canonical.flatten()

    # 4. Engineered Features
    # 4.1 Finger Extension Ratios (5 fingers: [Tip, MCP])
    finger_pairs = [(4, 2), (8, 5), (12, 9), (16, 13), (20, 17)]
    finger_extensions = []
    for tip_idx, mcp_idx in finger_pairs:
        tip_dist = float(np.linalg.norm(canonical[tip_idx]))
        mcp_dist = float(np.linalg.norm(canonical[mcp_idx]))
        ratio = (tip_dist / mcp_dist) if mcp_dist > 1e-6 else 0.0
        finger_extensions.append(ratio)

    # 4.2 Inter-Fingertip Distances (6 key pairs)
    tip_dist_pairs = [(4, 8), (8, 12), (12, 16), (16, 20), (4, 20), (4, 12)]
    key_distances = [
        float(np.linalg.norm(canonical[i] - canonical[j]))
        for i, j in tip_dist_pairs
    ]

    # 4.3 Joint Flexion Cosine Angles (5 angles: [Base, Mid, Tip])
    angle_triplets = [
        (1, 2, 4),    # Thumb: CMC -> MCP -> Tip
        (5, 6, 8),    # Index: MCP -> PIP -> Tip
        (9, 10, 12),  # Middle: MCP -> PIP -> Tip
        (13, 14, 16), # Ring: MCP -> PIP -> Tip
        (17, 18, 20), # Pinky: MCP -> PIP -> Tip
    ]
    joint_angles = []
    for base_idx, mid_idx, tip_idx in angle_triplets:
        u = canonical[base_idx] - canonical[mid_idx]
        v = canonical[tip_idx] - canonical[mid_idx]
        len_u = float(np.linalg.norm(u))
        len_v = float(np.linalg.norm(v))
        denom = len_u * len_v + 1e-7
        cos_val = float(np.dot(u, v)) / denom
        joint_angles.append(cos_val)

    # 4.4 Palm Normal Unit Vector (Cross product of Index MCP [5] and Pinky MCP [17])
    u_palm = canonical[5]
    v_palm = canonical[17]
    normal_raw = np.cross(u_palm, v_palm)
    normal_len = float(np.linalg.norm(normal_raw)) + 1e-7
    palm_normal = (normal_raw / normal_len).tolist()

    # Concatenate into 82D vector
    feature_vector = np.concatenate([
        norm_63d,
        np.array(finger_extensions, dtype=np.float64),
        np.array(key_distances, dtype=np.float64),
        np.array(joint_angles, dtype=np.float64),
        np.array(palm_normal, dtype=np.float64),
    ]).astype(np.float32)

    return feature_vector


def extract_features_from_sample(sample_dict: Dict[str, Any]) -> Tuple[np.ndarray, str]:
    """Helper to preprocess a sample dictionary and return (feature_vector, label)."""
    landmarks = sample_dict["landmarks"]
    hand = sample_dict.get("hand", "Right")
    label = sample_dict.get("label", "UNKNOWN").upper()
    features = preprocess_landmarks(landmarks, hand=hand, is_mirrored=False)
    return features, label
