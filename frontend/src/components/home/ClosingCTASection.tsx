"use client";

import React from"react";
import Link from"next/link";
import { Button } from"@/components/ui";
import { ArrowRight } from"lucide-react";

export const ClosingCTASection: React.FC = () => {
 return (
 <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="rounded-3xl bg-surface-dark text-white px-8 py-16 sm:px-16 sm:py-20 relative overflow-hidden text-center space-y-8">
 {/* Subtle radial gradient accent */}
 <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(15,118,110,0.25)_0%,transparent_60%)] pointer-events-none"/>

 <div className="relative z-10 max-w-2xl mx-auto space-y-6">
 <h2 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
 Ready to start{""}
 <span className="text-primary-light">translating?</span>
 </h2>

 <p className="text-base sm:text-lg text-white/60 max-w-xl mx-auto leading-relaxed">
 Real-time on-device gesture translation. No installation, no sign-up — just open your browser.
 </p>

 <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
 <Link href="/translate">
 <Button size="xl"variant="primary"className="w-full sm:w-auto bg-white text-surface-dark hover:bg-white/90">
 Start translating
 <ArrowRight className="w-4 h-4 ml-2"/>
 </Button>
 </Link>
 <Link href="/gestures">
 <Button size="xl"variant="ghost"className="w-full sm:w-auto text-white hover:bg-white/10">
 Explore gestures
 </Button>
 </Link>
 </div>
 </div>
 </div>
 </section>
 );
};
