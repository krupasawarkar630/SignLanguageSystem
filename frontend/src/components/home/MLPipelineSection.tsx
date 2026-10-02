"use client";

import React from"react";
import { Badge } from"@/components/ui";
import { SectionHeading } from"./SectionHeading";
import {
 Camera,
 Scan,
 Compass,
 Cpu,
 Hand,
 Type,
 Volume2,
 ArrowRight,
 ChevronRight,
} from"lucide-react";

export const MLPipelineSection: React.FC = () => {
 const pipelineNodes = [
 {
 stage:"01",
 name:"CAMERA",
 tech:"640x480 @ 60 FPS",
 desc:"Video stream accessed in browser memory via getUserMedia with zero frame caching.",
 icon: <Camera className="w-5 h-5 text-primary"/>,
 },
 {
 stage:"02",
 name:"21 LANDMARKS",
 tech:"MediaPipe Vision WASM",
 desc:"Anatomical skeletal point coordinates detected with sub-pixel precision.",
 icon: <Scan className="w-5 h-5 text-secondary-dark"/>,
 },
 {
 stage:"03",
 name:"82D FEATURES",
 tech:"Geometric Invariance",
 desc:"Wrist translation, palm scale normalization, finger ratios, and joint angles.",
 icon: <Compass className="w-5 h-5 text-primary"/>,
 },
 {
 stage:"04",
 name:"CLASSIFIER",
 tech:"ONNX Runtime Web",
 desc:"Quantized neural model executing inference in <15ms on local client threads.",
 icon: <Cpu className="w-5 h-5 text-secondary-dark"/>,
 },
 {
 stage:"05",
 name:"GESTURE",
 tech:"Confidence & Hold",
 desc:"800ms temporal hold window validates candidate sign stability and rejects noise.",
 icon: <Hand className="w-5 h-5 text-amber-600"/>,
 },
 {
 stage:"06",
 name:"TEXT",
 tech:"Sentence Accumulator",
 desc:"Structured sentence buffers compile gesture sequences into readable prose.",
 icon: <Type className="w-5 h-5 text-primary"/>,
 },
 {
 stage:"07",
 name:"VOICE",
 tech:"Web Speech Synthesis",
 desc:"Vocal audio generated directly via browser speech synthesis with custom pitch.",
 icon: <Volume2 className="w-5 h-5 text-purple-600"/>,
 },
 ];

 return (
 <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 font-mono">
 <SectionHeading
 badge="05 • MODEL INTELLIGENCE ARCHITECTURE"
 badgeVariant="primary"
 title="THE 7-STAGE INFERENCE PIPELINE."
 subtitle="Explore the end-to-end mathematical dataflow from raw photons to vocal synthesis."
 />

 {/* Signature Pipeline Flow Diagram */}
 <div className="border-gestura-border bg-ink text-white p-6 sm:p-8 shadow-soft relative overflow-hidden">
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4 relative z-10">
 {pipelineNodes.map((node) => (
 <div
 key={node.name}
 className="bg-white/10 border-white/20 p-4 flex flex-col justify-between space-y-3 relative group hover:bg-white/15 hover:border-primary transition-all"
 >
 <div className="space-y-2">
 <div className="flex justify-between items-center text-[10px] text-white/60">
 <span className="font-bold text-primary-light">{node.stage}</span>
 <span className="w-6 h-6 bg-black flex items-center justify-center border border-white/20">
 {node.icon}
 </span>
 </div>

 <h4 className="text-sm font-black uppercase text-white tracking-wider font-display">
 {node.name}
 </h4>

 <div className="text-[10px] text-primary-light font-bold uppercase">
 {node.tech}
 </div>
 </div>

 <p className="text-[10px] text-white/70 leading-relaxed font-sans pt-2 border-t border-white/10">
 {node.desc}
 </p>
 </div>
 ))}
 </div>
 </div>
 </section>
 );
};
