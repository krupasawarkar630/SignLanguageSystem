# GESTURA Model Training & Evaluation Protocol

## 1. Overview
The GESTURA machine learning pipeline trains lightweight, privacy-preserving static sign gesture classifiers from extracted 82D kinematic feature vectors. Models execute with $<15\text{ms}$ latency directly in the client browser using ONNX Runtime Web or via the Python backend.

---

## 2. Training Pipeline Architecture

```
Raw Landmark Datasets (data/raw/gestura_dataset.db & samples.jsonl)
                  │
                  ▼
Session-Stratified Dataset Split (scripts/split_dataset.py)
   ├── data/train/samples.jsonl (70%)
   ├── data/validation/samples.jsonl (15%)
   └── data/test/samples.jsonl (15%)
                  │
                  ▼
Feature Preprocessing (ml/preprocessor.py) -> 82D Feature Matrix
                  │
                  ▼
Candidate Model Training (scripts/train.py or train.py)
   ├── Random Forest (n_estimators=100, class_weight='balanced')
   ├── Support Vector Machine (RBF, Platt Probability)
   ├── K-Nearest Neighbors (distance-weighted, adaptive k)
   └── Multi-Layer Perceptron (64x32, ReLU, early stopping)
                  │
                  ▼
Model Evaluation & Selection (Validation Set)
   ├── Macro F1-Score & Accuracy
   ├── Cross-Validation (Stratified 5-Fold if sample size permits)
   └── Empirical "Unknown" Rejection Threshold Search
                  │
                  ▼
Final Unbiased Evaluation (Test Set)
   ├── Precision, Recall, Macro F1, Accuracy
   ├── 2D Confusion Matrix & Classification Report
   └── Latency Benchmarking (500 repetitions, p25/p50/p75/p95)
                  │
                  ▼
ONNX Export & Parity Verification
   ├── Convert to ONNX with skl2onnx (opset=15, input: 'features' [None, 82])
   └── Assert ONNX Runtime vs scikit-learn parity (match rate == 1.0)
                  │
                  ▼
Model Artifact Persistence (models/)
   ├── model.pkl, model.onnx
   ├── labels.json, metadata.json
   └── metrics.json, confusion_matrix.json, classification_report.json, comparison.json
```

---

## 3. Strict Guard Rails

To prevent training flawed, ungeneralizable, or trivial models, GESTURA enforces strict guard rails:

1. **Empty Dataset Abort**: If 0 samples are found, training immediately halts with an actionable error directing the user to record gestures at `/dataset`.
2. **Minimum Distinct Classes ($\ge 2$)**: Classifiers require at least 2 distinct gesture classes.
3. **Minimum Samples Per Class**: Fails clearly if any class has fewer than `min_samples_per_class` (default 5 for testing, recommended 50–100+ for production). The error provides an exact breakdown of deficient classes and needed sample counts.
4. **Class Imbalance Warning**: Warns if the ratio between the most and least frequent class exceeds $3:1$, noting that balanced class weighting has been applied.
5. **Suspicious 100% Score Warning**: Alerts if validation or test accuracy is $100\%$ on small datasets ($N < 80$), warning about potential lack of session diversity.

---

## 4. Leakage-Free Session-Based Splitting
Consecutive video frames in burst captures have near-identical landmark coordinates. Standard random frame splitting leads to severe cross-split data leakage, artificially inflating accuracy scores.

- **Rule**: Samples are partitioned strictly by `session_id` using `scripts/split_dataset.py` (the entire burst belongs exclusively to either train, validation, or test).

---

## 5. Confidence Honesty & "Unknown" Threshold Strategy
- **Calibration**: Probability outputs are evaluated and recorded. `SVC` uses Platt scaling, `MLP` uses Softmax, and `RandomForest` outputs tree vote fractions.
- **Empirical Threshold Discovery**: Rather than hand-picking an arbitrary constant, a sweep across candidate thresholds $\tau \in [0.40, 0.95]$ is performed on the validation set. The optimal threshold $\tau^*$ is chosen to maximize accepted accuracy while maintaining broad coverage ($\ge 75\%$). Samples with confidence $< \tau^*$ are classified as `"UNKNOWN"`.

---

## 6. Artifact Directory Specification (`models/`)

All training outputs are saved in `models/`:

| File | Format | Description |
| :--- | :--- | :--- |
| `model.pkl` | Pickle/Joblib | Best trained scikit-learn classifier pipeline. |
| `model.onnx` | ONNX Graph | Float32 ONNX computational model (`[batch, 82]` input). |
| `labels.json` | JSON | Class list and label $\leftrightarrow$ index mappings. |
| `metadata.json` | JSON | Version, created_at, classes, sample counts, feature spec (82D), library versions, dataset hash, rejection threshold, and ONNX parity check status. |
| `metrics.json` | JSON | Test accuracy, macro precision/recall/F1, median/p95 latency (ms), train time, model size, and CV score. |
| `confusion_matrix.json` | JSON | 2D confusion matrix with ordered class labels. |
| `classification_report.json` | JSON | Per-class precision, recall, F1, and support counts. |
| `comparison.json` | JSON | Side-by-side benchmark comparison of all candidate algorithms. |

---

## 7. How to Run Training (CLI)

```powershell
# Quick run with default settings (all models, seed 42)
python train.py

# Or via scripts/train.py with custom arguments
python scripts/train.py \
  --data-dir data \
  --output-dir models \
  --seed 42 \
  --models RandomForest,SVM,KNN,MLP \
  --min-samples-per-class 5
```

---

## 8. Backend REST API Endpoints

The FastAPI backend exposes endpoints under `/api/model`:

- `GET /api/model/metadata`: Get active model metadata, feature spec, dataset hash, and parity verification.
- `GET /api/model/metrics`: Get test evaluation metrics, latency benchmarks, and calibration details.
- `GET /api/model/comparison`: Get comparative results across all evaluated candidate models.
- `GET /api/model/confusion-matrix`: Get test set 2D confusion matrix.
- `GET /api/model/classification-report`: Get detailed scikit-learn classification report.
- `POST /api/model/train`: Trigger asynchronous background training job.
- `GET /api/model/train/status`: Check training job status (`idle`, `running`, `completed`, `failed`), execution logs, and output summary.
