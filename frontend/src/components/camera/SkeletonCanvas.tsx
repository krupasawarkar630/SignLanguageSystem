"use client";

import React, { useRef, useEffect } from"react";
import { useHandDetection } from"@/context/HandDetectionContext";
import { drawHandSkeleton } from"@/lib/canvas/skeletonRenderer";

export interface SkeletonCanvasProps {
 showSkeleton?: boolean;
 colorCodeFingers?: boolean;
 showLabels?: boolean;
 className?: string;
}

export const SkeletonCanvas: React.FC<SkeletonCanvasProps> = ({
 showSkeleton = true,
 colorCodeFingers = false,
 showLabels = true,
 className ="",
}) => {
 const { camera, landmarker } = useHandDetection();
 const canvasRef = useRef<HTMLCanvasElement>(null);
 const animationFrameIdRef = useRef<number | null>(null);
 const pulsePhaseRef = useRef<number>(0);

 useEffect(() => {
 const canvas = canvasRef.current;
 if (!canvas) return;
 const ctx = canvas.getContext("2d");
 if (!ctx) return;

 let isRunning = true;
 const prefersReducedMotion =
 typeof window !=="undefined"&&
 window.matchMedia("(prefers-reduced-motion: reduce)").matches;

 const render = () => {
 if (!isRunning) return;

 const video = camera.videoRef.current;
 if (video && video.videoWidth > 0 && video.videoHeight > 0) {
 // Adjust internal canvas size to match video aspect and client DPR
 const dpr = window.devicePixelRatio || 1;
 const displayWidth = video.clientWidth;
 const displayHeight = video.clientHeight;

 const targetCanvasWidth = displayWidth * dpr;
 const targetCanvasHeight = displayHeight * dpr;

 if (
 canvas.width !== targetCanvasWidth ||
 canvas.height !== targetCanvasHeight
 ) {
 canvas.width = targetCanvasWidth;
 canvas.height = targetCanvasHeight;
 }

 ctx.save();
 ctx.clearRect(0, 0, canvas.width, canvas.height);
 ctx.scale(dpr, displayWidth ? displayWidth / video.clientWidth : 1);

 if (showSkeleton && landmarker.latestResult && camera.status ==="active") {
 const { landmarks, handedness } = landmarker.latestResult;

 if (!prefersReducedMotion) {
 pulsePhaseRef.current = (pulsePhaseRef.current + 0.08) % (Math.PI * 2);
 }

 // Draw each detected hand (up to 2 hands)
 for (let i = 0; i < landmarks.length; i++) {
 const handLandmarks = landmarks[i];
 const handInfo = handedness[i] || {
 index: i,
 score: 0.9,
 categoryName:"Right",
 displayLabel: i === 0 ?"Right":"Left",
 };

 drawHandSkeleton(
 ctx,
 handLandmarks,
 handInfo,
 displayWidth,
 displayHeight,
 {
 colorCodeFingers,
 showLabels,
 showLandmarkNodes: true,
 showConnections: true,
 isMirrored: camera.isMirrored,
 reducedMotion: prefersReducedMotion,
 pulsePhase: pulsePhaseRef.current,
 }
 );
 }
 }
 ctx.restore();
 } else {
 ctx.clearRect(0, 0, canvas.width, canvas.height);
 }

 animationFrameIdRef.current = requestAnimationFrame(render);
 };

 render();

 return () => {
 isRunning = false;
 if (animationFrameIdRef.current !== null) {
 cancelAnimationFrame(animationFrameIdRef.current);
 }
 };
 }, [
 camera.status,
 camera.isMirrored,
 camera.videoRef,
 landmarker.latestResult,
 showSkeleton,
 colorCodeFingers,
 showLabels,
 ]);

 return (
 <canvas
 ref={canvasRef}
 className={`absolute inset-0 w-full h-full pointer-events-none z-10 ${className}`}
 />
 );
};
