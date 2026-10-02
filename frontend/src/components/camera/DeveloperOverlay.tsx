"use client";

import React, { useState, useEffect } from "react";
import { useHandDetection } from "@/context/HandDetectionContext";
import { useGestureInference } from "@/lib/inference/useGestureInference";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";

export function DeveloperOverlay() {
  const [isVisible, setIsVisible] = useState(false);
  const { camera, landmarker } = useHandDetection();
  const { telemetry, latestResult } = landmarker;
  const inference = useGestureInference(latestResult, camera.status === "active");
  const [memory, setMemory] = useState<any>(null);

  useEffect(() => {
    // Check local storage for developer mode flag
    const isDev = localStorage.getItem("gestura_dev_mode") === "true";
    setIsVisible(isDev);

    const interval = setInterval(() => {
      if ((performance as any).memory) {
        setMemory((performance as any).memory);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  const pred = inference.predictions[0]; // Just take first hand

  return (
    <Card variant="white" shadowSize="md" className="fixed bottom-4 right-4 w-96 z-50 opacity-95">
      <CardHeader className="py-2 border-b border-gestura-border">
        <CardTitle className="text-sm flex justify-between items-center">
          <span>DEVELOPER MODE</span>
          <button onClick={() => {
            localStorage.setItem("gestura_dev_mode", "false");
            setIsVisible(false);
          }} className="text-ink-muted hover:text-danger">✕</button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-3 font-mono text-[10px] max-h-[70vh] overflow-y-auto">
        
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gestura-bg-secondary p-1 border border-gestura-border">
            <div className="text-ink-muted">FPS</div>
            <div className="font-bold">{telemetry.fps.toFixed(1)}</div>
          </div>
          <div className="bg-gestura-bg-secondary p-1 border border-gestura-border">
            <div className="text-ink-muted">MEM (JS Heap)</div>
            <div className="font-bold">{memory ? `${(memory.usedJSHeapSize / 1048576).toFixed(1)} MB` : 'N/A'}</div>
          </div>
          <div className="bg-gestura-bg-secondary p-1 border border-gestura-border">
            <div className="text-ink-muted">TRACK MS</div>
            <div className="font-bold">{telemetry.latencyMs.toFixed(1)}</div>
          </div>
          <div className="bg-gestura-bg-secondary p-1 border border-gestura-border">
            <div className="text-ink-muted">ONNX MS</div>
            <div className="font-bold">{inference.inferenceLatency.toFixed(1)}</div>
          </div>
        </div>

        {pred && (
          <div className="space-y-2 border-t border-gestura-border pt-2">
            <div className="text-ink-muted font-bold">TOP 3 PROBABILITIES</div>
            {pred.top3?.map((p, i) => (
              <div key={i} className="flex justify-between items-center">
                <span>{p.label}</span>
                <div className="flex-1 mx-2 h-1.5 bg-gestura-bg-secondary overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${p.p * 100}%` }} />
                </div>
                <span>{(p.p * 100).toFixed(1)}%</span>
              </div>
            ))}
            
            <div className="mt-2 text-ink-muted font-bold">RAW FEATURES (Length: {pred.rawFeatures?.length || 0})</div>
            <div className="bg-gestura-bg-secondary p-1 overflow-x-auto whitespace-nowrap border border-gestura-border text-[8px]">
              {pred.rawFeatures?.map(f => f.toFixed(3)).join(', ')}
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
