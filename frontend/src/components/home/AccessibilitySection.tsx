"use client";

import React from"react";
import { Badge } from"@/components/ui";
import { SectionHeading } from"./SectionHeading";
import { Hand, Type, Volume2, ArrowRight, HeartHandshake, Sparkles } from"lucide-react";

export const AccessibilitySection: React.FC = () => {
 return (
 <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 font-mono">
 <SectionHeading
 badge="06 • PURPOSE & ACCESSIBILITY"
 badgeVariant="secondary"
 title="COMMUNICATION SHOULDN'T NEED A COMMON LANGUAGE."
 subtitle="Bridging the gap between manual sign communication, digital text, and audible speech through client-side computer vision."
 />

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
 <div className="border-gestura-border bg-surface p-6 shadow-soft space-y-4">
 <div className="w-10 h-10 bg-primary text-white border-gestura-border flex items-center justify-center font-bold">
 <Hand className="w-5 h-5"/>
 </div>
 <h3 className="text-xl font-black uppercase text-ink font-display">
 01 • GESTURE EXPRESSION
 </h3>
 <p className="text-xs text-ink-muted font-sans font-medium leading-relaxed">
 Individuals express static signs naturally with either hand. MediaPipe tracks 21 skeletal coordinates invariant to hand size, position, or lighting.
 </p>
 </div>

 <div className="border-gestura-border bg-gestura-bg-secondary p-6 shadow-soft space-y-4">
 <div className="w-10 h-10 bg-primary-light text-primary border-gestura-border flex items-center justify-center font-bold">
 <Type className="w-5 h-5"/>
 </div>
 <h3 className="text-xl font-black uppercase text-ink font-display">
 02 • INSTANT TEXT
 </h3>
 <p className="text-xs text-ink-muted font-sans font-medium leading-relaxed">
 Signs are classified in under 15 milliseconds and debounced into readable words, making continuous visual conversation scannable on-screen.
 </p>
 </div>

 <div className="border-gestura-border bg-surface p-6 shadow-soft space-y-4">
 <div className="w-10 h-10 bg-primary-light text-primary border-gestura-border flex items-center justify-center font-bold">
 <Volume2 className="w-5 h-5"/>
 </div>
 <h3 className="text-xl font-black uppercase text-ink font-display">
 03 • VOCAL AUDIBILITY
 </h3>
 <p className="text-xs text-ink-muted font-sans font-medium leading-relaxed">
 Browser speech synthesis vocalizes the compiled message aloud, enabling seamless conversation with non-signing conversation partners.
 </p>
 </div>
 </div>
 </section>
 );
};
