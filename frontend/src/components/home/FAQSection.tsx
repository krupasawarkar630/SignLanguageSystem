"use client";

import React, { useState } from"react";
import { ChevronDown } from"lucide-react";
import { cn } from"@/lib/utils";

const faqItems = [
 {
 question:"What sign languages does Gestura support?",
 answer:
"Gestura currently recognizes static ASL (American Sign Language) alphabet signs and a set of common phrase gestures. The model classifies individual hand postures — it does not yet support dynamic/motion-based signs or full sentence-level sign language grammar.",
 },
 {
 question:"Does Gestura send my camera feed to the cloud?",
 answer:
"No. All processing happens entirely in your browser. MediaPipe extracts 21 joint coordinates from each camera frame in volatile memory, and those frames are immediately discarded. Only numerical landmark vectors are passed to the on-device ONNX classifier. No images or video ever leave your device.",
 },
 {
 question:"What hardware do I need?",
 answer:
"A modern web browser (Chrome, Edge, or Firefox) with a webcam. Gestura runs on standard laptops and desktops — no GPU required. The ONNX model and MediaPipe WASM runtime execute on your CPU via WebAssembly.",
 },
 {
 question:"How accurate is the translation?",
 answer:
"For the static signs in the current gesture library, classification accuracy ranges from 95–99% under normal lighting. Accuracy may vary with extreme hand angles, poor lighting, or partially occluded fingers. An 800ms temporal hold buffer helps reject noisy predictions.",
 },
];

export const FAQSection: React.FC = () => {
 const [openIndex, setOpenIndex] = useState<number | null>(null);

 return (
 <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
 <div className="text-center space-y-4">
 <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-ink">
 Frequently asked questions
 </h2>
 <p className="text-base text-ink-muted max-w-lg mx-auto">
 Common questions about how Gestura works, privacy, and system requirements.
 </p>
 </div>

 <div className="space-y-3">
 {faqItems.map((item, idx) => {
 const isOpen = openIndex === idx;
 return (
 <div
 key={idx}
 className="rounded-2xl border border-gestura-border bg-white overflow-hidden transition-shadow hover:shadow-soft-sm"
 >
 <button
 onClick={() => setOpenIndex(isOpen ? null : idx)}
 className="w-full flex items-center justify-between px-6 py-4 text-left focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-2xl"
 aria-expanded={isOpen}
 >
 <span className="text-sm sm:text-base font-semibold text-ink pr-4">
 {item.question}
 </span>
 <ChevronDown
 className={cn(
"w-5 h-5 text-ink-muted transition-transform duration-200 flex-shrink-0",
 isOpen &&"rotate-180"
 )}
 />
 </button>
 <div
 className={cn(
"overflow-hidden transition-all duration-300 ease-in-out",
 isOpen ?"max-h-96 opacity-100":"max-h-0 opacity-0"
 )}
 >
 <div className="px-6 pb-5 text-sm text-ink-muted leading-relaxed">
 {item.answer}
 </div>
 </div>
 </div>
 );
 })}
 </div>
 </section>
 );
};
