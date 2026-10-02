"use client";

import React, { useState, useEffect, useRef } from"react";
import { HandQualityResult } from"@/types/hand";
import { evaluateHandQuality } from"@/lib/quality/handQuality";
import { useHandDetection } from"@/context/HandDetectionContext";
import {
 CheckCircle2,
 AlertTriangle,
 Info,
 Scan,
 Maximize2,
 Sun,
 Activity,
} from"lucide-react";

export const HandQualityBanner: React.FC = () => {
 const { camera, landmarker } = useHandDetection();
 const [quality, setQuality] = useState<HandQualityResult>({
 isValid: false,
 handVisible: false,
 isTooSmall: false,
 isPartiallyOutside: false,
 isFastMotion: false,
 isPoorLighting: false,
 boundingBoxAreaRatio: 0,
 velocity: 0,
 lumaBrightness: 128,
 message:"Camera idle",
 severity:"info",
 });

 const previousFrameRef = useRef<{ landmarks: any; timestamp: number } | null>(
 null
 );

 useEffect(() => {
 if (camera.status !=="active") {
 setQuality({
 isValid: false,
 handVisible: false,
 isTooSmall: false,
 isPartiallyOutside: false,
 isFastMotion: false,
 isPoorLighting: false,
 boundingBoxAreaRatio: 0,
 velocity: 0,
 lumaBrightness: 128,
 message:"Start camera to track hand posture",
 severity:"info",
 });
 previousFrameRef.current = null;
 return;
 }

 const firstHandLandmarks =
 landmarker.latestResult?.landmarks &&
 landmarker.latestResult.landmarks.length > 0
 ? landmarker.latestResult.landmarks[0]
 : null;

 const now = performance.now();
 const result = evaluateHandQuality(
 firstHandLandmarks,
 now,
 previousFrameRef.current,
 camera.videoRef.current
 );

 setQuality(result);

 if (firstHandLandmarks) {
 previousFrameRef.current = {
 landmarks: firstHandLandmarks,
 timestamp: now,
 };
 }
 }, [camera.status, camera.videoRef, landmarker.latestResult]);

 if (camera.status !=="active") return null;

 const severityStyles = {
 ok:"bg-emerald-100 text-emerald-950 border-emerald-600",
 info:"bg-primary-light text-ink border-primary",
 warning:"bg-amber-100 text-amber-950 border-amber-600",
 error:"bg-red-100 text-red-950 border-danger",
 };

 const getIcon = () => {
 if (quality.isValid) {
 return <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0"/>;
 }
 if (quality.isPoorLighting) {
 return <Sun className="w-4 h-4 text-amber-700 flex-shrink-0"/>;
 }
 if (quality.isTooSmall || quality.isPartiallyOutside) {
 return <Maximize2 className="w-4 h-4 text-amber-700 flex-shrink-0"/>;
 }
 if (quality.isFastMotion) {
 return <Activity className="w-4 h-4 text-primary flex-shrink-0"/>;
 }
 return <Info className="w-4 h-4 text-primary flex-shrink-0"/>;
 };

 return (
 <div
 className={` px-3.5 py-2 flex flex-wrap items-center justify-between gap-3 shadow-soft font-mono text-xs ${
 severityStyles[quality.severity]
 }`}
 >
 <div className="flex items-center gap-2 font-bold">
 {getIcon()}
 <span className="uppercase">{quality.message}</span>
 </div>

 {quality.handVisible && (
 <div className="flex items-center gap-3 text-[11px] font-bold">
 <span className="text-black/70">
 SIZE: {(quality.boundingBoxAreaRatio * 100).toFixed(1)}%
 </span>
 <span>•</span>
 <span className="text-black/70">
 SPEED: {quality.velocity.toFixed(2)}
 </span>
 <span>•</span>
 <span className="text-black/70">
 LIGHT: {quality.lumaBrightness}/255
 </span>
 </div>
 )}
 </div>
 );
};
