"use client";

import React, { useState } from"react";
import Link from"next/link";
import {
 Card,
 CardHeader,
 CardTitle,
 CardDescription,
 CardContent,
 Button,
 Badge,
 ProgressBar,
 EmptyState,
 Alert,
} from"@/components/ui";
import {
 BookOpen,
 Award,
 Target,
 Camera,
 CheckCircle2,
 RefreshCw,
 Sparkles,
 Zap,
 Scan,
 Activity,
 Compass,
} from"lucide-react";

export default function LearnPage() {
 const [targetSign, setTargetSign] = useState("A");

 return (
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-mono">
 {/* Page Header */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
 <div>
 <div className="flex items-center gap-2 mb-1">
 <Badge variant="secondary"size="sm">
 KINEMATIC TRAINER
 </Badge>
 <span className="text-xs font-bold text-ink-muted">
 POSTURE MATCHING & SCORING
 </span>
 </div>
 <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black font-display">
 Kinematic Posture Trainer
 </h1>
 </div>

 <div className="flex items-center gap-3">
 <div className="px-3 py-1.5 bg-black text-white text-xs font-bold shadow-soft flex items-center gap-2">
 <Award className="w-4 h-4 text-secondary"/>
 <span>TRAINER SCORE: 0 PTS</span>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
 {/* Left: Practice Camera Standby */}
 <div className="lg:col-span-7 space-y-6">
 <Card variant="white"shadowSize="lg"className="p-0 overflow-hidden">
 <div className="bg-[#ECE8DF] p-3.5 flex items-center justify-between">
 <div className="flex items-center gap-2">
 <Scan className="w-4 h-4 text-primary"/>
 <span className="text-xs font-bold uppercase text-black">
 KINEMATIC ALIGNMENT VIEWPORT
 </span>
 </div>
 <Badge variant="neutral"size="sm">
 TARGET: SIGN {targetSign}
 </Badge>
 </div>

 <div className="relative aspect-[4/3] bg-surface-dark flex items-center justify-center p-6">
 {/* Grid Background */}
 <div className="absolute inset-0 bg-[radial-gradient(#3B82F6_1px,transparent_1px)] [background-size:16px_16px] opacity-25"/>
 <EmptyState
 icon={<Camera className="w-8 h-8 text-primary"/>}
 title="Posture Matcher Standby"
 description="The interactive learning engine with real-time joint angle validation and posture scoring will connect in Phase 6."
 statusBadge="Awaiting Phase 6"
 className="bg-surface text-ink shadow-soft max-w-md z-10"
 />
 </div>

 <div className="p-4 bg-[#F7F4ED] flex items-center justify-between text-xs font-bold">
 <span className="text-ink-muted">
 HOLD POSE STABILITY &gt;90% FOR 1.5S TO SCORE
 </span>
 <Button variant="secondary"size="sm"disabled>
 <RefreshCw className="w-3.5 h-3.5 mr-1"/> Skip Sign
 </Button>
 </div>
 </Card>
 </div>

 {/* Right: Challenge Details & Progress */}
 <div className="lg:col-span-5 space-y-6">
 <Card variant="cream"shadowSize="md">
 <CardHeader>
 <div className="flex items-center justify-between">
 <CardTitle className="text-lg font-display">KINEMATIC TARGET</CardTitle>
 <Badge variant="primary"size="sm">
 SIGN {targetSign}
 </Badge>
 </div>
 <CardDescription className="font-sans">
 Form the gesture matching target angular constraints
 </CardDescription>
 </CardHeader>

 <CardContent className="space-y-4">
 <div className="p-4 bg-white space-y-2">
 <h4 className="font-bold text-sm uppercase flex items-center gap-2">
 <Compass className="w-4 h-4 text-primary"/>
 Posture Coordinates:
 </h4>
 <p className="text-xs text-ink-muted leading-relaxed font-sans">
 Curl all 4 fingers firmly inward to 0.94 flexion. Place your thumb upright against the radial border of the index MCP joint.
 </p>
 </div>

 <div className="space-y-2">
 <div className="flex justify-between text-xs font-bold">
 <span>JOINT SIMILARITY</span>
 <span className="text-primary">0%</span>
 </div>
 <ProgressBar value={0} max={100} variant="secondary"/>
 </div>
 </CardContent>
 </Card>

 <Card variant="white"shadowSize="md">
 <CardHeader>
 <CardTitle className="text-lg font-display">MASTERY MATRIX</CardTitle>
 <CardDescription className="font-sans">
 Completion breakdown across vocabulary sets
 </CardDescription>
 </CardHeader>

 <CardContent className="space-y-3 text-xs">
 <div className="p-2.5 bg-[#F7F4ED] flex justify-between items-center">
 <span className="font-bold">ASL ALPHABET (A-Z)</span>
 <Badge variant="neutral"size="sm">0/26</Badge>
 </div>
 <div className="p-2.5 bg-[#F7F4ED] flex justify-between items-center">
 <span className="font-bold">NUMBERS (0-9)</span>
 <Badge variant="neutral"size="sm">0/10</Badge>
 </div>
 <div className="p-2.5 bg-[#F7F4ED] flex justify-between items-center">
 <span className="font-bold">EMERGENCY & ESSENTIALS</span>
 <Badge variant="neutral"size="sm">0/8</Badge>
 </div>
 </CardContent>
 </Card>
 </div>
 </div>
 </div>
 );
}
