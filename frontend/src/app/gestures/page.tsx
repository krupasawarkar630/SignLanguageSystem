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
 Tag,
 Tabs,
 Input,
 EmptyState,
} from"@/components/ui";
import {
 Hand,
 Search,
 BookOpen,
 Filter,
 Sparkles,
 ArrowRight,
 ShieldAlert,
 Scan,
 Compass,
 Zap,
} from"lucide-react";

export default function GesturesPage() {
 const [activeTab, setActiveTab] = useState("all");
 const [searchQuery, setSearchQuery] = useState("");

 const sampleGestures = [
 {
 id:"A",
 name:"Sign 'A'",
 category:"alphabet",
 difficulty:"Beginner",
 joints:"4 Flexed, 1 Extended",
 wristAngle:"12.4°",
 description:"Tight fist with thumb resting vertically beside index finger.",
 },
 {
 id:"B",
 name:"Sign 'B'",
 category:"alphabet",
 difficulty:"Beginner",
 joints:"4 Extended, 1 Folded",
 wristAngle:"4.8°",
 description:"Flat open palm facing outward with thumb folded across palm.",
 },
 {
 id:"C",
 name:"Sign 'C'",
 category:"alphabet",
 difficulty:"Beginner",
 joints:"5 Curved Inward",
 wristAngle:"0.0°",
 description:"Curved hand forming a distinct semicircular 'C' shape.",
 },
 {
 id:"HELLO",
 name:"Greeting 'HELLO'",
 category:"phrases",
 difficulty:"Beginner",
 joints:"Open Palm Sweep",
 wristAngle:"18.2°",
 description:"Open flat hand from forehead outward in polite salute.",
 },
 {
 id:"YES",
 name:"Affirmation 'YES'",
 category:"phrases",
 difficulty:"Beginner",
 joints:"S-Fist Pitch Angle",
 wristAngle:"24.0°",
 description:"Closed fist nodding up and down like a head nodding in agreement.",
 },
 {
 id:"HELP",
 name:"Emergency 'HELP'",
 category:"emergency",
 difficulty:"Intermediate",
 joints:"Dual-Plane Support",
 wristAngle:"0.0°",
 description:"Flat non-dominant palm supporting thumbs-up dominant fist.",
 },
 {
 id:"WATER",
 name:"Essential 'WATER'",
 category:"essential",
 difficulty:"Intermediate",
 joints:"W-Handshape Tap",
 wristAngle:"15.0°",
 description:"3 upright fingers forming 'W' handshape lightly tapping chin.",
 },
 {
 id:"1",
 name:"Number '1'",
 category:"numbers",
 difficulty:"Beginner",
 joints:"1 Extended, 4 Flexed",
 wristAngle:"6.5°",
 description:"Index finger upright pointing vertically with others curled into fist.",
 },
 {
 id:"5",
 name:"Number '5'",
 category:"numbers",
 difficulty:"Beginner",
 joints:"5 Full Splay",
 wristAngle:"0.0°",
 description:"All five fingers completely splayed open facing camera.",
 },
 ];

 const filteredGestures = sampleGestures.filter((g) => {
 const matchesTab = activeTab ==="all"|| g.category === activeTab;
 const matchesSearch =
 g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
 g.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
 g.id.toLowerCase().includes(searchQuery.toLowerCase());
 return matchesTab && matchesSearch;
 });

 return (
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-mono">
 {/* Page Header */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
 <div>
 <div className="flex items-center gap-2 mb-1">
 <Badge variant="primary"size="sm">
 KINEMATIC REPOSITORY
 </Badge>
 <span className="text-xs font-bold text-ink-muted">
 STATIC GESTURE VOCABULARY
 </span>
 </div>
 <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black font-display">
 Kinematic Gesture Library
 </h1>
 </div>

 <div className="flex items-center gap-3">
 <Link href="/learn">
 <Button variant="lime"size="sm">
 <Zap className="w-4 h-4 mr-1 fill-black"/> Practice Gestures
 </Button>
 </Link>
 </div>
 </div>

 {/* Filter and Search Bar */}
 <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
 <Tabs
 items={[
 { id:"all", label:"All Signs", badge: sampleGestures.length },
 { id:"alphabet", label:"Alphabet"},
 { id:"numbers", label:"Numbers"},
 { id:"phrases", label:"Phrases"},
 { id:"emergency", label:"Emergency"},
 ]}
 activeId={activeTab}
 onChange={setActiveTab}
 />

 <div className="w-full md:w-72">
 <Input
 placeholder="Search signs by name or key..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 leftIcon={<Search className="w-4 h-4"/>}
 />
 </div>
 </div>

 {/* Gesture Cards Grid */}
 {filteredGestures.length > 0 ? (
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
 {filteredGestures.map((gesture) => (
 <Card
 key={gesture.id}
 variant="white"
 shadowSize="md"
 interactive
 className="flex flex-col justify-between"
 >
 <div className="space-y-3">
 <div className="flex items-center justify-between">
 <span className="px-2.5 py-0.5 bg-black text-white font-mono text-xs font-bold uppercase">
 ID: {gesture.id}
 </span>
 <Badge
 variant={
 gesture.category ==="emergency"
 ?"danger"
 : gesture.category ==="alphabet"
 ?"primary"
 :"secondary"
 }
 size="sm"
 >
 {gesture.category}
 </Badge>
 </div>

 {/* 3D Wireframe Joint Skeleton Visual */}
 <div className="h-32 bg-surface-dark relative flex flex-col items-center justify-center p-3 text-white overflow-hidden">
 <div className="absolute inset-0 bg-[radial-gradient(#3B82F6_1px,transparent_1px)] [background-size:12px_12px] opacity-25"/>
 <div className="w-14 h-14 border border-secondary/60 flex items-center justify-center relative bg-primary/10">
 <Hand className="w-8 h-8 text-secondary"/>
 <span className="absolute -top-1 -right-1 w-2 h-2 bg-secondary"/>
 <span className="absolute -bottom-1 -left-1 w-2 h-2 bg-primary"/>
 </div>
 <div className="mt-2 text-[10px] text-white/80 font-bold uppercase flex items-center gap-2">
 <span>{gesture.joints}</span>
 <span>•</span>
 <span className="text-secondary">{gesture.wristAngle}</span>
 </div>
 </div>

 <CardTitle className="text-xl font-display">{gesture.name}</CardTitle>
 <CardDescription className="text-xs leading-relaxed text-ink font-sans">
 {gesture.description}
 </CardDescription>
 </div>

 <div className="pt-4 mt-4 /10 flex items-center justify-between">
 <Tag label={gesture.difficulty} variant="default"/>
 <Link href={`/learn?sign=${gesture.id}`}>
 <Button variant="ghost"size="sm">
 Train Pose →
 </Button>
 </Link>
 </div>
 </Card>
 ))}
 </div>
 ) : (
 <EmptyState
 icon={<Search className="w-8 h-8 text-primary"/>}
 title="No Matching Gestures"
 description={`No gestures found matching"${searchQuery}". Try selecting another category or clear your search.`}
 actionLabel="Clear Search"
 onAction={() => {
 setSearchQuery("");
 setActiveTab("all");
 }}
 />
 )}
 </div>
 );
}
