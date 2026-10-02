"use client";

import React from"react";
import { SectionHeading } from"./SectionHeading";
import {
 Radio,
 Scan,
 BookOpen,
 Volume2,
 ShieldCheck,
 Hand,
} from"lucide-react";

export const FeaturesSection: React.FC = () => {
 const features = [
 {
 icon: <Radio className="w-6 h-6 text-primary"/>,
 title:"Real-Time Translation",
 description:
"Instantly translate hand signs into text and speech as you gesture. Sub-15ms inference latency with smooth 60 FPS tracking.",
 },
 {
 icon: <Scan className="w-6 h-6 text-primary"/>,
 title:"21-Joint Hand Tracking",
 description:
"MediaPipe detects all 21 anatomical joint coordinates with sub-pixel precision, invariant to hand size and lighting conditions.",
 },
 {
 icon: <Hand className="w-6 h-6 text-primary"/>,
 title:"Gesture Library",
 description:
"Browse a structured dictionary of alphabet signs, common phrases, and emergency gestures the model recognizes.",
 },
 {
 icon: <BookOpen className="w-6 h-6 text-primary"/>,
 title:"Interactive Practice",
 description:
"Learn new signs with live feedback. Match your hand posture against reference targets and get instant accuracy scores.",
 },
 {
 icon: <Volume2 className="w-6 h-6 text-primary"/>,
 title:"Text-to-Speech Output",
 description:
"Translated gestures are spoken aloud via the browser's Web Speech API, enabling natural conversation with non-signing partners.",
 },
 {
 icon: <ShieldCheck className="w-6 h-6 text-primary"/>,
 title:"Privacy-First Processing",
 description:
"All AI inference runs entirely on your device. Camera frames are processed in volatile memory and never transmitted or stored.",
 },
 ];

 return (
 <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
 <SectionHeading
 badge="Features"
 badgeVariant="secondary"
 title="Everything you need to communicate"
 subtitle="Built for accessibility, designed for everyone."
 align="center"
 />

 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
 {features.map((feature, idx) => (
 <div
 key={feature.title}
 className="rounded-2xl border border-gestura-border bg-white p-6 shadow-soft-sm hover:shadow-soft hover:-translate-y-1 transition-all duration-250 space-y-4 section-animate"
 style={{ animationDelay: `${idx * 0.08}s` }}
 >
 <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center">
 {feature.icon}
 </div>

 <h3 className="text-lg font-bold text-ink">
 {feature.title}
 </h3>

 <p className="text-sm text-ink-muted leading-relaxed">
 {feature.description}
 </p>
 </div>
 ))}
 </div>
 </section>
 );
};
