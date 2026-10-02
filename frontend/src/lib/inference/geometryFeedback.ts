export interface FeatureVector {
  normalizedLandmarks: number[];
  fingerExtensions: number[];
  keyDistances: number[];
  jointAngles: number[];
  palmNormal: number[];
}

export interface GeometryFeedback {
  message: string;
  severity: "info" | "warning" | "error";
  feature: string;
}

const FINGER_NAMES = ["Thumb", "Index", "Middle", "Ring", "Pinky"];

export function computeGeometryFeedback(
  userFeatures: FeatureVector,
  targetMeanFeatures: FeatureVector
): GeometryFeedback[] {
  const feedback: GeometryFeedback[] = [];

  // 1. Finger Extensions (Threshold: 0.3 diff in extension ratio)
  for (let i = 0; i < 5; i++) {
    const userExt = userFeatures.fingerExtensions[i];
    const targetExt = targetMeanFeatures.fingerExtensions[i];
    
    if (Math.abs(userExt - targetExt) > 0.3) {
      if (targetExt > 0.5) {
        feedback.push({
          message: `${FINGER_NAMES[i]} finger should be more extended.`,
          severity: "warning",
          feature: `fingerExtension_${i}`,
        });
      } else {
        feedback.push({
          message: `${FINGER_NAMES[i]} finger should be more bent/curled.`,
          severity: "warning",
          feature: `fingerExtension_${i}`,
        });
      }
    }
  }

  // 2. Palm Orientation (Cosine similarity of normal vector)
  const uN = userFeatures.palmNormal;
  const tN = targetMeanFeatures.palmNormal;
  // dot product
  const dot = uN[0] * tN[0] + uN[1] * tN[1] + uN[2] * tN[2];
  // Since they are normalized, dot product is cosine of angle
  const angleRad = Math.acos(Math.max(-1, Math.min(1, dot)));
  const angleDeg = (angleRad * 180) / Math.PI;

  if (angleDeg > 20) {
    feedback.push({
      message: `Your hand is rotated about ${Math.round(angleDeg)}° relative to the reference.`,
      severity: "warning",
      feature: "palmOrientation",
    });
  }

  return feedback;
}
