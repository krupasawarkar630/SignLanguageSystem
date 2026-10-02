import {
  HandLandmarks,
  HandednessInfo,
  HAND_CONNECTIONS,
  FINGER_INDICES,
  FingerName,
} from "@/types/hand";

export interface SkeletonRenderOptions {
  colorCodeFingers?: boolean;
  showLabels?: boolean;
  showLandmarkNodes?: boolean;
  showConnections?: boolean;
  isMirrored?: boolean;
  reducedMotion?: boolean;
  pulsePhase?: number; // 0 to 2*PI for subtle harmonic pulse
}

// Finger distinctive color palettes
export const FINGER_COLORS: Record<FingerName, string> = {
  thumb: "#F59E0B",   // Amber
  index: "#2563EB",   // Electric Blue
  middle: "#84CC16",  // Lime
  ring: "#8B5CF6",    // Violet
  pinky: "#EC4899",   // Pink
  palm: "#0F172A",    // Dark Slate
  wrist: "#000000",   // Black
};

export const HAND_ACCENT_COLORS = {
  Right: {
    primary: "#D47055",     // Electric Blue
    glow: "rgba(49, 87, 255, 0.4)",
    line: "#D47055",
    node: "#D47055",
    labelBg: "#D47055",
    labelText: "#FFFFFF",
  },
  Left: {
    primary: "#D47055",     // Electric Blue with dark badge
    glow: "rgba(49, 87, 255, 0.4)",
    line: "#D47055",
    node: "#E8EDFF",
    labelBg: "#111111",
    labelText: "#FFFFFF",
  },
};

export function getFingerForLandmark(index: number): FingerName {
  if (index === 0) return "wrist";
  if (index >= 1 && index <= 4) return "thumb";
  if (index >= 5 && index <= 8) return "index";
  if (index >= 9 && index <= 12) return "middle";
  if (index >= 13 && index <= 16) return "ring";
  if (index >= 17 && index <= 20) return "pinky";
  return "palm";
}

export function drawHandSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: HandLandmarks,
  handedness: HandednessInfo,
  width: number,
  height: number,
  options: SkeletonRenderOptions = {}
) {
  if (!landmarks || landmarks.length < 21) return;

  const {
    colorCodeFingers = false,
    showLabels = true,
    showLandmarkNodes = true,
    showConnections = true,
    isMirrored = true,
    reducedMotion = false,
    pulsePhase = 0,
  } = options;

  const handSide = handedness.displayLabel; // "Left" | "Right"
  const theme = HAND_ACCENT_COLORS[handSide] || HAND_ACCENT_COLORS.Right;

  // Convert normalized [0,1] coordinates to canvas pixel coordinates
  const pixelPoints = landmarks.map((pt) => {
    let px = pt.x * width;
    if (isMirrored) {
      px = (1 - pt.x) * width;
    }
    const py = pt.y * height;
    return { x: px, y: py, z: pt.z };
  });

  // 1. Draw Skeleton Connections
  if (showConnections) {
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
      const p1 = pixelPoints[startIdx];
      const p2 = pixelPoints[endIdx];
      if (!p1 || !p2) continue;

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);

      if (colorCodeFingers) {
        const finger = getFingerForLandmark(endIdx);
        ctx.strokeStyle = FINGER_COLORS[finger];
        ctx.lineWidth = 3.5;
      } else {
        ctx.strokeStyle = theme.line;
        ctx.lineWidth = 3.5;
      }

      ctx.stroke();

      // Inner crisp white highlight
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    ctx.restore();
  }

  // 2. Draw Landmark Joint Nodes
  if (showLandmarkNodes) {
    ctx.save();
    const isFingertip = (idx: number) => [4, 8, 12, 16, 20].includes(idx);

    pixelPoints.forEach((pt, idx) => {
      const fingertip = isFingertip(idx);
      const pulseDelta =
        !reducedMotion && fingertip ? Math.sin(pulsePhase + idx) * 1.5 : 0;
      const baseRadius = fingertip ? 5.5 : idx === 0 ? 6.5 : 4.0;
      const radius = Math.max(2, baseRadius + pulseDelta);

      // Node shadow
      ctx.beginPath();
      ctx.arc(pt.x + 1, pt.y + 1, radius, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fill();

      // Node Circle
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);

      if (colorCodeFingers) {
        const finger = getFingerForLandmark(idx);
        ctx.fillStyle = FINGER_COLORS[finger];
      } else {
        ctx.fillStyle = fingertip ? "#FFFFFF" : theme.node;
      }

      ctx.fill();
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = "#000000";
      ctx.stroke();
    });
    ctx.restore();
  }

  // 3. Draw Hand Label & Bounding Indicator
  if (showLabels && pixelPoints.length > 0) {
    ctx.save();
    // Compute bounding box
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    pixelPoints.forEach((p) => {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    });

    const labelText = `${handSide.toUpperCase()} (${Math.round(handedness.score * 100)}%)`;
    const labelX = minX;
    const labelY = Math.max(24, minY - 12);

    ctx.font = "bold 11px JetBrains Mono, monospace";
    const textMetrics = ctx.measureText(labelText);
    const paddingX = 6;
    const boxHeight = 18;
    const boxWidth = textMetrics.width + paddingX * 2;

    // Neo-brutalist label badge background
    ctx.fillStyle = "#000000";
    ctx.fillRect(labelX + 2, labelY - 14 + 2, boxWidth, boxHeight);

    ctx.fillStyle = theme.labelBg;
    ctx.fillRect(labelX, labelY - 14, boxWidth, boxHeight);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "#000000";
    ctx.strokeRect(labelX, labelY - 14, boxWidth, boxHeight);

    // Text
    ctx.fillStyle = theme.labelText;
    ctx.fillText(labelText, labelX + paddingX, labelY - 1);

    ctx.restore();
  }
}
