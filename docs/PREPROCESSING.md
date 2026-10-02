# GESTURA Feature Preprocessing & Normalization Specification

**Version:** 1.0.0  
**Scope:** Canonical static hand pose landmark transformation for training and in-browser inference.

---

## 1. Overview & Parity Contract

To ensure 100% mathematical parity between Python ML training pipelines (`ml/preprocessor.py`) and in-browser TypeScript inference (`frontend/src/lib/features/preprocessor.ts`), both systems must strictly adhere to the deterministic mathematical pipeline specified below.

All coordinates begin as 21 3D landmarks $P_i = (x_i, y_i, z_i)$ for $i \in [0, 20]$ where:
- $P_0$: Wrist origin
- $P_1 - P_4$: Thumb (CMC, MCP, IP, Tip)
- $P_5 - P_8$: Index (MCP, PIP, DIP, Tip)
- $P_9 - P_{12}$: Middle (MCP, PIP, DIP, Tip)
- $P_{13} - P_{16}$: Ring (MCP, PIP, DIP, Tip)
- $P_{17} - P_{20}$: Pinky (MCP, PIP, DIP, Tip)

---

## 2. Transformation Pipeline

### Step 1: Wrist-Origin Translation
Translate all 21 points so the wrist ($P_0$) is located at $(0, 0, 0)$:
$$P_i^{(1)} = P_i - P_0 = (x_i - x_0, y_i - y_0, z_i - z_0) \quad \forall i \in [0, 20]$$

### Step 2: Scale Invariant Normalization
Compute the palm scale reference distance $S$ as the Euclidean distance from the wrist ($P_0$) to the Middle Finger MCP ($P_9$):
$$S = \|P_9^{(1)}\|_2 = \sqrt{(x_9^{(1)})^2 + (y_9^{(1)})^2 + (z_9^{(1)})^2}$$

If $S < 10^{-6}$ (degenerated hand), default $S = 1.0$.

Normalize all translated coordinates:
$$P_i^{(2)} = \frac{P_i^{(1)}}{S} \quad \forall i \in [0, 20]$$

### Step 3: Handedness Mirroring Canonicalization
To allow a single static gesture model to recognize signs formed with either the left or right hand:
- If the hand is **Left** (from canonical visual perspective):
  $$x_i^{(3)} = -x_i^{(2)}, \quad y_i^{(3)} = y_i^{(2)}, \quad z_i^{(3)} = z_i^{(2)} \quad \forall i \in [0, 20]$$
- If the hand is **Right**:
  $$P_i^{(3)} = P_i^{(2)} \quad \forall i \in [0, 20]$$

---

## 3. Engineered Kinematic Features

In addition to the 63 normalized landmark coordinates ($21 \times 3$), the following geometric features are concatenated:

### 1. Finger Extension Ratios (5 Features)
For each finger $f \in \{\text{Thumb: 4}, \text{Index: 8}, \text{Middle: 12}, \text{Ring: 16}, \text{Pinky: 20}\}$ with corresponding base MCP $m \in \{2, 5, 9, 13, 17\}$:
$$E_f = \frac{\|P_{\text{tip}}^{(3)}\|_2}{\|P_{\text{mcp}}^{(3)}\|_2}$$

### 2. Inter-Fingertip Distances (6 Features)
Euclidean distances between adjacent and bounding fingertips:
1. Thumb Tip (4) to Index Tip (8)
2. Index Tip (8) to Middle Tip (12)
3. Middle Tip (12) to Ring Tip (16)
4. Ring Tip (16) to Pinky Tip (20)
5. Thumb Tip (4) to Pinky Tip (20)
6. Thumb Tip (4) to Middle Tip (12)

$$D_{a, b} = \|P_a^{(3)} - P_b^{(3)}\|_2$$

### 3. Joint Flexion Angles (5 Features)
The cosine angle $\theta_f$ at the PIP joint for each finger between vector $\vec{u} = P_{\text{mcp}} - P_{\text{pip}}$ and vector $\vec{v} = P_{\text{tip}} - P_{\text{pip}}$:
$$\cos(\theta) = \frac{\vec{u} \cdot \vec{v}}{\|\vec{u}\|_2 \|\vec{v}\|_2 + 10^{-7}}$$

### 4. Palm Normal Vector (3 Features)
The 3D cross-product unit vector of the palm plane defined by Wrist ($P_0$), Index MCP ($P_5$), and Pinky MCP ($P_{17}$):
$$\vec{u} = P_5^{(3)}, \quad \vec{v} = P_{17}^{(3)}$$
$$\vec{N} = \frac{\vec{u} \times \vec{v}}{\|\vec{u} \times \vec{v}\|_2 + 10^{-7}}$$

---

## 4. Total Output Feature Vector Dimension
| Feature Sub-vector | Dimension |
|---|---|
| Normalized 3D Coordinates | 63 (21 × 3) |
| Finger Extension Ratios | 5 |
| Inter-Fingertip Distances | 6 |
| Joint Flexion Angles | 5 |
| Palm Normal Vector | 3 |
| **Total Feature Dimension** | **82 Features** |

---

## 5. Parity Test Protocol
Shared fixture files in `data/metadata/fixture_vectors.json` contain raw MediaPipe landmark test cases. Both TypeScript (`npm test`) and Python (`pytest`) run automated parity checks asserting `max_abs_error < 1e-5` across all 82 output features.
