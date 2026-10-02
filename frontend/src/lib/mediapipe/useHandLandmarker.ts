"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  HandLandmarks,
  HandednessInfo,
  HandDetectionResult,
  DetectionTelemetry,
  LandmarkerStatus,
  RawHandedness,
} from "@/types/hand";

export interface UseHandLandmarkerReturn {
  status: LandmarkerStatus;
  isModelLoaded: boolean;
  latestResult: HandDetectionResult | null;
  telemetry: DetectionTelemetry;
  error: string | null;
  startDetectionLoop: (
    videoElement: HTMLVideoElement,
    isMirrored?: boolean
  ) => void;
  stopDetectionLoop: () => void;
}

export function useHandLandmarker(): UseHandLandmarkerReturn {
  const [status, setStatus] = useState<LandmarkerStatus>("uninitialized");
  const [error, setError] = useState<string | null>(null);
  const [latestResult, setLatestResult] = useState<HandDetectionResult | null>(
    null
  );
  const [telemetry, setTelemetry] = useState<DetectionTelemetry>({
    handsCount: 0,
    handedness: [],
    fps: 0,
    latencyMs: 0,
    lastDetectionTimestamp: 0,
  });

  const landmarkerRef = useRef<any>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const isLoopRunningRef = useRef<boolean>(false);
  const isMirroredRef = useRef<boolean>(true);

  // FPS calculation window
  const frameTimestampsRef = useRef<number[]>([]);

  // Initialize MediaPipe HandLandmarker
  useEffect(() => {
    let isCancelled = false;

    async function initMediaPipe() {
      if (typeof window === "undefined") return;

      try {
        setStatus("loading");
        const { FilesetResolver, HandLandmarker } = await import(
          "@mediapipe/tasks-vision"
        );

        let vision: any;
        try {
          // Attempt loading self-hosted local WASM binaries first
          vision = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
        } catch {
          // Fallback to official CDN if local WASM path resolution fails in dev
          vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
          );
        }

        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "/mediapipe/hand_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 2,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        if (!isCancelled) {
          landmarkerRef.current = handLandmarker;
          setStatus("ready");
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error("Failed to initialize MediaPipe HandLandmarker:", err);
          setError(err?.message || "Failed to load MediaPipe WASM/Task model");
          setStatus("error");
        }
      }
    }

    initMediaPipe();

    return () => {
      isCancelled = true;
      if (landmarkerRef.current) {
        try {
          landmarkerRef.current.close();
        } catch {
          // Ignore cleanup error
        }
        landmarkerRef.current = null;
      }
    };
  }, []);

  // Stop detection loop
  const stopDetectionLoop = useCallback(() => {
    isLoopRunningRef.current = false;
    if (animationFrameIdRef.current !== null) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    lastVideoTimeRef.current = -1;
    frameTimestampsRef.current = [];
    setLatestResult(null);
    setTelemetry({
      handsCount: 0,
      handedness: [],
      fps: 0,
      latencyMs: 0,
      lastDetectionTimestamp: 0,
    });
    if (status === "detecting") {
      setStatus("ready");
    }
  }, [status]);

  // Detection loop step
  const detectFrame = useCallback(
    (videoElement: HTMLVideoElement) => {
      if (
        !isLoopRunningRef.current ||
        !landmarkerRef.current ||
        !videoElement ||
        videoElement.paused ||
        videoElement.ended ||
        videoElement.readyState < 2
      ) {
        if (isLoopRunningRef.current) {
          animationFrameIdRef.current = requestAnimationFrame(() =>
            detectFrame(videoElement)
          );
        }
        return;
      }

      const currentTime = videoElement.currentTime;

      // Only run inference when video frame timestamp advances
      if (currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = currentTime;
        const now = performance.now();

        try {
          const startTime = performance.now();
          const results = landmarkerRef.current.detectForVideo(
            videoElement,
            now
          );
          const endTime = performance.now();
          const latencyMs = Math.round((endTime - startTime) * 10) / 10;

          // Rolling FPS calculation over last 30 frames
          const frameTimestamps = frameTimestampsRef.current;
          frameTimestamps.push(now);
          if (frameTimestamps.length > 30) {
            frameTimestamps.shift();
          }
          let computedFps = 0;
          if (frameTimestamps.length > 1) {
            const timeDiff =
              (frameTimestamps[frameTimestamps.length - 1] -
                frameTimestamps[0]) /
              1000;
            computedFps =
              Math.round(((frameTimestamps.length - 1) / timeDiff) * 10) / 10;
          }

          // Format detected hands and calculate mirror-aware handedness
          const formattedHandedness: HandednessInfo[] = (
            results.handedness || []
          ).map((handList: any[], index: number) => {
            const first = handList[0] || {};
            const rawCategory: RawHandedness =
              first.categoryName === "Left" ? "Left" : "Right";

            // Under horizontal mirror (selfie), camera "Left" corresponds to subject "Right"
            const displayLabel: "Left" | "Right" = isMirroredRef.current
              ? rawCategory === "Left"
                ? "Right"
                : "Left"
              : rawCategory;

            return {
              index,
              score: Math.round((first.score || 0) * 100) / 100,
              categoryName: rawCategory,
              displayName: first.displayName,
              displayLabel,
            };
          });

          const detectionResult: HandDetectionResult = {
            landmarks: results.landmarks || [],
            worldLandmarks: results.worldLandmarks || [],
            handedness: formattedHandedness,
            timestamp: now,
          };

          setLatestResult(detectionResult);
          setTelemetry({
            handsCount: results.landmarks ? results.landmarks.length : 0,
            handedness: formattedHandedness,
            fps: computedFps,
            latencyMs,
            lastDetectionTimestamp: now,
          });
        } catch (inferenceErr) {
          console.warn("MediaPipe frame detection warning:", inferenceErr);
        }
      }

      if (isLoopRunningRef.current) {
        animationFrameIdRef.current = requestAnimationFrame(() =>
          detectFrame(videoElement)
        );
      }
    },
    []
  );

  // Start detection loop
  const startDetectionLoop = useCallback(
    (videoElement: HTMLVideoElement, isMirrored = true) => {
      if (!landmarkerRef.current) return;
      isMirroredRef.current = isMirrored;
      isLoopRunningRef.current = true;
      setStatus("detecting");
      frameTimestampsRef.current = [];
      detectFrame(videoElement);
    },
    [detectFrame]
  );

  // Teardown loop on unmount
  useEffect(() => {
    return () => {
      isLoopRunningRef.current = false;
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, []);

  return {
    status,
    isModelLoaded: status === "ready" || status === "detecting",
    latestResult,
    telemetry,
    error,
    startDetectionLoop,
    stopDetectionLoop,
  };
}
