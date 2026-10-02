"use client";

import React from"react";
import Link from"next/link";
import { Badge, Button, ProgressBar } from"@/components/ui";
import { SectionHeading } from"./SectionHeading";
import { BookOpen, Target, CheckCircle2, ArrowRight, Zap, Scan } from"lucide-react";

export const LearningSection: React.FC = () => {
 return (
 <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 font-mono">
 <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
 <SectionHeading
 badge="07 • INTERACTIVE LEARNING"
 badgeVariant="primary"
 title="LEARN A GESTURE."
 subtitle="Test your sign precision against live mathematical coordinate targets with instant feedback."
 />

 <Link href="/learn">
 <Button variant="primary"size="md"className="btn-kinetic whitespace-nowrap">
 OPEN PRACTICE GYM →
 </Button>
 </Link>
 </div>

 <div className="border-gestura-border bg-surface p-6 sm:p-8 shadow-soft">
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
 {/* Step 1: Reference Target */}
 <div className="lg:col-span-4 p-5 bg-gestura-bg-secondary border-gestura-border space-y-3 shadow-soft">
 <div className="flex justify-between items-center text-xs">
 <span className="font-bold text-ink-muted uppercase">01 • REFERENCE</span>
 <Badge variant="primary"size="sm">SIGN &quot;A&quot;</Badge>
 </div>
 <div className="h-32 bg-ink border-gestura-border flex flex-col items-center justify-center text-white">
 <Scan className="w-8 h-8 text-primary"/>
 <span className="text-[10px] text-white/80 mt-2 font-bold">TARGET: 12.4° WRIST ANGLE</span>
 </div>
 <p className="text-xs text-ink-muted font-sans font-medium">
 Make a tight fist with your thumb resting upright against the radial border.
 </p>
 </div>

 {/* Step 2: Practice & Attempt */}
 <div className="lg:col-span-4 p-5 bg-surface border-gestura-border space-y-3 shadow-soft">
 <div className="flex justify-between items-center text-xs">
 <span className="font-bold text-ink-muted uppercase">02 • YOUR ATTEMPT</span>
 <Badge variant="secondary"size="sm">TRACKING</Badge>
 </div>
 <div className="h-32 bg-ink border-gestura-border flex flex-col items-center justify-center text-white relative">
 <div className="w-12 h-12 border border-primary flex items-center justify-center bg-primary/20">
 <span className="w-2 h-2 rounded-full bg-primary animate-pulse"/>
 </div>
 <span className="text-[10px] text-primary-light mt-2 font-bold">21 JOINTS IN FRAME</span>
 </div>
 <div className="space-y-1">
 <div className="flex justify-between text-xs font-bold text-ink">
 <span>SIMILARITY</span>
 <span className="text-primary font-black">96.8%</span>
 </div>
 <ProgressBar value={96.8} max={100} variant="primary"size="sm"/>
 </div>
 </div>

 {/* Step 3: Feedback & Score */}
 <div className="lg:col-span-4 p-5 bg-gestura-bg-secondary border-gestura-border space-y-3 shadow-soft">
 <div className="flex justify-between items-center text-xs">
 <span className="font-bold text-ink-muted uppercase">03 • MODEL FEEDBACK</span>
 <span className="text-success font-black">MATCHED!</span>
 </div>
 <div className="h-32 bg-emerald-50 border-success flex flex-col items-center justify-center text-emerald-950 p-3 text-center">
 <CheckCircle2 className="w-8 h-8 text-success mb-1"/>
 <span className="text-xs font-black uppercase text-ink">PERFECT POSTURE FIDELITY</span>
 <span className="text-[10px] text-ink-muted font-sans mt-0.5">Hold stable for 1.5s to score</span>
 </div>
 <div className="pt-2 flex justify-between items-center text-xs font-bold text-ink">
 <span>PROGRESS: 1/26 ALPHABET</span>
 <Link href="/learn"className="text-primary hover:underline flex items-center gap-1 font-black">
 <span>Next Sign</span>
 <ArrowRight className="w-3 h-3"/>
 </Link>
 </div>
 </div>
 </div>
 </div>
 </section>
 );
};
