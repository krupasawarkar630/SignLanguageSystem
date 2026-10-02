"use client";

import React, { useState } from"react";
import Link from"next/link";
import { usePathname } from"next/navigation";
import { cn } from"@/lib/utils";
import { useBackendStatus } from"@/lib/useBackendStatus";
import {
 Menu,
 X,
 Radio,
 BookOpen,
 Layers,
 Cpu,
 History,
 Settings,
 Terminal,
 Activity,
 Hand,
 Zap,
} from"lucide-react";

export const Navbar = () => {
 const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
 const pathname = usePathname();
 const { health } = useBackendStatus();

 const navLinks = [
 { href:"/translate", label:"Translate", icon: <Radio className="w-4 h-4"/> },
 { href:"/gestures", label:"Gestures", icon: <Hand className="w-4 h-4"/> },
 { href:"/learn", label:"Learn", icon: <BookOpen className="w-4 h-4"/> },
 { href:"/model", label:"Model", icon: <Cpu className="w-4 h-4"/> },
 { href:"/dataset", label:"Dataset", icon: <Layers className="w-4 h-4"/> },
 { href:"/history", label:"History", icon: <History className="w-4 h-4"/> },
 { href:"/settings", label:"Settings", icon: <Settings className="w-4 h-4"/> },
 { href:"/developer", label:"Dev", icon: <Terminal className="w-4 h-4"/> },
 ];

 const primaryLinks = navLinks.slice(0, 4);

 return (
 <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gestura-border">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="flex items-center justify-between h-16">
 {/* Logo / Brand */}
 <Link
 href="/"
 className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-lg px-1 -ml-1"
 aria-label="GESTURA Home"
 >
 <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center transition-transform group-hover:scale-105">
 <Hand className="w-4 h-4 text-white"/>
 </div>
 <span className="font-bold text-lg tracking-tight text-ink leading-none group-hover:text-primary transition-colors">
 gestura
 </span>
 </Link>

 {/* Desktop Navigation */}
 <nav className="hidden lg:flex items-center gap-1">
 {primaryLinks.map((link) => {
 const isActive = pathname === link.href;
 return (
 <Link
 key={link.href}
 href={link.href}
 className={cn(
"px-3.5 py-2 text-sm font-medium rounded-lg transition-all select-none inline-flex items-center gap-2",
 isActive
 ?"bg-primary-light text-primary font-semibold"
 :"text-ink-muted hover:text-ink hover:bg-gestura-bg-secondary"
 )}
 >
 {link.label}
 </Link>
 );
 })}
 </nav>

 {/* Status Indicator & CTAs */}
 <div className="hidden sm:flex items-center gap-3">
 {/* Backend API Status Dot */}
 <div
 className="flex items-center gap-1.5 text-xs font-medium text-ink-muted"
 title={
 health.status ==="healthy"
 ? `Backend Active (${health.service} v${health.version})`
 : `Backend ${health.status}`
 }
 >
 <span
 className={cn(
"w-2 h-2 rounded-full",
 health.status ==="healthy"
 ?"bg-success"
 : health.status ==="checking"
 ?"bg-warning animate-pulse"
 :"bg-danger"
 )}
 />
 <span className="hidden md:inline">
 {health.status ==="healthy"?"Online": health.status}
 </span>
 </div>

 <Link
 href="/translate"
 className="inline-flex items-center gap-2 px-5 py-2 bg-primary text-white text-sm font-semibold rounded-full shadow-soft-sm hover:bg-primary-hover hover:shadow-soft hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
 >
 Start translating
 <Zap className="w-3.5 h-3.5"/>
 </Link>
 </div>

 {/* Mobile menu button */}
 <div className="flex lg:hidden items-center gap-2">
 <button
 onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
 className="p-2 rounded-xl hover:bg-gestura-bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
 aria-label="Toggle navigation menu"
 >
 {mobileMenuOpen ? <X className="w-5 h-5"/> : <Menu className="w-5 h-5"/>}
 </button>
 </div>
 </div>
 </div>

 {/* Mobile menu dropdown */}
 {mobileMenuOpen && (
 <div className="lg:hidden border-t border-gestura-border bg-white px-4 pt-3 pb-5 space-y-2 shadow-soft-lg">
 <div className="grid grid-cols-2 gap-2 mb-3">
 {navLinks.map((link) => {
 const isActive = pathname === link.href;
 return (
 <Link
 key={link.href}
 href={link.href}
 onClick={() => setMobileMenuOpen(false)}
 className={cn(
"px-3 py-2.5 text-sm font-medium rounded-xl flex items-center gap-2 transition-colors",
 isActive
 ?"bg-primary text-white"
 :"bg-gestura-bg-secondary text-ink hover:bg-gestura-border/50"
 )}
 >
 {link.icon}
 {link.label}
 </Link>
 );
 })}
 </div>

 <div className="pt-2 border-t border-gestura-border flex items-center justify-between">
 <div className="text-xs font-medium text-ink-muted flex items-center gap-1.5">
 <span
 className={cn(
"w-2 h-2 rounded-full",
 health.status ==="healthy"?"bg-success":"bg-danger"
 )}
 />
 Backend: {health.status ==="healthy"?"Online": health.status}
 </div>
 <Link
 href="/translate"
 onClick={() => setMobileMenuOpen(false)}
 className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-full"
 >
 Start →
 </Link>
 </div>
 </div>
 )}
 </header>
 );
};
