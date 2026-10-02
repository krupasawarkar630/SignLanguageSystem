"use client";

import React from"react";
import {
 Card,
 CardHeader,
 CardTitle,
 CardDescription,
 CardContent,
 Button,
 Badge,
 EmptyState,
} from"@/components/ui";
import {
 History,
 Trash2,
 Download,
 Volume2,
 Clock,
 Sparkles,
 Zap,
} from"lucide-react";

export default function HistoryPage() {
 return (
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-mono">
 {/* Page Header */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
 <div>
 <div className="flex items-center gap-2 mb-1">
 <Badge variant="primary"size="sm">
 TRANSLATION TELEMETRY
 </Badge>
 <span className="text-xs font-bold text-ink-muted">
 SESSION LOGS & TRANSCRIPTS
 </span>
 </div>
 <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black font-display">
 Kinematic Translation History
 </h1>
 </div>

 <div className="flex items-center gap-2">
 <Button variant="secondary"size="sm"disabled>
 <Download className="w-4 h-4 mr-1"/> Export Transcript
 </Button>
 <Button variant="danger"size="sm"disabled>
 <Trash2 className="w-4 h-4 mr-1"/> Clear All
 </Button>
 </div>
 </div>

 <Card variant="white"shadowSize="lg">
 <CardHeader>
 <CardTitle className="text-xl font-display">TRANSLATED SENTENCE STREAMS</CardTitle>
 <CardDescription className="font-sans">
 Chronological record of gestures debounced into words and synthesized via speech
 </CardDescription>
 </CardHeader>

 <CardContent>
 <EmptyState
 icon={<History className="w-8 h-8 text-primary"/>}
 title="Zero Translations Recorded"
 description="Activate the Live Translation Studio to start compiling your session log. Translations can be vocalized again or exported as accessible transcripts."
 statusBadge="0 Log Entries"
 actionLabel="LAUNCH TRANSLATOR STUDIO →"
 onAction={() => {
 window.location.href ="/translate";
 }}
 className="bg-[#F7F4ED] shadow-soft"
 />
 </CardContent>
 </Card>
 </div>
 );
}
