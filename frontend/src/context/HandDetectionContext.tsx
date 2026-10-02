"use client";

import React, { createContext, useContext, useEffect } from"react";
import { useCamera, UseCameraReturn } from"@/lib/camera/useCamera";
import {
 useHandLandmarker,
 UseHandLandmarkerReturn,
} from"@/lib/mediapipe/useHandLandmarker";

interface HandDetectionContextValue {
 camera: UseCameraReturn;
 landmarker: UseHandLandmarkerReturn;
}

const HandDetectionContext = createContext<HandDetectionContextValue | null>(
 null
);

export const HandDetectionProvider: React.FC<{ children: React.ReactNode }> = ({
 children,
}) => {
 const camera = useCamera();
 const landmarker = useHandLandmarker();

 // Auto-connect landmarker detection loop when camera is active and model is ready
 useEffect(() => {
 if (
 camera.status ==="active"&&
 camera.videoRef.current &&
 landmarker.status ==="ready"
 ) {
 landmarker.startDetectionLoop(
 camera.videoRef.current,
 camera.isMirrored
 );
 } else if (camera.status !=="active"&& landmarker.status ==="detecting") {
 landmarker.stopDetectionLoop();
 }
 }, [
 camera.status,
 camera.isMirrored,
 landmarker.status,
 camera.videoRef,
 landmarker,
 ]);

 return (
 <HandDetectionContext.Provider value={{ camera, landmarker }}>
 {children}
 </HandDetectionContext.Provider>
 );
};

export function useHandDetection() {
 const context = useContext(HandDetectionContext);
 if (!context) {
 throw new Error(
"useHandDetection must be used within a HandDetectionProvider"
 );
 }
 return context;
}
