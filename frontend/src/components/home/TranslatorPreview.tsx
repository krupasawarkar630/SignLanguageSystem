"use client";

import React, { useState } from"react";
import Link from"next/link";
import { Button, Badge, ProgressBar } from"@/components/ui";
import { SectionHeading } from"./SectionHeading";
import {
 Volume2,
 Scan,
 Hand,
 Sparkles,
 ArrowRight,
 Play,
 RotateCcw,
 Zap,
} from"lucide-react";

export const TranslatorPreview: React.FC = () => {
 const [isPlayingAudio, setIsPlayingAudio] = useState(false);

 const triggerMockSpeech = () => {
 if (typeof window !=="undefined"&&"speechSynthesis"in window) {
 const utterance = new SpeechSynthesisUtterance("Hello, nice to meet you.");
 utterance.rate = 1.0;
 utterance.pitch = 1.0;
 utterance.onstart = () => setIsPlayingAudio(true);
 utterance.onend = () => setIsPlayingAudio(false);
 utterance.onerror = () => setIsPlayingAudio(false);
 window.speechSynthesis.speak(utterance);
 } else {
 setIsPlayingAudio(true);
 setTimeout(() => setIsPlayingAudio(false), 1200);
 }
 };

 return (
 <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 font-mono">
 <SectionHeading
 badge="01 • LIVE TRANSLATION"
 badgeVariant="primary"
 title="SEE THE TRANSLATION."
 subtitle="Watch how raw skeletal movement is continuously resolved into fluent speech and readable text."
 />

 <div className="border-gestura-border bg-surface shadow-soft p-6 sm:p-8">
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
 {/* Left Column: Camera / Hand Analysis Viewport */}
 <div className="lg:col-span-6 bg-ink border-gestura-border p-5 text-white flex flex-col justify-between relative overflow-hidden hud-grid">
 <div className="flex items-center justify-between text-xs pb-3 border-b border-white/20 z-10">
 <div className="flex items-center gap-2">
 <span className="w-2 h-2 rounded-full bg-primary animate-pulse"/>
 <span className="font-bold">WEBCAM VISION STREAM</span>
 </div>
 <span className="text-[10px] text-white/60 bg-black px-2 py-0.5 border border-white/20">
 60 FPS • MIRRORED
 </span>
 </div>

 {/* Skeleton Diagram */}
 <div className="my-8 flex flex-col items-center justify-center relative z-10">
 <div className="w-24 h-24 border-primary bg-primary/20 flex items-center justify-center relative">
 <Hand className="w-12 h-12 text-primary animate-pulse-subtle"/>
 <span className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-primary border border-white"/>
 <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary border border-white"/>
 <span className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-primary border border-white"/>
 <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-primary border border-white"/>
 </div>
 <span className="mt-3 px-3 py-1 bg-black text-white text-xs font-bold border border-white/30">
 21 JOINTS STABILIZED
 </span>
 </div>

 <div className="flex justify-between items-center text-[10px] text-white/70 border-t border-white/20 pt-2 z-10">
 <span>LATENCY: 8.4ms</span>
 <span>HOLD WINDOW: 800ms</span>
 <span className="text-primary-light font-bold">STATE: LOCKED</span>
 </div>
 </div>

 {/* Right Column: Editorial Translation Flow */}
 <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
 {/* Gesture Detected Card */}
 <div className="p-5 bg-primary-light border-gestura-border space-y-2 shadow-soft">
 <div className="flex justify-between items-center text-xs text-ink-muted font-bold">
 <span>GESTURE DETECTED</span>
 <span className="text-primary font-black">98.4% CONFIDENCE</span>
 </div>
 <div className="text-3xl sm:text-4xl font-black text-ink font-display tracking-tight">
 &ldquo;HELLO&rdquo;
 </div>
 <ProgressBar value={98.4} max={100} variant="primary"size="sm"/>
 </div>

 {/* Translated Message Stream */}
 <div className="p-5 bg-surface border-gestura-border space-y-2 shadow-soft flex-1">
 <span className="text-xs font-bold text-ink-muted uppercase block">
 TRANSLATED MESSAGE ACCUMULATOR
 </span>
 <p className="text-xl sm:text-2xl font-black text-ink font-display leading-snug">
 &ldquo;Hello, nice to meet you. Let&rsquo;s communicate.&rdquo;
 </p>
 <div className="text-xs text-ink-muted pt-2 border-t border-gestura-border/10 flex justify-between font-sans">
 <span>3 words buffered</span>
 <span>Synthesized via Web Speech API</span>
 </div>
 </div>

 {/* Action Buttons */}
 <div className="flex flex-wrap items-center gap-3">
 <Button
 variant="secondary"
 size="lg"
 onClick={triggerMockSpeech}
 isLoading={isPlayingAudio}
 className="btn-kinetic flex-1"
 >
 <Volume2 className="w-4 h-4 mr-2"/>
 {isPlayingAudio ?"SPEAKING AUDIO...":"SPEAK TRANSLATION"}
 </Button>

 <Link href="/translate">
 <Button variant="primary"size="lg"className="btn-kinetic">
 LAUNCH STUDIO →
 </Button>
 </Link>
 </div>
 </div>
 </div>
 </div>
 </section>
 );
};
