"use client";

import React from"react";
import { SectionHeading } from"./SectionHeading";
import { Hand, Sparkles, Type, Volume2 } from"lucide-react";

export const HowItWorksSection: React.FC = () => {
 const steps = [
 {
 num:"01",
 title:"Hand",
 summary:"Show your hand to the camera",
 detail:
"MediaPipe detects 21 skeletal joint coordinates directly in your browser at 60 FPS. Video frames never leave your device.",
 icon: <Hand className="w-6 h-6 text-primary"/>,
 },
 {
 num:"02",
 title:"Gesture",
 summary:"AI recognizes the sign",
 detail:
"An ONNX neural network classifies the 82-dimensional kinematic feature vector in under 15ms on your local hardware.",
 icon: <Sparkles className="w-6 h-6 text-primary"/>,
 },
 {
 num:"03",
 title:"Words",
 summary:"Gesture becomes text",
 detail:
"Confidence thresholds and temporal hold buffers debounce candidate signs into clean, readable sentences on screen.",
 icon: <Type className="w-6 h-6 text-primary"/>,
 },
 {
 num:"04",
 title:"Voice",
 summary:"Text is spoken aloud",
 detail:
"The browser's Web Speech API vocalizes the translated message, enabling conversation with non-signing partners.",
 icon: <Volume2 className="w-6 h-6 text-primary"/>,
 },
 ];

 return (
 <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
 <SectionHeading
 badge="How it works"
 badgeVariant="secondary"
 title="From movement to meaning"
 subtitle="Four continuous stages turning raw hand movement into understandable communication."
 align="center"
 />

 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
 {/* Connector line (desktop only) */}
 <div className="hidden lg:block absolute top-16 left-[12.5%] right-[12.5%] h-px bg-gestura-border"/>

 {steps.map((step, idx) => (
 <div
 key={step.num}
 className="relative flex flex-col items-center text-center space-y-4 section-animate"
 style={{ animationDelay: `${idx * 0.1}s` }}
 >
 {/* Icon circle */}
 <div className="w-14 h-14 rounded-2xl bg-primary-light flex items-center justify-center relative z-10">
 {step.icon}
 </div>

 <div className="space-y-2">
 <h3 className="text-xl font-bold text-ink">
 {step.title}
 </h3>
 <p className="text-sm font-semibold text-primary">
 {step.summary}
 </p>
 <p className="text-sm text-ink-muted leading-relaxed">
 {step.detail}
 </p>
 </div>
 </div>
 ))}
 </div>
 </section>
 );
};
