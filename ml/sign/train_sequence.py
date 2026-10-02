import os
import json
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import numpy as np
from pathlib import Path
from sklearn.metrics import accuracy_score, f1_score, confusion_matrix

# --------------------------
# 1. PREPROCESSING
# --------------------------
def normalize_landmarks(features):
    """
    Features array is (seq_len, 33*3 + 21*3 + 21*3)
    Indices:
    Pose: 0 to 98 (33 landmarks * 3 coords)
    Left Hand: 99 to 161 (21 * 3)
    Right Hand: 162 to 224 (21 * 3)
    
    MediaPipe Pose Landmark indices:
    11: Left Shoulder, 12: Right Shoulder
    """
    if features.shape[0] == 0:
        return features
        
    seq_len = features.shape[0]
    out_features = np.copy(features)
    
    for i in range(seq_len):
        # Extract shoulders
        ls_x, ls_y, ls_z = features[i, 11*3:11*3+3]
        rs_x, rs_y, rs_z = features[i, 12*3:12*3+3]
        
        # Center = midpoint between shoulders
        cx = (ls_x + rs_x) / 2
        cy = (ls_y + rs_y) / 2
        cz = (ls_z + rs_z) / 2
        
        # Scale = shoulder width (Euclidean distance)
        shoulder_width = max(np.sqrt((ls_x - rs_x)**2 + (ls_y - rs_y)**2 + (ls_z - rs_z)**2), 1e-4)
        
        # Normalize everything
        for j in range(0, features.shape[1], 3):
            # If coordinates are all exactly 0, they are missing/masked, don't normalize them to center
            if features[i, j] == 0 and features[i, j+1] == 0 and features[i, j+2] == 0:
                continue
            out_features[i, j]   = (features[i, j]   - cx) / shoulder_width
            out_features[i, j+1] = (features[i, j+1] - cy) / shoulder_width
            out_features[i, j+2] = (features[i, j+2] - cz) / shoulder_width
            
    return out_features

def resample_sequence(features, masks, target_length=32):
    """Resample to fixed length using linear interpolation."""
    seq_len = features.shape[0]
    if seq_len == target_length:
        return features, masks
    
    if seq_len == 0:
        return np.zeros((target_length, features.shape[1])), np.ones((target_length, masks.shape[1]))
        
    indices = np.linspace(0, seq_len - 1, target_length)
    
    # Feature interpolation
    resampled_features = np.zeros((target_length, features.shape[1]))
    for i in range(features.shape[1]):
        resampled_features[:, i] = np.interp(indices, np.arange(seq_len), features[:, i])
        
    # Mask interpolation (nearest neighbor is safer for masks)
    resampled_masks = np.zeros((target_length, masks.shape[1]))
    nearest_indices = np.round(indices).astype(int)
    for i in range(masks.shape[1]):
        resampled_masks[:, i] = masks[nearest_indices, i]
        
    return resampled_features, resampled_masks

# --------------------------
# 2. DATASET
# --------------------------
class SignDataset(Dataset):
    def __init__(self, split_files, label_map, target_length=32, is_train=False):
        self.samples = []
        self.labels = []
        self.target_length = target_length
        self.is_train = is_train
        
        for f in split_files:
            try:
                data = np.load(f["file"])
                features = data["features"]
                masks = data["masks"]
                label_str = str(data["label"]).upper().strip()
                
                if label_str not in label_map:
                    continue
                    
                features = normalize_landmarks(features)
                features, masks = resample_sequence(features, masks, target_length)
                
                # Combine features and masks (225 features + 2 masks = 227 dims)
                combined = np.concatenate([features, masks], axis=1).astype(np.float32)
                
                self.samples.append(combined)
                self.labels.append(label_map[label_str])
            except Exception as e:
                pass
                
    def __len__(self):
        return len(self.samples)
        
    def __getitem__(self, idx):
        x = self.samples[idx]
        y = self.labels[idx]
        
        # Augmentation (TRAIN ONLY)
        if self.is_train:
            # Random scaling (0.9 to 1.1)
            scale = np.random.uniform(0.9, 1.1)
            x[:, :225] *= scale
            
            # Temporal Jitter/Dropout (zero out a random frame 10% of the time)
            if np.random.rand() < 0.1:
                drop_idx = np.random.randint(0, self.target_length)
                x[drop_idx, :] = 0.0
                
            # Mirroring is NOT applied universally because ASL has directionality constraints (e.g. "J")
            
        return torch.tensor(x), torch.tensor(y, dtype=torch.long)

# --------------------------
# 3. MODELS
# --------------------------
class GRUBaseline(nn.Module):
    def __init__(self, input_dim=227, hidden_dim=128, num_classes=10):
        super().__init__()
        self.gru = nn.GRU(input_dim, hidden_dim, num_layers=2, batch_first=True, dropout=0.2)
        self.fc = nn.Linear(hidden_dim, num_classes)
        
    def forward(self, x):
        # x: (batch, seq_len, input_dim)
        out, _ = self.gru(x)
        # Take last output
        out = out[:, -1, :]
        return self.fc(out)

# --------------------------
# 4. TRAINING & EXPORT
# --------------------------
def train_model():
    print("WARNING: Using dummy data/empty dataset for skeleton architecture.")
    print("Expected PyTorch Training Time (GPU): 1-2 hours for 50k samples.")
    print("Run on CPU: python ml/sign/train_sequence.py")
    print("Run on GPU: CUDA_VISIBLE_DEVICES=0 python ml/sign/train_sequence.py")
    
    # Normally we load from splits.json and vocab_mapping.json
    # Skipping heavy PyTorch loop to avoid executing 0-epoch bug on empty dataset.
    
    output_dir = Path("models/sign/v1")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Save dummy metrics
    metrics = {
        "model_name": "GRU_Baseline",
        "test_metrics": {
            "accuracy": 0.0,
            "macro_f1": 0.0
        },
        "model_size_bytes": 0,
        "warning": "DATASET EMPTY - NO REAL TRAINING EXECUTED"
    }
    
    with open(output_dir / "metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)
        
    print("Model skeleton built. Artifacts saved to models/sign/v1/.")

if __name__ == "__main__":
    train_model()
