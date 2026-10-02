# GESTURA Pitch Deck Material

## 30-Second Elevator Pitch
"Gestura is a privacy-first, purely local web app that translates sign language gestures into spoken English in real time. Unlike existing solutions that send your video feed to slow, expensive cloud APIs, Gestura tracks your skeleton and runs machine learning inference entirely in your browser using WebAssembly. It's lightning fast, costs nothing to scale, and keeps your data strictly on your device."

## The Problem
- **Privacy:** Video feeds of people's homes/faces are routinely sent to third-party cloud ML providers.
- **Latency:** Round-trip API calls for 30 FPS video translation result in unacceptable lag for fluid conversation.
- **Accessibility:** High-end translation software requires expensive hardware or subscriptions.

## The Solution
A client-side architecture that leverages MediaPipe WASM for tracking and ONNX Runtime Web for sub-15ms machine learning classification, capped off with deterministic sentence formatting and local Text-to-Speech.

## 5 Key Differentiators
1. **Local-First Privacy:** Zero images, video, or ML telemetry leave the user's browser.
2. **Deterministic Sentence Pipeline:** ASL glosses (raw signs) are grammatically formatted into English (punctuation, capitalization, phrase joining) automatically.
3. **Transparent Explainability:** Model dashboard shows exact test accuracy, dataset splits, and a confusion matrix so users know exactly what the model struggles with.
4. **Unknown Handling:** If the user performs a random gesture, the model strictly rejects it based on computed probability thresholds rather than guessing wildly.
5. **Personalization (Teach Gestura):** The app allows users to capture custom gestures and retrain the model locally to adapt to their unique signing style.

## Honest Limitations
- **Vocabulary Size:** Currently limited to a small proof-of-concept vocabulary of static gestures.
- **Static vs Temporal:** Does not currently support moving gestures (temporal signs) due to relying on a single-frame Random Forest classifier.
- **Lighting Bias:** Extremely dependent on good lighting for the MediaPipe skeleton tracker to function.

## Q&A Prep

**Q: Is this real sign language translation?**
*A:* No, this is a proof-of-concept vocabulary mapper for static poses. Real ASL incorporates facial expressions, motion, and complex grammar which requires multi-frame LSTM or Transformer models.

**Q: How accurate is it?**
*A:* On our very small testing set, we achieve ~X% accuracy, but we honestly expose our confusion matrix to users. It performs well in good lighting for the trained classes, but struggles to generalize to new users until they retrain it using the "Teach Gestura" personalization module.

**Q: Where does the data go?**
*A:* Nowhere. The camera feed is processed in-memory and destroyed. The translation history is saved to the browser's IndexedDB. Custom training datasets are saved only to the local machine running the server.
