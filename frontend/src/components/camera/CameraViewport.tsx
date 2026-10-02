"use client";

import React, { useRef, useState } from"react";
import { cn } from"@/lib/utils";
import { useHandDetection } from"@/context/HandDetectionContext";
import { CameraPermissionCard } from"./CameraPermissionCard";
import { CameraErrorCard } from"./CameraErrorCard";
import { CameraTelemetryHud } from"./CameraTelemetryHud";
import { CameraControls } from"./CameraControls";
import { SkeletonCanvas } from"./SkeletonCanvas";
import { HandQualityBanner } from"./HandQualityBanner";
import { Badge } from"@/components/ui";

export interface CameraViewportProps {
 className?: string;
}

export const CameraViewport: React.FC<CameraViewportProps> = ({ className }) => {
 const { camera, landmarker } = useHandDetection();
 const containerRef = useRef<HTMLDivElement>(null);

 const [showSkeleton, setShowSkeleton] = useState(true);
 const [colorCodeFingers, setColorCodeFingers] = useState(false);

 const {
 status,
 videoRef,
 isMirrored,
 errorDetails,
 startCamera,
 stopCamera,
 } = camera;

 const isActive = status ==="active";
 const isError =
 status ==="permission_denied"||
 status ==="no_camera"||
 status ==="camera_busy"||
 status ==="unsupported"||
 status ==="error";

 const isIdle = status ==="idle"|| status ==="stopped";
 const isLoading = status ==="requesting";

 return (
 <div className="space-y-3">
 {/* Hand Quality Guidance Area */}
 <HandQualityBanner />

 {/* Main Viewport Card */}
 <div
 ref={containerRef}
 className={cn(
"bg-white shadow-soft overflow-hidden flex flex-col relative",
 className
 )}
 >
 {/* Viewport Top Titlebar */}
 <div className="bg-[#ECE8DF] p-3.5 flex items-center justify-between">
 <div className="flex items-center gap-2">
 <span className="w-3 h-3 bg-red-500 border"/>
 <span className="w-3 h-3 bg-yellow-400 border"/>
 <span className="w-3 h-3 bg-emerald-500 border"/>
 <span className="text-xs font-mono font-bold uppercase ml-2 text-black">
 WEBCAM VIEWPORT (640x480)
 </span>
 </div>

 <Badge
 variant={
 isActive
 ?"secondary"
 : isError
 ?"danger"
 : isLoading
 ?"warning"
 :"neutral"
 }
 size="sm"
 dot={isActive}
 >
 {status.toUpperCase().replace("_","")}
 </Badge>
 </div>

 {/* Video & Display Area */}
 <div className="relative aspect-[4/3] bg-surface-dark flex items-center justify-center overflow-hidden">
 {/* HTML Video Element */}
 <video
 ref={videoRef}
 playsInline
 muted
 autoPlay
 className={cn(
"w-full h-full object-cover",
 isMirrored &&"-scale-x-100",
 !isActive &&"hidden"
 )}
 />

 {/* Skeleton Overlay Canvas */}
 {isActive && (
 <SkeletonCanvas
 showSkeleton={showSkeleton}
 colorCodeFingers={colorCodeFingers}
 showLabels={true}
 />
 )}

 {/* Real-time Telemetry HUD when active */}
 {isActive && (
 <CameraTelemetryHud
 telemetry={landmarker.telemetry}
 landmarkerStatus={landmarker.status}
 isMirrored={isMirrored}
 />
 )}

 {/* Pre-permission Idle Card */}
 {isIdle && (
 <div className="p-6 w-full max-w-lg z-20">
 <CameraPermissionCard
 onEnable={() => startCamera()}
 isLoading={isLoading}
 />
 </div>
 )}

 {/* Loading / Requesting Spinner */}
 {isLoading && (
 <div className="p-8 text-center bg-white shadow-soft max-w-sm mx-auto z-20">
 <div className="w-12 h-12 border-t-primary rounded-full animate-spin mx-auto mb-4"/>
 <h4 className="font-black uppercase text-lg mb-1">
 Initializing Camera...
 </h4>
 <p className="text-xs text-ink-muted">
 Please grant webcam permission in your browser prompt.
 </p>
 </div>
 )}

 {/* Error State Card */}
 {isError && (
 <div className="p-6 w-full max-w-lg z-20">
 <CameraErrorCard
 status={status}
 errorDetails={errorDetails}
 onRetry={() => startCamera()}
 onReset={() => stopCamera()}
 />
 </div>
 )}
 </div>

 {/* Controls Bar */}
 <CameraControls
 camera={camera}
 containerRef={containerRef}
 showSkeleton={showSkeleton}
 onToggleSkeleton={() => setShowSkeleton((prev) => !prev)}
 colorCodeFingers={colorCodeFingers}
 onToggleColorFingers={() => setColorCodeFingers((prev) => !prev)}
 />
 </div>
 </div>
 );
};
