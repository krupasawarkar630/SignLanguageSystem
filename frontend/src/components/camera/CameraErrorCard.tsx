"use client";

import React from"react";
import { Card, Button, Badge } from"@/components/ui";
import { CameraErrorDetails, CameraStatus } from"@/types/camera";
import {
 AlertTriangle,
 CameraOff,
 Lock,
 RefreshCw,
 HelpCircle,
 ShieldAlert,
} from"lucide-react";

export interface CameraErrorCardProps {
 errorDetails: CameraErrorDetails | null;
 status: CameraStatus;
 onRetry: () => void;
 onReset?: () => void;
}

export const CameraErrorCard: React.FC<CameraErrorCardProps> = ({
 errorDetails,
 status,
 onRetry,
 onReset,
}) => {
 const getIcon = () => {
 switch (status) {
 case"permission_denied":
 return <Lock className="w-8 h-8 text-danger"/>;
 case"no_camera":
 return <CameraOff className="w-8 h-8 text-amber-600"/>;
 case"camera_busy":
 return <AlertTriangle className="w-8 h-8 text-amber-600"/>;
 case"unsupported":
 return <ShieldAlert className="w-8 h-8 text-danger"/>;
 default:
 return <AlertTriangle className="w-8 h-8 text-danger"/>;
 }
 };

 const getTitle = () => {
 switch (status) {
 case"permission_denied":
 return"Camera Access Denied";
 case"no_camera":
 return"No Camera Found";
 case"camera_busy":
 return"Camera Already In Use";
 case"unsupported":
 return"Browser Not Supported";
 default:
 return"Camera Initialization Error";
 }
 };

 return (
 <div className="bg-white p-6 sm:p-8 text-center shadow-soft max-w-lg mx-auto">
 <div className="w-16 h-16 bg-red-50 flex items-center justify-center mx-auto mb-4 shadow-soft">
 {getIcon()}
 </div>

 <div className="mb-2">
 <span className="px-2.5 py-0.5 bg-danger text-white text-[11px] font-mono font-bold uppercase tracking-wider">
 STATUS: {status.toUpperCase().replace("_","")}
 </span>
 </div>

 <h3 className="text-2xl font-black uppercase tracking-tight text-black mb-2">
 {getTitle()}
 </h3>

 <p className="text-xs text-ink-muted font-medium mb-5 leading-relaxed">
 {errorDetails?.message ||"An unexpected camera error occurred."}
 </p>

 {/* Actionable How-To-Fix Box */}
 <div className="p-3.5 bg-amber-50 text-left mb-6 space-y-1.5 shadow-soft">
 <div className="flex items-center gap-1.5 text-xs font-black uppercase text-amber-950">
 <HelpCircle className="w-3.5 h-3.5"/>
 <span>How to fix this:</span>
 </div>
 <p className="text-xs font-medium text-amber-900 leading-relaxed font-sans">
 {errorDetails?.howToFix ||
"Please grant camera access in your browser settings and try again."}
 </p>
 </div>

 <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
 <Button variant="primary"size="md"onClick={onRetry} isFullWidth>
 <RefreshCw className="w-4 h-4 mr-1.5"/> TRY AGAIN
 </Button>
 {onReset && (
 <Button variant="secondary"size="md"onClick={onReset} isFullWidth>
 RESET
 </Button>
 )}
 </div>
 </div>
 );
};
