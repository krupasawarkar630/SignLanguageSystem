"use client";

import React from"react";
import { Badge, Card } from"@/components/ui";
import { SectionHeading } from"./SectionHeading";
import { Scan, Compass, Zap, Activity, Eye, ShieldCheck } from"lucide-react";

export const DataVisualizationSection: React.FC = () => {
 const dataCards = [
 {
 num:"21",
 label:"3D SKELETAL LANDMARKS",
 desc:"MediaPipe detects sub-pixel coordinates for wrist, thumb, index, middle, ring, and pinky joints continuously.",
 accent:"text-primary",
 },
 {
 num:"82D",
 label:"KINEMATIC FEATURE VECTOR",
 desc:"Translates coordinates to wrist origin, normalizes palm scale, and calculates inter-joint angles and spatial normal vectors.",
 accent:"text-primary",
 },
 {
 num:"60 FPS",
 label:"REAL-TIME FRAME RATE",
 desc:"In-memory requestAnimationFrame loop runs detection synchronized to camera refresh rates without frame drops.",
 accent:"text-ink",
 },
 {
 num:"<15ms",
 label:"ONNX WASM LATENCY",
 desc:"On-device inference pipeline executes directly on client hardware with zero round-trip cloud latency.",
 accent:"text-primary",
 },
 ];

 return (
 <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 font-mono">
 <SectionHeading
 badge="02 • COMPUTER VISION TELEMETRY"
 badgeVariant="secondary"
 title="THE MODEL SEES MORE THAN A GESTURE."
 subtitle="Behind every translated sign is a high-dimensional mathematical coordinate stream mapped with geometric precision."
 />

 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
 {dataCards.map((card) => (
 <div
 key={card.label}
 className="border-gestura-border bg-surface p-6 shadow-soft flex flex-col justify-between space-y-6 hover:-translate-y-1 hover:shadow-soft transition-all"
 >
 <div className="space-y-2">
 <span className={`text-4xl sm:text-5xl font-black font-display tracking-tight ${card.accent}`}>
 {card.num}
 </span>
 <h3 className="text-sm font-black uppercase text-ink font-mono">
 {card.label}
 </h3>
 </div>

 <p className="text-xs text-ink-muted font-sans font-medium leading-relaxed">
 {card.desc}
 </p>
 </div>
 ))}
 </div>
 </section>
 );
};
