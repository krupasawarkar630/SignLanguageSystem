# GESTURA: Real-Time Hand Gesture → Text & Speech Translator

## Product Overview
GESTURA is an assistive-technology product designed for real-time translation of static hand gestures and sign language into live text and vocalized speech.

## Core Rules & Decisions
- **Phase-by-Phase Development**: Strict isolated phase execution with verification before advancing.
- **Privacy Guarantee**: Zero camera frames leave the client browser. Only 21-landmark normalized coordinate vectors are computed locally or optionally sent to the local backend during dataset collection.
- **Inference Engine**: Client-side ONNX runtime (`onnxruntime-web`) with MediaPipe HandLandmarker (`@mediapipe/tasks-vision`). Fallback to local FastAPI `/predict` if client WASM is unsupported.
- **Scope**: Static hand poses (single-frame 21-landmark classification). Dynamic/motion gestures are out of scope.
- **Exact Preprocessing Parity**: Python and TypeScript shared preprocessing specifications with automated parity test fixtures.
- **Design System**: Light neo-brutalism (`#F7F4ED`, crisp 2–3px black borders, `4px 4px 0` hard black drop-shadows, tactile button interactions, electric blue + lime accents, full reduced-motion accessibility).
- **Honest Metrics**: No fake or hardcoded accuracy/precision/recall/latency metrics. All metrics must be computed from actual test splits or runtime benchmarks.
