# GESTURA Manual QA Checklist

**Date**: 2026-10-02

This document outlines the strict manual QA flow required to verify every error state and edge case described in the master prompt.

### 1. Camera & Permissions
- [ ] **Loading State:** Ensure the skeleton loader appears immediately while WASM and MediaPipe initialize.
- [ ] **Permission Denied:** Deny camera permissions. Verify the custom neo-brutalist error banner appears guiding the user to browser settings.
- [ ] **No Camera Found:** Unplug the webcam (or disable in OS). Verify the "No Video Input Detected" fallback appears.
- [ ] **Unsupported Browser:** Open in Internet Explorer or an outdated Safari version. Verify a clear alert indicates WASM/WebGL is required.

### 2. Gesture Pipeline & Inference
- [ ] **No Hand Detected:** Keep hands out of frame. Verify the UI says "NO HAND" and the progress hold ring instantly resets.
- [ ] **Multiple Hands:** Place two hands in frame. Verify the UI correctly identifies "LEFT HAND" and "RIGHT HAND" in the breakdown, and gracefully picks the primary hand for inference.
- [ ] **Low Confidence (UNKNOWN):** Perform a random shape not in the dataset. Verify the model score drops below `metadata.unknown_threshold.optimal_threshold` (e.g. < 0.4) and the UI displays "UNKNOWN".
- [ ] **Model Unavailable:** Delete `model.onnx`. Verify the `/translate` page shows a red `MODEL ERROR` state and asks the user to train a model first.

### 3. Backend & Training Pipeline
- [ ] **Dataset Empty:** Try to trigger training with an empty `dataset.json`. Verify the backend returns a 400 error and the UI warns that data is needed.
- [ ] **Training Error:** Force a Python exception in the backend script. Verify the UI wizard properly catches the error and exits the "Training in progress..." loader.
- [ ] **Network Unavailable:** Disconnect the internet. Verify that standard translation (Phase 6) and sentence building (Phase 7) continue to work flawlessly offline.

### 4. Accessibility & UI
- [ ] **Speech Unavailable:** Try to use text-to-speech in a browser where it is disabled or unsupported. Verify the SPEAK button disables itself with an appropriate tooltip.
- [ ] **Keyboard Nav:** Unplug the mouse and verify every button, tab, and toggle can be reached via `Tab` and activated via `Enter`/`Space`.
