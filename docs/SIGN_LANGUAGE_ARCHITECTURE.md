# Sign Language Architecture & Scalability Plan

**Target Language:** American Sign Language (ASL)
**Target Tiers:** 
1. Fingerspelling & Digits (Static)
2. Isolated Word Signs (Temporal) — *Target Vocabulary: 100-300 signs*
**Out of Scope:** Continuous, fluid sentence-level translation (grammar/syntax parsing).

---

## 1. Architectural Shift: Static vs. Temporal

### Why Static Landmark Classification Fails
Static models (like our current Random Forest) analyze a single frame in isolation. While this works perfectly for the ASL alphabet (A-Z) and digits (0-9) where meaning is conveyed through a held pose, it catastrophically fails for word signs (e.g., "J", "Help", "Thank You") where meaning is derived from the **trajectory, velocity, and relative motion** of the hands over time. 

### Two-Model Design
To support both, we will implement a dual-model architecture governed by a UI mode switch:
1. **Fingerspelling Mode (Static):** The existing `RandomForest` / `SVM` pipeline processing single-frame 82D feature vectors.
2. **Word-Sign Mode (Temporal):** A new sequence model processing a rolling window of frames.

---

## 2. Temporal Input Representation

To achieve scale and robustness, the raw coordinates must be strictly normalized across users.

- **Landmark Topology:** 
  - Both Hands (21x3 each)
  - Upper Body Pose (Shoulders, elbows, wrists) (6x3)
  - *Optional:* Face anchors (nose, mouth edges) to capture non-manual markers in the future.
- **Normalization (Shoulder-Centric):** 
  - The origin `(0,0,0)` is shifted to the midpoint between the left and right shoulders.
  - All coordinates are scaled by the inverse of the shoulder width. This guarantees that distance from the camera and the signer's body size do not impact the feature vectors.
- **Sequence Handling:**
  - Live video streams vary in FPS and sign duration. We will implement **Temporal Resampling** (e.g., cubic interpolation) to compress/expand every detected sign into a fixed-length window (e.g., exactly `32` or `64` frames).
- **Missing Hand Handling:**
  - If a hand is occluded or drops out of frame, its coordinates are set to `0`, and a dedicated binary `mask` feature is set to `1` (indicating missing data), preventing the model from interpreting `(0,0,0)` as the physical shoulder origin.

---

## 3. Sequence Modeling & ONNX Inference

### Candidate Architectures
1. **1D-CNN (Temporal Convolutional Network):** Extremely fast, lightweight, but sometimes struggles with very long-term dependencies.
2. **LSTM / GRU (RNNs):** The historical standard for sequential tracking. Good accuracy, but recurrent execution is inherently slower to execute sequentially in WASM.
3. **Small Spatial-Temporal Transformer:** State-of-the-art accuracy, but high parameter count and computational overhead.

**Recommendation:** **1D-CNN (ResNet-style)** or a **GRU**. 
*Justification:* A lightweight 1D-CNN or small GRU can achieve >85% accuracy on isolated signs while maintaining sub-20ms execution times when exported to `onnxruntime-web` (WASM). Transformers risk blowing past our strict web-performance budgets and bloating the initial page load time.

---

## 4. Sign Segmentation (The "Start/Stop" Problem)

In isolated word-sign mode, the application must automatically know *when* a sign begins and ends without the user pushing a button.
- **Motion Thresholds:** Calculate the inter-frame velocity of the wrist landmarks. If velocity exceeds a threshold `V_min`, a sign is beginning. 
- **Rest-Pose Detection:** Train a lightweight binary classifier to detect standard "rest poses" (hands dropped below the chest or resting together). 
- **Sliding Window:** Continually feed the last `N` frames into the sequence model.
- **Failure Modes:** False positives triggered by scratching a nose, adjusting glasses, or transitional movements between actual signs.

### Open-Set Handling (Unknowns)
The model will inevitably see gestures it was not trained on.
- Include a specific **"Background / Not a Sign" class** in the training data (comprised of random motions and rest poses).
- Enforce strict confidence calibration. If the top predicted class probability is `< 0.65`, the prediction is overridden to `UNKNOWN`.

---

## 5. Public Dataset Survey (ASL)

To scale, we must leverage open-source ASL datasets. **DO NOT DOWNLOAD UNTIL APPROVED.**

| Dataset | Size / Classes | Format | License & Terms | Download Process |
|---|---|---|---|---|
| **WLASL (Word-Level ASL)** | ~2,000 signs, ~21k videos | MP4 Video Links | Academic / Non-commercial | Requires executing a Python script to scrape videos from YouTube/Vimeo. Many links are dead. Needs offline MediaPipe extraction. |
| **MSASL (Microsoft ASL)** | 1,000 signs, 25k videos | MP4 Video Links | CC-BY-NC 4.0 | Similar to WLASL, requires scraping script. |
| **AUTSL (Turkish Sign)** | 226 signs, 38k videos | Video / Landmarks | Academic | N/A (Wrong language, but great baseline dataset). |
| **Google ASL Fingerspelling** | 3M+ instances | Parquet Landmarks | Kaggle / Open | Direct download via Kaggle. Contains pre-extracted MediaPipe landmarks. |

**Immediate Action Required:** The user must register for a Kaggle account (if targeting Google ASL) or manually run the scraping scripts for WLASL, as direct API downloads of raw MP4s are highly unreliable due to link rot.

---

## 6. Evaluation Methodology (Strict Data Leakage Prevention)

**SIGNER-INDEPENDENT SPLITS** (Critical)
If Signer A's video of "HELLO" is in the training set, *no* videos of Signer A doing *any* sign can exist in the validation/test set.
- **Why?** Neural networks are lazy. If a random split is used, the model will learn to recognize Signer A's face/body shape or clothing rather than the geometric motion of the sign. This inflates accuracy to 99% in testing, but yields 10% accuracy for a brand new user.

**Metrics:**
- **Top-1 & Top-5 Accuracy:** Crucial for large vocabularies where signs look very similar.
- **Per-Class F1:** Ensures the model isn't just succeeding on the most common signs.
- **Browser Inference Latency (ms):** Must be verified in Chrome/Firefox.

---

## 7. Risks, Compute, and Milestones

### Risks
- **Data Pipeline Overhead:** Converting 20,000 MP4 videos into normalized 3D landmarks via MediaPipe takes dozens of hours of CPU time.
- **Browser Memory Limits:** Large sequence models may crash iOS Safari or low-end mobile devices when loaded into WASM memory.

### Compute Needs
- **Preprocessing:** Multi-core CPU for parallel MediaPipe video extraction.
- **Training:** A single modern GPU (e.g., RTX 3060 / T4 via Google Colab) is sufficient to train a 1D-CNN/GRU in under 2 hours.

### Realistic Milestone Plan
- **M1:** Download WLASL/MSASL and write the distributed MediaPipe extraction script (Python).
- **M2:** Implement the shoulder-centric normalization pipeline.
- **M3:** Train a baseline GRU model in PyTorch on a 50-word subset and export to ONNX.
- **M4:** Build the React UI Mode Switch (Fingerspelling vs Word Sign) and the live motion-segmentation sliding window. 
- **M5:** Scale training to 300 words and tune confidence thresholds.
