# GESTURA Privacy & Data Policy

**Last Updated: 2026-10-02**

Gestura is designed from the ground up to respect your privacy by keeping processing as close to the device as possible.

## Data Processing & Storage

### 1. Camera Feed (Video & Images)
- **Status:** Strictly Local
- Your camera feed never leaves your browser. Gestura uses MediaPipe WASM and ONNX WebAssembly to process frames directly in your computer's memory. 
- We do not save, record, or transmit images or videos from your webcam unless you explicitly use the "Teach Gestura" (Phase 10) wizard, in which case the frames are saved directly to your local file system via the local backend.

### 2. Machine Learning Inference
- **Status:** Local (On-Device)
- Gestura uses `onnxruntime-web` to execute the gesture recognition model in your browser. All inference happens locally.
- *Fallback:* If your browser does not support WASM or WebGL, inference may fall back to the local backend server running on your machine (e.g., `localhost:8000`). It is never sent to a third-party cloud provider.

### 3. Session History & Transcripts
- **Status:** Local (IndexedDB)
- The words and sentences you translate are stored in your browser's local IndexedDB database. 
- You have full control to export (TXT, CSV, JSON) or completely delete this history from the `/history` or `/settings` pages.

### 4. Text-to-Speech (Web Speech API)
- **Status:** Hybrid (Dependent on Browser/OS)
- Gestura relies on your browser's native `SpeechSynthesis` API. 
- *Caveat:* While most default voices (like Microsoft David/Zira or Apple voices) are fully offline, some high-quality voices (e.g., Google Chrome's premium voices) require an active internet connection to synthesize speech. This behavior is controlled entirely by your browser, not Gestura.

## Third-Party Tracking
- **Status:** None
- Gestura includes ZERO analytics trackers, telemetry scripts, or ad networks.
- Fonts and icons (like Lucide React) are bundled directly in the build.

## Data Deletion
You have the right to instantly erase all data. Clicking **"Delete all my data"** in the Privacy Panel will permanently wipe:
1. All browser `localStorage` preferences.
2. The entire `GesturaHistoryDB` IndexedDB instance.
3. Any custom gesture datasets stored on the local backend (via API).
