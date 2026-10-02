"use client";

import React from"react";
import Link from"next/link";
import { Badge, Button } from"@/components/ui";
import { SectionHeading } from"./SectionHeading";
import { Hand, ArrowRight, BookOpen } from"lucide-react";

export const GestureLibrarySection: React.FC = () => {
 const previewGestures = [
 {
 id:"A",
 name:"Sign 'A'",
 category:"Alphabet",
 posture:"Tight Fist • Vertical Thumb",
 angle:"12.4°",
 desc:"All 4 fingers curled tightly into palm with thumb resting upright beside the index MCP.",
 },
 {
 id:"B",
 name:"Sign 'B'",
 category:"Alphabet",
 posture:"Open Palm • Thumb Across",
 angle:"4.8°",
 desc:"Four upright extended fingers held together facing camera with thumb folded over palm.",
 },
 {
 id:"HELLO",
 name:"Greeting 'HELLO'",
 category:"Phrase",
 posture:"Salute Extension",
 angle:"18.2°",
 desc:"Flat open hand positioned at forehead translated smoothly outward in formal greeting.",
 },
 {
 id:"HELP",
 name:"Emergency 'HELP'",
 category:"Emergency",
 posture:"Dual Support",
 angle:"0.0°",
 desc:"Non-dominant flat palm supporting dominant thumbs-up upright fist.",
 },
 ];

 return (
 <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 font-mono">
 <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
 <SectionHeading
 badge="04 • KINEMATIC VOCABULARY"
 badgeVariant="secondary"
 title="GESTURES THE MODEL KNOWS."
 subtitle="A structured dictionary of static signs, alphabet letters, and critical assistive communication gestures."
 />

 <Link href="/gestures">
 <Button variant="secondary"size="md"className="btn-kinetic whitespace-nowrap">
 VIEW FULL LIBRARY ({previewGestures.length}+ SIGNS) →
 </Button>
 </Link>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
 {previewGestures.map((g) => (
 <div
 key={g.id}
 className="border-gestura-border bg-surface p-6 shadow-soft flex flex-col justify-between space-y-4 hover:-translate-y-1 hover:shadow-soft transition-all"
 >
 <div className="space-y-3">
 <div className="flex justify-between items-center">
 <span className="px-2 py-0.5 bg-primary-light text-primary text-[11px] font-bold border border-gestura-border">
 KEY: {g.id}
 </span>
 <Badge
 variant={g.category ==="Emergency"?"danger":"primary"}
 size="sm"
 >
 {g.category}
 </Badge>
 </div>

 {/* Visual Joint Diagram */}
 <div className="h-28 bg-ink border-gestura-border flex flex-col items-center justify-center text-white relative p-2">
 <div className="w-10 h-10 border border-primary flex items-center justify-center relative bg-primary/20">
 <Hand className="w-6 h-6 text-primary"/>
 </div>
 <div className="mt-2 text-[10px] text-white/80 font-bold uppercase">
 {g.posture}
 </div>
 </div>

 <h4 className="text-xl font-black uppercase text-ink font-display">
 {g.name}
 </h4>

 <p className="text-xs text-ink-muted font-sans font-medium leading-relaxed">
 {g.desc}
 </p>
 </div>

 <div className="pt-3 border-t border-gestura-border/15 flex justify-between items-center text-[11px] font-bold text-ink">
 <span>ANGLE: {g.angle}</span>
 <Link href={`/learn?sign=${g.id}`} className="text-primary hover:underline flex items-center gap-1 font-black">
 <span>Train</span>
 <ArrowRight className="w-3 h-3"/>
 </Link>
 </div>
 </div>
 ))}
 </div>
 </section>
 );
};
