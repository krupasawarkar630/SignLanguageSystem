"use client";

import React from"react";
import { Card, Button, Badge } from"@/components/ui";
import { Camera, ShieldCheck, Lock, EyeOff, Sparkles } from"lucide-react";

export interface CameraPermissionCardProps {
 onEnable: () => void;
 isLoading?: boolean;
}

export const CameraPermissionCard: React.FC<CameraPermissionCardProps> = ({
 onEnable,
 isLoading = false,
}) => {
 return (
 <div className="bg-white p-6 sm:p-8 text-center shadow-soft max-w-lg mx-auto">
 <div className="w-16 h-16 bg-primary flex items-center justify-center mx-auto mb-5 shadow-soft">
 <Camera className="w-8 h-8 text-white"/>
 </div>

 <div className="mb-2">
 <span className="px-2.5 py-0.5 bg-black text-white text-[11px] font-mono font-bold uppercase tracking-wider">
 CAMERA PERMISSION REQUIRED
 </span>
 </div>

 <h3 className="text-2xl font-black uppercase tracking-tight text-black mb-3">
 Enable Local Camera
 </h3>

 <p className="text-xs text-ink-muted font-medium leading-relaxed mb-6">
 GESTURA needs camera access to track your 21 hand landmarks in real-time. Before requesting browser permission, here is our strict privacy guarantee:
 </p>

 {/* Privacy Guarantee list */}
 <div className="space-y-2 text-left mb-6 font-mono text-xs">
 <div className="p-2.5 bg-secondary-light flex items-start gap-2.5 shadow-soft">
 <Lock className="w-4 h-4 text-black flex-shrink-0 mt-0.5"/>
 <span className="text-black font-bold">
 100% On-Device: Frames are processed strictly in browser memory and NEVER leave your computer.
 </span>
 </div>

 <div className="p-2.5 bg-primary-light flex items-start gap-2.5 shadow-soft">
 <EyeOff className="w-4 h-4 text-primary flex-shrink-0 mt-0.5"/>
 <span className="text-black font-bold">
 Zero Video Storage: We do not store or stream video recordings anywhere.
 </span>
 </div>
 </div>

 <Button
 variant="primary"
 size="lg"
 isFullWidth
 onClick={onEnable}
 isLoading={isLoading}
 >
 <Sparkles className="w-4 h-4 mr-2"/>
 {isLoading ?"REQUESTING PERMISSION...":"ENABLE CAMERA & START →"}
 </Button>
 </div>
 );
};
