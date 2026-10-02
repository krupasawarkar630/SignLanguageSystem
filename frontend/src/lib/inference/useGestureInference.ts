import { useState, useEffect, useRef, useCallback } from "react";
import * as ort from "onnxruntime-web";
import { HandDetectionResult } from "@/types/hand";
import { preprocessLandmarks } from "@/lib/features/preprocessor";

export interface InferenceMetadata {
  classes: string[];
  unknown_threshold: {
    optimal_threshold: number;
  };
}

export interface PredictionResult {
  label: string;
  confidence: number;
  isUnknown: boolean;
  handIndex: number;
  handedness: "Left" | "Right";
  top3?: { label: string; p: number }[];
  rawFeatures?: number[];
}

interface StabilizedPrediction {
  label: string;
  confidence: number;
  isUnknown: boolean;
  history: { label: string; confidence: number }[];
}

export function useGestureInference(
  latestResult: HandDetectionResult | null,
  isActive: boolean
) {
  const [session, setSession] = useState<ort.InferenceSession | null>(null);
  const [metadata, setMetadata] = useState<InferenceMetadata | null>(null);
  const [labels, setLabels] = useState<string[]>([]);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [modelError, setModelError] = useState<string | null>(null);

  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [stabilizedLabel, setStabilizedLabel] = useState<string>("—");
  const [stabilizedConfidence, setStabilizedConfidence] = useState<number>(0);
  const [inferenceLatency, setInferenceLatency] = useState(0);

  // Configuration for smoothing
  const SMOOTHING_WINDOW = 5;
  const historyRef = useRef<{ label: string; confidence: number }[]>([]);

  // Load ONNX model and metadata
  useEffect(() => {
    let isMounted = true;
    const loadModel = async () => {
      try {
        setIsModelLoading(true);
        // Load metadata and labels
        const [metaRes, labelsRes] = await Promise.all([
          fetch("/models/metadata.json"),
          fetch("/models/labels.json"),
        ]);
        
        if (!metaRes.ok || !labelsRes.ok) {
          throw new Error("Model unavailable — train a model first");
        }

        const meta = await metaRes.json();
        const lbls = await labelsRes.json();
        
        if (isMounted) {
          setMetadata(meta);
          setLabels(lbls.classes);
        }

        // Initialize ONNX Session
        // Set WASM paths if needed (usually served from public/ or CDN)
        ort.env.wasm.numThreads = 1; 
        const sess = await ort.InferenceSession.create("/models/model.onnx", {
          executionProviders: ["wasm"],
        });
        
        if (isMounted) {
          setSession(sess);
          setModelError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          setModelError(err.message || "Failed to load model");
          setSession(null);
        }
      } finally {
        if (isMounted) {
          setIsModelLoading(false);
        }
      }
    };

    loadModel();
    return () => {
      isMounted = false;
      if (session) {
        try {
          (session as any).release?.();
        } catch(e) {
          console.warn("Failed to release ONNX session", e);
        }
      }
    };
  }, []);

  // Inference Loop
  useEffect(() => {
    if (!isActive || !session || !metadata || !latestResult || latestResult.landmarks.length === 0) {
      setPredictions([]);
      if (latestResult?.landmarks.length === 0) {
        setStabilizedLabel("NO HAND");
        setStabilizedConfidence(0);
        historyRef.current = [];
      }
      return;
    }

    const runInference = async () => {
      const start = performance.now();
      const currentPredictions: PredictionResult[] = [];

      for (let i = 0; i < latestResult.landmarks.length; i++) {
        const landmarks = latestResult.landmarks[i];
        const handedness = latestResult.handedness[i]?.categoryName as "Left" | "Right";
        
        try {
          const features = preprocessLandmarks(landmarks);
          if (!features) continue;

          // Our RandomForest scikit-learn ONNX model usually takes a float32 array
          // and outputs label + probabilities
          const tensor = new ort.Tensor("float32", new Float32Array(features.totalFeatureVector), [1, features.totalFeatureVector.length]);
          const feeds: Record<string, ort.Tensor> = {};
          feeds[session.inputNames[0]] = tensor;

          const output = await session.run(feeds);
          
          // Typical scikit-learn ONNX RandomForest outputs:
          // outputNames[0] = label (int64)
          // outputNames[1] = probabilities (sequence of map or float array)
          const probTensor = output[session.outputNames[1]];
          let probabilities: number[] = [];
          
          // ONNX zipmap output handling
          if ((probTensor.type as string) === "sequence") {
            // Some sklearn pipelines output Sequence<Map<Int64, Float>>
            // We'll iterate through the map
            const seq = probTensor.data as unknown as any[]; // usually an array of Map-like structures
            if (seq.length > 0) {
              const probMap = seq[0];
              // extract map values
              // Depending on ONNX runtime version, this might vary.
              // A safer way if zipmap is not fully supported or is complex:
              // Let's assume standard float tensor if zipmap is disabled, 
              // or handle the Map directly if it exists.
              if (probMap instanceof Map) {
                 for (let j = 0; j < labels.length; j++) {
                    probabilities.push(probMap.get(BigInt(j)) || probMap.get(j) || 0);
                 }
              }
            }
          } else if (probTensor.type === "float32" || probTensor.type === "float64") {
            probabilities = Array.from(probTensor.data as Float32Array | Float64Array);
          } else {
            // Fallback parsing for other formats
            console.warn("Unknown probability tensor type", probTensor.type);
            probabilities = new Array(labels.length).fill(0);
            probabilities[Number(output[session.outputNames[0]].data[0])] = 1.0;
          }

          let maxProb = 0;
          let maxIdx = 0;
          probabilities.forEach((p, idx) => {
             if (p > maxProb) { maxProb = p; maxIdx = idx; }
          });

          // Ensure it's not empty, in case the above parsing failed
          if (probabilities.length === 0 && output[session.outputNames[0]]) {
             maxIdx = Number(output[session.outputNames[0]].data[0]);
             maxProb = 1.0; // fallback fake confidence
          }

          const topProbs = probabilities
            .map((p, idx) => ({ label: labels[idx], p }))
            .sort((a, b) => b.p - a.p)
            .slice(0, 3);

          const predictedLabel = labels[maxIdx];
          const threshold = metadata.unknown_threshold?.optimal_threshold || 0.5;
          const isUnknown = maxProb < threshold;

          currentPredictions.push({
            label: isUnknown ? "UNKNOWN" : predictedLabel,
            confidence: maxProb,
            isUnknown,
            handIndex: i,
            handedness,
            top3: topProbs,
            rawFeatures: Array.from(features)
          });

        } catch (e) {
          console.error("Inference error on hand", i, e);
        }
      }

      setInferenceLatency(performance.now() - start);
      setPredictions(currentPredictions);

      // Temporal Stabilization (just taking the first hand for the main UI strip)
      if (currentPredictions.length > 0) {
        const pred = currentPredictions[0];
        const hist = historyRef.current;
        hist.push({ label: pred.label, confidence: pred.confidence });
        if (hist.length > SMOOTHING_WINDOW) hist.shift();

        // Majority vote
        const counts: Record<string, number> = {};
        hist.forEach(h => counts[h.label] = (counts[h.label] || 0) + 1);
        let majorityLabel = hist[0].label;
        let maxCount = 0;
        Object.entries(counts).forEach(([l, c]) => {
          if (c > maxCount) { maxCount = c; majorityLabel = l; }
        });

        // Average confidence for the majority label
        const majorityConfs = hist.filter(h => h.label === majorityLabel).map(h => h.confidence);
        const avgConf = majorityConfs.reduce((a, b) => a + b, 0) / majorityConfs.length;

        setStabilizedLabel(majorityLabel);
        setStabilizedConfidence(avgConf);
      } else {
        historyRef.current = [];
        setStabilizedLabel("NO HAND");
        setStabilizedConfidence(0);
      }
    };

    // Throttle to avoid freezing UI (e.g. run every 30-50ms max if needed)
    // Here we just run on every frame update from MediaPipe
    runInference();

  }, [latestResult, session, metadata, labels, isActive]);

  return {
    isModelLoading,
    modelError,
    predictions,
    stabilizedLabel,
    stabilizedConfidence,
    inferenceLatency
  };
}
