# GESTURA Hackathon Demo Script

**Target Duration**: 3 - 4 Minutes
**Goal**: Demonstrate a complete, privacy-first, on-device gesture-to-speech pipeline.

## Pre-flight Checklist (DO THIS 5 MINS BEFORE)
1. Run `./scripts/dev.sh` and ensure all green checks pass.
2. Verify room lighting is bright and hands are clearly visible in the webcam.
3. Ensure computer volume is turned up to 75% for Text-to-Speech output.

---

### Step 1: The Pitch & Landing Page (0:00 - 0:30)
- **Action**: Open `http://localhost:3000/home`. Scroll slowly through the neo-brutalist hero section.
- **Narration**: "Hi judges, we built Gestura. Current sign language translators rely on expensive, high-latency cloud APIs that send your video feed over the internet. We built a 100% local, privacy-first translator that runs a Random Forest machine learning model entirely in your browser using WebAssembly. Let's translate some signs."

### Step 2: Live Translation Studio (0:30 - 1:30)
- **Action**: Click "Launch Translator". Hold up an "A" gesture, wait for the blue ring to fill, then drop your hand. 
- **Expected Result**: The UI flashes "A", the progress ring completes, and an "a" chip appears in the buffer.
- **Narration**: "Notice how fast this is. The camera feed never leaves my laptop. MediaPipe tracks my skeleton, we extract 82 geometric features, and our ONNX model predicts the gesture in under 15 milliseconds. We require the user to hold the pose for a fraction of a second to lock it in—preventing accidental spam."
- **Action (Risk Check)**: Hold an unknown, random pose. 
- **Expected Result**: Score drops, UI says "UNKNOWN", no chip is added.
- **Narration**: "If I do nonsense, the model doesn't guess wildly. It calculates probability thresholds and cleanly rejects unknown poses."
- *Plan B (Camera Fails)*: Click settings, enable "DEMO MODE", and say, "My camera is blocked, so I am feeding recorded 3D landmarks into the live model."

### Step 3: Sentence Builder & TTS (1:30 - 2:30)
- **Action**: Clear the buffer. Perform the gestures for "HELLO", "HOW", "ARE", "YOU". (Or use quick phrases).
- **Expected Result**: The chips populate. The deterministic formatter combines them into "Hello, how are you?" with proper punctuation.
- **Narration**: "Raw signs aren't English. Our deterministic grammatical engine intercepts the buffer and handles capitalization, phrase joining, and punctuation instantly."
- **Action**: Check "Auto-Speak" or click the "SPEAK" button.
- **Expected Result**: Computer reads "Hello, how are you?" aloud.
- **Narration**: "And finally, we pipe this straight into the browser's native Web Speech API to give non-verbal users a voice."
- *Plan B (Speech Fails)*: Mute tab, point to the formatted text output block and say, "The text is instantly ready for a screen reader or chat app."

### Step 4: Model Transparency (2:30 - 3:00)
- **Action**: Navigate to `/model`. Show the dashboard and the confusion matrix.
- **Narration**: "We hate black-box AI. Our transparency dashboard pulls directly from the trained metrics. You can see our exact test accuracy, macro F1 score, and an interactive confusion matrix so users know exactly what gestures the model struggles with."

### Step 5: Custom Training (3:00 - 3:30)
- **Action**: Navigate to `/learn` or point to the "Teach Gestura" button.
- **Narration**: "Because everyone signs slightly differently, we built a personalized pipeline. You can capture 200 frames of your own custom gesture right here, and Gestura will spin up a Python backend, retrain the Random Forest, and hot-reload the ONNX model back into the browser in seconds. Thank you."
