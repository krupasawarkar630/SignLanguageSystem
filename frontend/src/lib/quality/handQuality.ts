import { HandLandmarks, HandQualityResult } from "@/types/hand";

export interface QualityCheckOptions {
  minAreaRatio?: number;        // Default: 0.035 (3.5% of frame)
  edgeThreshold?: number;       // Default: 0.025 (2.5% margin from edge)
  maxVelocity?: number;         // Default: 0.85 normalized units/sec
  minLumaBrightness?: number;   // Default: 35 (0-255 scale)
}

export interface PreviousFrameData {
  landmarks: HandLandmarks;
  timestamp: number;
}

export function computeBoundingBox(landmarks: HandLandmarks) {
  let minX = 1.0, minY = 1.0, maxX = 0.0, maxY = 0.0;
  for (const pt of landmarks) {
    if (pt.x < minX) minX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y > maxY) maxY = pt.y;
  }
  const width = Math.max(0, maxX - minX);
  const height = Math.max(0, maxY - minY);
  const areaRatio = width * height;
  return { minX, minY, maxX, maxY, width, height, areaRatio };
}

export function computeVelocity(
  currentLandmarks: HandLandmarks,
  currentTime: number,
  previous?: PreviousFrameData | null
): number {
  if (!previous || !previous.landmarks || previous.landmarks.length < 21) {
    return 0;
  }
  const dt = (currentTime - previous.timestamp) / 1000;
  if (dt <= 0.001 || dt > 0.5) return 0; // Filter stale or zero dt

  // Track wrist (0) and middle MCP (9) displacement
  const idxToTrack = [0, 9];
  let totalDisplacement = 0;

  for (const idx of idxToTrack) {
    const p1 = currentLandmarks[idx];
    const p2 = previous.landmarks[idx];
    if (p1 && p2) {
      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      totalDisplacement += Math.sqrt(dx * dx + dy * dy);
    }
  }

  const avgDisplacement = totalDisplacement / idxToTrack.length;
  return avgDisplacement / dt;
}

export function sampleVideoBrightness(
  videoElement?: HTMLVideoElement | null
): number {
  if (typeof document === "undefined" || !videoElement || videoElement.readyState < 2) {
    return 128; // Default normal luma if unavailable
  }

  try {
    const sampleWidth = 32;
    const sampleHeight = 24;
    const canvas = document.createElement("canvas");
    canvas.width = sampleWidth;
    canvas.height = sampleHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return 128;

    ctx.drawImage(videoElement, 0, 0, sampleWidth, sampleHeight);
    const imgData = ctx.getImageData(0, 0, sampleWidth, sampleHeight).data;

    let totalLuma = 0;
    const pixelCount = sampleWidth * sampleHeight;

    for (let i = 0; i < imgData.length; i += 4) {
      const r = imgData[i];
      const g = imgData[i + 1];
      const b = imgData[i + 2];
      // Standard ITU-R BT.601 luma formula
      totalLuma += 0.299 * r + 0.587 * g + 0.114 * b;
    }

    return Math.round(totalLuma / pixelCount);
  } catch {
    return 128;
  }
}

export function evaluateHandQuality(
  landmarks: HandLandmarks | null | undefined,
  currentTimestamp: number,
  previousFrame?: PreviousFrameData | null,
  videoElement?: HTMLVideoElement | null,
  options: QualityCheckOptions = {}
): HandQualityResult {
  const {
    minAreaRatio = 0.035,
    edgeThreshold = 0.025,
    maxVelocity = 0.85,
    minLumaBrightness = 35,
  } = options;

  // 1. Hand Visibility Check
  if (!landmarks || landmarks.length < 21) {
    return {
      isValid: false,
      handVisible: false,
      isTooSmall: false,
      isPartiallyOutside: false,
      isFastMotion: false,
      isPoorLighting: false,
      boundingBoxAreaRatio: 0,
      velocity: 0,
      lumaBrightness: sampleVideoBrightness(videoElement),
      message: "No hand detected",
      severity: "info",
    };
  }

  // 2. Brightness Check
  const luma = sampleVideoBrightness(videoElement);
  const isPoorLighting = luma < minLumaBrightness;

  // 3. Bounding Box & Frame Position Check
  const { minX, minY, maxX, maxY, areaRatio } = computeBoundingBox(landmarks);
  const isTooSmall = areaRatio < minAreaRatio;
  const isPartiallyOutside =
    minX < edgeThreshold ||
    minY < edgeThreshold ||
    maxX > 1.0 - edgeThreshold ||
    maxY > 1.0 - edgeThreshold;

  // 4. Motion / Velocity Check
  const velocity = computeVelocity(landmarks, currentTimestamp, previousFrame);
  const isFastMotion = velocity > maxVelocity;

  // Determine Primary Priority Message
  let message = "Hand pose clear & ready";
  let severity: "ok" | "info" | "warning" | "error" = "ok";
  let isValid = true;

  if (isPoorLighting) {
    message = "Try better lighting";
    severity = "warning";
    isValid = false;
  } else if (isPartiallyOutside) {
    message = "Move your hand into the frame";
    severity = "warning";
    isValid = false;
  } else if (isTooSmall) {
    message = "Move closer";
    severity = "warning";
    isValid = false;
  } else if (isFastMotion) {
    message = "Hold your hand steadier";
    severity = "info";
    isValid = false;
  }

  return {
    isValid,
    handVisible: true,
    isTooSmall,
    isPartiallyOutside,
    isFastMotion,
    isPoorLighting,
    boundingBoxAreaRatio: Math.round(areaRatio * 1000) / 1000,
    velocity: Math.round(velocity * 100) / 100,
    lumaBrightness: luma,
    message,
    severity,
  };
}
