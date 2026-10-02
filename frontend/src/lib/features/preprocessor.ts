import {
  HandLandmarks,
  PreprocessedFeatures,
  RawHandedness,
} from "@/types/hand";

export function euclideanDistance(
  p1: { x: number; y: number; z: number },
  p2: { x: number; y: number; z: number }
): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = p1.z - p2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function dotProduct(
  v1: { x: number; y: number; z: number },
  v2: { x: number; y: number; z: number }
): number {
  return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
}

export function vectorLength(v: { x: number; y: number; z: number }): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

export function crossProduct(
  u: { x: number; y: number; z: number },
  v: { x: number; y: number; z: number }
): { x: number; y: number; z: number } {
  return {
    x: u.y * v.z - u.z * v.y,
    y: u.z * v.x - u.x * v.z,
    z: u.x * v.y - u.y * v.x,
  };
}

/**
 * Preprocesses raw 21-landmark MediaPipe coordinate stream into canonical 82-dimensional feature vector.
 */
export function preprocessLandmarks(
  landmarks: HandLandmarks,
  handedness: RawHandedness = "Right",
  isMirrored = false
): PreprocessedFeatures {
  if (!landmarks || landmarks.length !== 21) {
    throw new Error("PreprocessLandmarks requires exactly 21 landmarks");
  }

  // 1. Wrist-Origin Translation
  const wrist = landmarks[0];
  const translated = landmarks.map((pt) => ({
    x: pt.x - wrist.x,
    y: pt.y - wrist.y,
    z: pt.z - wrist.z,
  }));

  // 2. Scale Normalization (Distance from Wrist to Middle Finger MCP [9])
  const middleMcp = translated[9];
  const scale = Math.sqrt(
    middleMcp.x * middleMcp.x +
      middleMcp.y * middleMcp.y +
      middleMcp.z * middleMcp.z
  );
  const scaleFactor = scale > 1e-6 ? scale : 1.0;

  const normalized = translated.map((pt) => ({
    x: pt.x / scaleFactor,
    y: pt.y / scaleFactor,
    z: pt.z / scaleFactor,
  }));

  // 3. Handedness Mirroring Canonicalization
  // Determine if canonical left hand requires x-inversion
  const effectiveHandedness: RawHandedness = isMirrored
    ? handedness === "Left"
      ? "Right"
      : "Left"
    : handedness;

  const isLeft = effectiveHandedness === "Left";
  const canonical = normalized.map((pt) => ({
    x: isLeft ? -pt.x : pt.x,
    y: pt.y,
    z: pt.z,
  }));

  // Flatten 63D Normalized Coordinates
  const normalizedLandmarks: number[] = [];
  for (const pt of canonical) {
    normalizedLandmarks.push(pt.x, pt.y, pt.z);
  }

  // 4. Engineered Features
  // 4.1 Finger Extension Ratios (5 fingers: Thumb, Index, Middle, Ring, Pinky)
  const fingerPairs: [number, number][] = [
    [4, 2],   // Thumb Tip to Thumb MCP
    [8, 5],   // Index Tip to Index MCP
    [12, 9],  // Middle Tip to Middle MCP
    [16, 13], // Ring Tip to Ring MCP
    [20, 17], // Pinky Tip to Pinky MCP
  ];
  const origin = { x: 0, y: 0, z: 0 };
  const fingerExtensions: number[] = fingerPairs.map(([tipIdx, mcpIdx]) => {
    const tipDist = euclideanDistance(canonical[tipIdx], origin);
    const mcpDist = euclideanDistance(canonical[mcpIdx], origin);
    return mcpDist > 1e-6 ? tipDist / mcpDist : 0;
  });

  // 4.2 Inter-Fingertip Distances (6 key distances)
  const tipDistancesPairs: [number, number][] = [
    [4, 8],   // Thumb to Index
    [8, 12],  // Index to Middle
    [12, 16], // Middle to Ring
    [16, 20], // Ring to Pinky
    [4, 20],  // Thumb to Pinky
    [4, 12],  // Thumb to Middle
  ];
  const keyDistances: number[] = tipDistancesPairs.map(([i, j]) =>
    euclideanDistance(canonical[i], canonical[j])
  );

  // 4.3 Joint Flexion Cosine Angles (5 fingers at PIP joint)
  const angleTriplets: [number, number, number][] = [
    [1, 2, 4],   // Thumb: CMC -> MCP -> Tip
    [5, 6, 8],   // Index: MCP -> PIP -> Tip
    [9, 10, 12], // Middle: MCP -> PIP -> Tip
    [13, 14, 16],// Ring: MCP -> PIP -> Tip
    [17, 18, 20],// Pinky: MCP -> PIP -> Tip
  ];
  const jointAngles: number[] = angleTriplets.map(([baseIdx, midIdx, tipIdx]) => {
    const base = canonical[baseIdx];
    const mid = canonical[midIdx];
    const tip = canonical[tipIdx];

    const u = { x: base.x - mid.x, y: base.y - mid.y, z: base.z - mid.z };
    const v = { x: tip.x - mid.x, y: tip.y - mid.y, z: tip.z - mid.z };

    const lenU = vectorLength(u);
    const lenV = vectorLength(v);
    const denom = lenU * lenV + 1e-7;
    return dotProduct(u, v) / denom; // Cosine value between -1 and 1
  });

  // 4.4 Palm Normal Vector (Cross product of Index MCP [5] and Pinky MCP [17])
  const uPalm = canonical[5];
  const vPalm = canonical[17];
  const normalRaw = crossProduct(uPalm, vPalm);
  const normalLen = vectorLength(normalRaw) + 1e-7;
  const palmNormal: [number, number, number] = [
    normalRaw.x / normalLen,
    normalRaw.y / normalLen,
    normalRaw.z / normalLen,
  ];

  // Flattened 82D vector
  const totalFeatureVector: number[] = [
    ...normalizedLandmarks, // 63
    ...fingerExtensions,    // 5
    ...keyDistances,        // 6
    ...jointAngles,         // 5
    ...palmNormal,          // 3
  ];

  return {
    normalizedLandmarks,
    fingerExtensions,
    keyDistances,
    jointAngles,
    palmNormal,
    totalFeatureVector,
  };
}
