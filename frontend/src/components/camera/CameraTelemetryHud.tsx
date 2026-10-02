"use client";

import React from"react";
import { DetectionTelemetry, LandmarkerStatus } from"@/types/hand";
import { Activity, Hand, Gauge, Eye, FlipHorizontal } from"lucide-react";

export interface CameraTelemetryHudProps {
 telemetry: DetectionTelemetry;
 landmarkerStatus: LandmarkerStatus;
 isMirrored: boolean;
}

export const CameraTelemetryHud: React.FC<CameraTelemetryHudProps> = ({
 telemetry,
 landmarkerStatus,
 isMirrored,
}) => {
 const { handsCount, handedness, fps, latencyMs } = telemetry;

 return (
 <div className="absolute top-3 left-3 right-3 flex flex-wrap items-start justify-between gap-2 pointer-events-none z-10 font-mono text-xs select-none">
 {/* Top Left: Hand Count & Handedness details */}
 <div className="flex flex-col gap-1.5">
 {/* Hands Count Pill */}
 <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-black/90 text-white border-white shadow-soft">
 <Hand className="w-4 h-4 text-primary"/>
 <span className="font-bold uppercase tracking-wide">
 {handsCount === 0
 ?"0 HANDS DETECTED"
 : handsCount === 1
 ?"1 HAND DETECTED"
 : `${handsCount} HANDS DETECTED`}
 </span>
 </div>

 {/* Handedness Badges */}
 {handsCount > 0 && (
 <div className="flex flex-wrap gap-1.5">
 {handedness.map((hand, idx) => (
 <div
 key={idx}
 className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white text-black font-bold shadow-soft"
 >
 <span className="w-2 h-2 rounded-full bg-secondary"/>
 <span className="uppercase">
 {hand.displayLabel} HAND
 </span>
 <span className="text-[10px] text-ink-muted">
 ({Math.round(hand.score * 100)}%)
 </span>
 </div>
 ))}
 </div>
 )}

 {/* Mirror indicator note */}
 {isMirrored && (
 <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#F7F4ED]/90 text-black border text-[10px] font-bold">
 <FlipHorizontal className="w-3 h-3"/>
 <span>MIRRORED (SELFIE MODE)</span>
 </div>
 )}
 </div>

 {/* Top Right: Real Performance Telemetry (FPS, Latency, Engine Status) */}
 <div className="flex flex-col items-end gap-1.5">
 <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-black/90 text-white border-white shadow-soft">
 <Gauge className="w-3.5 h-3.5 text-secondary"/>
 <span className="font-bold">
 FPS: <span className="text-secondary">{fps.toFixed(1)}</span>
 </span>
 <span className="text-white/40">|</span>
 <span>
 LATENCY: <span className="text-primary-light">{latencyMs}ms</span>
 </span>
 </div>

 <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-white text-black text-[10px] font-bold shadow-soft">
 <span
 className={`w-1.5 h-1.5 rounded-full ${
 landmarkerStatus ==="detecting"
 ?"bg-emerald-500 animate-pulse"
 : landmarkerStatus ==="ready"
 ?"bg-primary-light0"
 :"bg-amber-400"
 }`}
 />
 <span className="uppercase">
 MEDIAPIPE: {landmarkerStatus.toUpperCase()}
 </span>
 </div>
 </div>
 </div>
 );
};
