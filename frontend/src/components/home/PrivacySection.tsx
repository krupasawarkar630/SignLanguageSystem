"use client";

import React from"react";
import { ShieldCheck, Eye, HardDrive, Wifi } from"lucide-react";

export const PrivacySection: React.FC = () => {
 const promises = [
 {
 icon: <Eye className="w-5 h-5 text-primary"/>,
 title:"Camera frames stay in memory",
 detail:"Raw video is processed in volatile browser memory and immediately discarded after landmark extraction. Nothing is saved.",
 },
 {
 icon: <HardDrive className="w-5 h-5 text-primary"/>,
 title:"All AI runs on your device",
 detail:"MediaPipe and ONNX inference execute in WebAssembly directly on your hardware. Zero cloud round-trips.",
 },
 {
 icon: <Wifi className="w-5 h-5 text-primary"/>,
 title:"No video upload, ever",
 detail:"Only numerical joint coordinates are used for classification. No images or video frames leave your browser.",
 },
 ];

 return (
 <section className="mx-4 sm:mx-6 lg:mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">
 <div className="rounded-3xl bg-primary-light/60 p-8 sm:p-12 lg:p-16 space-y-8">
 <div className="flex items-center gap-3">
 <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
 <ShieldCheck className="w-6 h-6 text-white"/>
 </div>
 <div>
 <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">
 Everything stays on your device
 </h2>
 <p className="text-sm text-ink-muted mt-1">
 Privacy by architecture, not by policy.
 </p>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 {promises.map((item) => (
 <div key={item.title} className="space-y-3">
 <div className="w-10 h-10 rounded-xl bg-white/80 flex items-center justify-center shadow-soft-sm">
 {item.icon}
 </div>
 <h3 className="text-base font-bold text-ink">{item.title}</h3>
 <p className="text-sm text-ink-muted leading-relaxed">{item.detail}</p>
 </div>
 ))}
 </div>
 </div>
 </section>
 );
};
