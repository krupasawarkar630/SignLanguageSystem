"use client";

import React from"react";
import Link from"next/link";
import { Hand, ArrowUpRight } from"lucide-react";
import { useBackendStatus } from"@/lib/useBackendStatus";

export const Footer = () => {
 const { health } = useBackendStatus();

 return (
 <footer className="mt-auto border-t border-gestura-border bg-gestura-bg-secondary text-ink">
 {/* Main Footer Body */}
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
 <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
 {/* Col 1: Brand & Purpose */}
 <div className="md:col-span-1 space-y-4">
 <div className="flex items-center gap-2">
 <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
 <Hand className="w-3.5 h-3.5 text-white"/>
 </div>
 <span className="font-bold text-lg tracking-tight text-ink">gestura</span>
 </div>
 <p className="text-sm text-ink-muted leading-relaxed">
 Real-time assistive hand gesture translation. Privacy-first, on-device AI for accessible communication.
 </p>
 <div className="flex items-center gap-2 text-xs text-ink-muted">
 <span
 className={`w-2 h-2 rounded-full ${
 health.status ==="healthy"?"bg-success":"bg-danger"
 }`}
 />
 <span>
 Backend: {health.status ==="healthy"? `Online (v${health.version ||"0.1.0"})` :"Offline"}
 </span>
 </div>
 </div>

 {/* Col 2: Navigation */}
 <div className="space-y-4">
 <h4 className="text-sm font-bold text-ink">
 Tools
 </h4>
 <ul className="space-y-2.5 text-sm">
 <li>
 <Link href="/translate"className="text-ink-muted hover:text-primary transition-colors inline-flex items-center gap-1">
 <span>Live Translator</span>
 <ArrowUpRight className="w-3 h-3"/>
 </Link>
 </li>
 <li>
 <Link href="/gestures"className="text-ink-muted hover:text-primary transition-colors inline-flex items-center gap-1">
 <span>Gesture Library</span>
 <ArrowUpRight className="w-3 h-3"/>
 </Link>
 </li>
 <li>
 <Link href="/learn"className="text-ink-muted hover:text-primary transition-colors inline-flex items-center gap-1">
 <span>Interactive Practice</span>
 <ArrowUpRight className="w-3 h-3"/>
 </Link>
 </li>
 <li>
 <Link href="/history"className="text-ink-muted hover:text-primary transition-colors inline-flex items-center gap-1">
 <span>Translation History</span>
 <ArrowUpRight className="w-3 h-3"/>
 </Link>
 </li>
 </ul>
 </div>

 {/* Col 3: Technical */}
 <div className="space-y-4">
 <h4 className="text-sm font-bold text-ink">
 Technical
 </h4>
 <ul className="space-y-2.5 text-sm">
 <li>
 <Link href="/dataset"className="text-ink-muted hover:text-primary transition-colors inline-flex items-center gap-1">
 <span>Dataset Collector</span>
 <ArrowUpRight className="w-3 h-3"/>
 </Link>
 </li>
 <li>
 <Link href="/model"className="text-ink-muted hover:text-primary transition-colors inline-flex items-center gap-1">
 <span>Model Details</span>
 <ArrowUpRight className="w-3 h-3"/>
 </Link>
 </li>
 <li>
 <Link href="/developer"className="text-ink-muted hover:text-primary transition-colors inline-flex items-center gap-1">
 <span>Developer Tools</span>
 <ArrowUpRight className="w-3 h-3"/>
 </Link>
 </li>
 <li>
 <Link href="/settings"className="text-ink-muted hover:text-primary transition-colors inline-flex items-center gap-1">
 <span>Settings</span>
 <ArrowUpRight className="w-3 h-3"/>
 </Link>
 </li>
 </ul>
 </div>

 {/* Col 4: Technology */}
 <div className="space-y-4">
 <h4 className="text-sm font-bold text-ink">
 Built with
 </h4>
 <div className="space-y-2 text-sm text-ink-muted">
 <div className="flex justify-between">
 <span>Detection</span>
 <span className="font-medium text-ink">MediaPipe</span>
 </div>
 <div className="flex justify-between">
 <span>Inference</span>
 <span className="font-medium text-ink">ONNX Runtime</span>
 </div>
 <div className="flex justify-between">
 <span>Backend</span>
 <span className="font-medium text-ink">FastAPI</span>
 </div>
 <div className="flex justify-between">
 <span>Processing</span>
 <span className="font-medium text-ink">On-device</span>
 </div>
 </div>
 </div>
 </div>

 {/* Bottom bar */}
 <div className="mt-10 pt-6 border-t border-gestura-border flex flex-col sm:flex-row items-center justify-between text-sm text-ink-muted gap-3">
 <p>© {new Date().getFullYear()} Gestura — Assistive Technology</p>
 <p className="text-xs">Privacy-first sign language translation</p>
 </div>
 </div>
 </footer>
 );
};
