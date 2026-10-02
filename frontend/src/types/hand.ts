export interface Landmark3D {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export type HandLandmarks = Landmark3D[]; // Array of exactly 21 points

export type RawHandedness = "Left" | "Right";

export interface HandednessInfo {
  index: number;
  score: number;
  categoryName: RawHandedness;
  displayName?: string;
  displayLabel: "Left" | "Right"; // Mirror-adjusted human label
}

export interface HandFrame {
  landmarks: HandLandmarks;
  worldLandmarks?: HandLandmarks;
  handedness: HandednessInfo;
  score: number;
  timestamp: number;
}

export interface HandDetectionResult {
  landmarks: HandLandmarks[];
  worldLandmarks: HandLandmarks[];
  handedness: HandednessInfo[];
  timestamp: number;
}

export interface DetectionTelemetry {
  handsCount: number;
  handedness: HandednessInfo[];
  fps: number;
  latencyMs: number;
  lastDetectionTimestamp: number;
}

export type LandmarkerStatus =
  | "uninitialized"
  | "loading"
  | "ready"
  | "detecting"
  | "error";

// Standard MediaPipe Hand 21-Joint Topology Connections
export const HAND_CONNECTIONS: [number, number][] = [
  // Palm Base
  [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8],       // Index
  [5, 9], [9, 10], [10, 11], [11, 12],  // Middle
  [9, 13], [13, 14], [14, 15], [15, 16],// Ring
  [13, 17], [17, 18], [18, 19], [19, 20],// Pinky
  [0, 17]                               // Palm base connection (Wrist to Pinky MCP)
];

// Finger Landmark Index Groups
export const FINGER_INDICES = {
  wrist: [0],
  thumb: [1, 2, 3, 4],
  index: [5, 6, 7, 8],
  middle: [9, 10, 11, 12],
  ring: [13, 14, 15, 16],
  pinky: [17, 18, 19, 20],
  palm: [0, 1, 5, 9, 13, 17],
} as const;

export type FingerName = "thumb" | "index" | "middle" | "ring" | "pinky" | "palm" | "wrist";

// Hand Quality Analysis Result
export interface HandQualityResult {
  isValid: boolean;
  handVisible: boolean;
  isTooSmall: boolean;
  isPartiallyOutside: boolean;
  isFastMotion: boolean;
  isPoorLighting: boolean;
  boundingBoxAreaRatio: number;
  velocity: number;
  lumaBrightness: number; // 0 to 255
  message: string;
  severity: "ok" | "info" | "warning" | "error";
}

// Preprocessed Feature Vector Representation
export interface PreprocessedFeatures {
  normalizedLandmarks: number[]; // 63 values (21 * 3)
  fingerExtensions: number[];    // 5 values (0.0 to 1.0)
  keyDistances: number[];        // Selected Euclidean distances
  jointAngles: number[];         // Joint flexion & angle radians
  palmNormal: [number, number, number]; // 3D Normal vector
  totalFeatureVector: number[];  // Flattened total feature vector for ML
}
