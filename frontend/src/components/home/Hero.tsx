"use client";

import React from"react";
import Link from"next/link";
import { Button } from"@/components/ui";
import { HandAnalysisVisual } from"./HandAnalysisVisual";
import { ArrowRight } from"lucide-react";

export const Hero: React.FC = () => {
 return (
 <section className="bg-gestura-bg pt-12 pb-16 md:pt-20 md:pb-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
 <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
 {/* Left Editorial Copy */}
 <div className="lg:col-span-6 space-y-6 section-animate">
 <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#d8efea] text-[#127a6c] text-sm font-semibold rounded-full">
 <span className="w-2 h-2 rounded-full bg-[#127a6c]"/>
 Assistive communication, reimagined
 </div>

 <h1 className="text-6xl sm:text-7xl font-bold tracking-tight text-ink leading-[1.05]">
 Your hands.<br />
 <span className="text-primary">Your voice.</span>
 </h1>

 <p className="text-xl text-ink-muted leading-relaxed font-medium max-w-lg">
 GESTURA reads hand gestures through your webcam and turns them into spoken words — in real time, on your device.
 </p>

 {/* Action CTAs */}
 <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
 <Link href="/translate">
 <Button size="xl" variant="primary" className="w-full sm:w-auto rounded-full font-bold px-8 shadow-sm">
 Start translating
 <ArrowRight className="w-5 h-5 ml-2"/>
 </Button>
 </Link>
 <Link href="/gestures">
 <Button size="xl" variant="outline" className="w-full sm:w-auto rounded-full bg-white text-ink font-bold shadow-sm hover:bg-gray-50 border border-gray-200 px-8 flex items-center">
 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>
 Explore gestures
 </Button>
 </Link>
 </div>

 <div className="flex flex-wrap items-center gap-4 text-sm text-ink-muted pt-6 font-medium">
   <div className="flex items-center gap-2">
     <div className="w-1.5 h-1.5 bg-ink-muted rounded-full"></div>
     On-device AI
   </div>
   <div className="flex items-center gap-2">
     <div className="w-1.5 h-1.5 bg-ink-muted rounded-full"></div>
     21-point tracking
   </div>
   <div className="flex items-center gap-2">
     <div className="w-1.5 h-1.5 bg-ink-muted rounded-full"></div>
     No data leaves your machine
   </div>
 </div>
 </div>

 {/* Right Stage: HandAnalysisVisual */}
 <div className="lg:col-span-6 section-animate"style={{ animationDelay:"0.15s"}}>
 <HandAnalysisVisual />
 </div>
 </div>
 </section>
 );
};
