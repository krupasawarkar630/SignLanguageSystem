import { useState, useEffect, useRef, useCallback } from "react";
import * as ort from "onnxruntime-web";
import { PredictionResult } from "./useGestureInference";

export type SignState = "Waiting" | "Signing" | "Recognizing" | "Result";

interface SequenceInferenceState {
  signState: SignState;
  predictions: PredictionResult[];
  inferenceLatency: number;
  modelError: string | null;
}

const MOTION_THRESHOLD = 0.02; // Change in normalized position to trigger "Signing"
const REST_FRAMES_THRESHOLD = 15; // Number of slow frames to trigger end of sign
const MAX_BUFFER_SIZE = 64;

export function useSequenceInference(latestResult: any, isActive: boolean) {
  const [state, setState] = useState<SequenceInferenceState>({
    signState: "Waiting",
    predictions: [],
    inferenceLatency: 0,
    modelError: null
  });

  const bufferRef = useRef<any[]>([]);
  const restCounterRef = useRef(0);
  const isMountedRef = useRef(true);
  const sessionRef = useRef<ort.InferenceSession | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    
    async function loadModel() {
      try {
        const session = await ort.InferenceSession.create("/models/sign/v1/model_sequence.onnx", {
          executionProviders: ["wasm"]
        });
        if (isMountedRef.current) {
          sessionRef.current = session;
        }
      } catch (err: any) {
        if (isMountedRef.current) {
          setState(s => ({ ...s, modelError: "Sequence model unavailable (run Phase 10 training)" }));
        }
      }
    }
    loadModel();

    return () => {
      isMountedRef.current = false;
      if (sessionRef.current) {
        try {
          (sessionRef.current as any).release?.();
        } catch (e) {}
      }
    };
  }, []);

  useEffect(() => {
    if (!isActive || !latestResult || !latestResult.landmarks || !sessionRef.current) return;

    const currentHands = latestResult.landmarks;
    // Push raw data to buffer
    if (bufferRef.current.length >= MAX_BUFFER_SIZE) {
      bufferRef.current.shift();
    }
    bufferRef.current.push(latestResult);

    // Compute simple motion energy (distance of wrist between last two frames)
    let motionEnergy = 0;
    if (bufferRef.current.length > 1) {
      const prev = bufferRef.current[bufferRef.current.length - 2].landmarks[0];
      const curr = currentHands[0];
      if (prev && curr) {
        motionEnergy = Math.sqrt(
          Math.pow(curr[0].x - prev[0].x, 2) +
          Math.pow(curr[0].y - prev[0].y, 2) +
          Math.pow(curr[0].z - prev[0].z, 2)
        );
      }
    }

    if (state.signState === "Waiting") {
      if (motionEnergy > MOTION_THRESHOLD) {
        setState(s => ({ ...s, signState: "Signing" }));
        bufferRef.current = [latestResult]; // Start fresh sequence
        restCounterRef.current = 0;
      }
    } else if (state.signState === "Signing") {
      if (motionEnergy < (MOTION_THRESHOLD * 0.5)) {
        restCounterRef.current++;
        if (restCounterRef.current > REST_FRAMES_THRESHOLD) {
          setState(s => ({ ...s, signState: "Recognizing" }));
          // Run Inference!
          runInference();
        }
      } else {
        restCounterRef.current = 0; // reset rest
      }
    }
  }, [latestResult, isActive, state.signState]);

  const runInference = useCallback(async () => {
    if (!sessionRef.current || bufferRef.current.length === 0) return;
    
    const start = performance.now();
    try {
      // DUMMY INFERENCE STUB (since real model requires training output)
      // Normally: run normalization, pack tensor, await session.run()
      
      await new Promise(r => setTimeout(r, 25)); // fake WASM wait
      
      if (isMountedRef.current) {
        setState({
          signState: "Result",
          predictions: [{
            label: "UNKNOWN",
            confidence: 0.1,
            isUnknown: true,
            handIndex: 0,
            handedness: "Right",
            top3: [{label: "UNKNOWN", p: 0.1}]
          }],
          inferenceLatency: performance.now() - start,
          modelError: null
        });
        
        // Reset back to waiting after a moment
        setTimeout(() => {
          if (isMountedRef.current) {
            setState(s => ({ ...s, signState: "Waiting" }));
          }
        }, 1500);
      }
    } catch (e: any) {
      console.error(e);
      if (isMountedRef.current) setState(s => ({ ...s, signState: "Waiting" }));
    }
  }, []);

  return state;
}
