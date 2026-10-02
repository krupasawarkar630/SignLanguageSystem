"use client";

import React from"react";
import { Button } from"@/components/ui";
import {
 Video,
 VideoOff,
 FlipHorizontal,
 SwitchCamera,
 Camera,
 Maximize2,
 Minimize2,
 Eye,
 EyeOff,
 Palette,
} from"lucide-react";
import { UseCameraReturn } from"@/lib/camera/useCamera";

export interface CameraControlsProps {
 camera: UseCameraReturn;
 containerRef?: React.RefObject<HTMLDivElement>;
 showSkeleton?: boolean;
 onToggleSkeleton?: () => void;
 colorCodeFingers?: boolean;
 onToggleColorFingers?: () => void;
}

export const CameraControls: React.FC<CameraControlsProps> = ({
 camera,
 containerRef,
 showSkeleton = true,
 onToggleSkeleton,
 colorCodeFingers = false,
 onToggleColorFingers,
}) => {
 const {
 status,
 startCamera,
 stopCamera,
 toggleFacingMode,
 toggleMirror,
 isMirrored,
 facingMode,
 devices,
 selectedDeviceId,
 selectDevice,
 captureSnapshot,
 isFullscreen,
 toggleFullscreen,
 } = camera;

 const isActive = status ==="active";

 return (
 <div className="p-4 bg-[#F7F4ED] flex flex-wrap items-center justify-between gap-3">
 {/* Primary Action Buttons */}
 <div className="flex flex-wrap items-center gap-2">
 {isActive ? (
 <Button variant="danger"size="sm"onClick={stopCamera}>
 <VideoOff className="w-4 h-4 mr-1.5"/> STOP CAMERA
 </Button>
 ) : (
 <Button
 variant="primary"
 size="sm"
 onClick={() => startCamera()}
 isLoading={status ==="requesting"}
 >
 <Video className="w-4 h-4 mr-1.5"/> START CAMERA
 </Button>
 )}

 {isActive && (
 <>
 {/* Toggle Skeleton Visualization */}
 {onToggleSkeleton && (
 <Button
 variant={showSkeleton ?"lime":"secondary"}
 size="sm"
 onClick={onToggleSkeleton}
 title="Toggle 21-joint skeleton wireframe display"
 >
 {showSkeleton ? (
 <Eye className="w-4 h-4 mr-1.5"/>
 ) : (
 <EyeOff className="w-4 h-4 mr-1.5"/>
 )}
 {showSkeleton ?"SKELETON ON":"SKELETON OFF"}
 </Button>
 )}

 {/* Toggle Finger Color Coding */}
 {onToggleColorFingers && showSkeleton && (
 <Button
 variant={colorCodeFingers ?"primary":"secondary"}
 size="sm"
 onClick={onToggleColorFingers}
 title="Color-code individual fingers"
 >
 <Palette className="w-4 h-4 mr-1.5"/>
 {colorCodeFingers ?"COLORS ON":"COLOR FINGERS"}
 </Button>
 )}

 {/* Flip / FacingMode */}
 <Button
 variant="secondary"
 size="sm"
 onClick={toggleFacingMode}
 title={`Switch camera facing mode (Current: ${facingMode})`}
 >
 <SwitchCamera className="w-4 h-4 mr-1.5"/>
 {facingMode ==="user"?"BACK CAM":"FRONT CAM"}
 </Button>

 {/* Mirror Toggle */}
 <Button
 variant={isMirrored ?"neutral":"secondary"}
 size="sm"
 onClick={toggleMirror}
 title="Toggle horizontal mirror reflection"
 >
 <FlipHorizontal className="w-4 h-4 mr-1.5"/>
 {isMirrored ?"MIRRORED":"UNMIRRORED"}
 </Button>

 {/* Local Frame Snapshot Capture */}
 <Button
 variant="secondary"
 size="sm"
 onClick={() => captureSnapshot("gestura-capture")}
 title="Save a local PNG snapshot of current frame (never uploaded)"
 >
 <Camera className="w-4 h-4 mr-1.5"/> CAPTURE
 </Button>
 </>
 )}
 </div>

 {/* Secondary Controls (Device Switcher & Fullscreen) */}
 <div className="flex items-center gap-2">
 {/* Device Switcher if multiple webcams available */}
 {devices.length > 1 && isActive && (
 <div className="w-40 sm:w-48">
 <select
 className="w-full bg-white px-2 py-1 text-xs font-mono font-bold uppercase shadow-soft focus:outline-none"
 value={selectedDeviceId ||""}
 onChange={(e) => selectDevice(e.target.value)}
 aria-label="Select camera device"
 >
 {devices.map((device) => (
 <option key={device.deviceId} value={device.deviceId}>
 {device.label ||"Camera"}
 </option>
 ))}
 </select>
 </div>
 )}

 {/* Fullscreen Button */}
 <Button
 variant="secondary"
 size="sm"
 onClick={() => toggleFullscreen(containerRef?.current)}
 title={isFullscreen ?"Exit Fullscreen":"Enter Fullscreen"}
 aria-label="Toggle Fullscreen"
 >
 {isFullscreen ? (
 <Minimize2 className="w-4 h-4"/>
 ) : (
 <Maximize2 className="w-4 h-4"/>
 )}
 </Button>
 </div>
 </div>
 );
};
