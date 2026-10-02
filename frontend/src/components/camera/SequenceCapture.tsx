"use client";

import React, { useState, useRef, useEffect } from "react";
import { useHandDetection } from "@/context/HandDetectionContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";

export function SequenceCapture({ label, onSave }: { label: string, onSave: (frames: any[]) => void }) {
  const { landmarker } = useHandDetection();
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const framesRef = useRef<any[]>([]);

  useEffect(() => {
    if (isRecording && landmarker.latestResult) {
      framesRef.current.push({
        landmarks: landmarker.latestResult.landmarks,
        pose: landmarker.latestResult.pose, // If exposed by landmarker
        timestamp: performance.now()
      });
    }
  }, [landmarker.latestResult, isRecording]);

  const startSequence = () => {
    framesRef.current = [];
    setCountdown(3);
    
    let cnt = 3;
    const interval = setInterval(() => {
      cnt--;
      if (cnt > 0) {
        setCountdown(cnt);
      } else {
        clearInterval(interval);
        setCountdown(null);
        setIsRecording(true);
        // Record for exactly 2.5 seconds or until manually stopped
        setTimeout(() => stopSequence(), 2500); 
      }
    }, 1000);
  };

  const stopSequence = () => {
    setIsRecording(false);
    if (framesRef.current.length > 0) {
      onSave(framesRef.current);
    }
  };

  return (
    <Card variant="white" shadowSize="sm" className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Sequence Capture</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center space-y-4">
        <div className="text-sm font-bold text-ink-muted uppercase">Target: {label}</div>
        
        {countdown !== null && (
          <div className="text-6xl font-black text-primary animate-pulse">{countdown}</div>
        )}
        
        {isRecording && (
          <div className="text-xl font-bold text-danger animate-pulse flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-danger"></div>
            RECORDING...
          </div>
        )}

        {!isRecording && countdown === null && (
          <button 
            onClick={startSequence}
            className="w-full py-3 bg-primary text-white font-bold uppercase rounded hover:bg-opacity-90"
          >
            Start Capture
          </button>
        )}
        
        <div className="text-xs text-ink-muted text-center mt-2">
          Captures 2.5 seconds of raw landmark motion data for Temporal Modeling.
        </div>
      </CardContent>
    </Card>
  );
}
