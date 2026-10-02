"use client";

import React, { useState, useEffect, useRef, useCallback } from"react";
import Link from"next/link";
import {
 Card,
 CardHeader,
 CardTitle,
 CardDescription,
 CardContent,
 Button,
 Badge,
 Input,
 Select,
 ProgressBar,
 Alert,
 EmptyState,
} from"@/components/ui";
import {
 HandDetectionProvider,
 useHandDetection,
} from"@/context/HandDetectionContext";
import { evaluateHandQuality } from"@/lib/quality/handQuality";
import { CameraViewport } from"@/components/camera";
import {
 Layers,
 Database,
 Plus,
 Trash2,
 Download,
 Upload,
 Camera,
 Activity,
 Scan,
 Zap,
 Hand,
 CheckCircle2,
 AlertTriangle,
 Play,
 RotateCcw,
 Sparkles,
 ChevronDown,
 Clock,
 ShieldCheck,
} from"lucide-react";

interface SampleItem {
 id: string;
 label: string;
 hand:"left"|"right"|"unspecified";
 handedness_score: number;
 source: string;
 session_id: string;
 created_at: string;
}

interface DatasetStatsResponse {
 total_samples: number;
 class_counts: Record<string, number>;
 hand_counts: Record<string, number>;
 session_count: number;
 imbalance_ratio: number;
 has_imbalance: boolean;
 imbalance_warning?: string | null;
 low_sample_classes: string[];
}

const DEFAULT_LABELS = [
 { value:"A", label:"Sign A (Alphabet)"},
 { value:"B", label:"Sign B (Alphabet)"},
 { value:"C", label:"Sign C (Alphabet)"},
 { value:"HELLO", label:"Greeting HELLO"},
 { value:"THANK_YOU", label:"Phrase THANK YOU"},
 { value:"HELP", label:"Emergency HELP"},
];

const VARIATION_PROMPTS = [
"Hold posture steady in center",
"Tilt hand slightly left (~10°)",
"Tilt hand slightly right (~10°)",
"Move hand slightly closer",
"Move hand slightly farther back",
"Rotate wrist slightly clockwise",
"Rotate wrist slightly counter-clockwise",
"Adjust finger extension slightly",
];

function DatasetStudioContent() {
 const { camera, landmarker } = useHandDetection();
 const { latestResult, telemetry } = landmarker;

 // Active collection state
 const [selectedLabel, setSelectedLabel] = useState("A");
 const [customLabelInput, setCustomLabelInput] = useState("");
 const [isCreatingCustom, setIsCreatingCustom] = useState(false);
 const [targetSampleCount, setTargetSampleCount] = useState(50);
 const [preferredHand, setPreferredHand] = useState<"auto"|"left"|"right"|"unspecified">("auto");

 // Recording state
 const [isCapturing, setIsCapturing] = useState(false);
 const [burstActive, setBurstActive] = useState(false);
 const [burstRemaining, setBurstRemaining] = useState(0);
 const [burstTotal, setBurstTotal] = useState(15);
 const [burstVariationPrompt, setBurstVariationPrompt] = useState("");
 const [activeSessionId, setActiveSessionId] = useState(`sess_${Date.now().toString(36)}`);

 // Server state
 const [stats, setStats] = useState<DatasetStatsResponse>({
 total_samples: 0,
 class_counts: {},
 hand_counts: {},
 session_count: 0,
 imbalance_ratio: 1.0,
 has_imbalance: false,
 imbalance_warning: null,
 low_sample_classes: [],
 });
 const [recentSamples, setRecentSamples] = useState<SampleItem[]>([]);
 const [isLoadingStats, setIsLoadingStats] = useState(false);
 const [actionFeedback, setActionFeedback] = useState<{ message: string; type:"success"|"error"|"info"} | null>(null);

 // Hand quality evaluation
 const quality = evaluateHandQuality(
 latestResult?.landmarks?.[0],
 performance.now(),
 null,
 camera.videoRef?.current
 );
 const isQualityPass = quality.isValid;

 // Fetch dataset stats and recent samples
 const fetchStatsAndSamples = useCallback(async () => {
 try {
 setIsLoadingStats(true);
 const [statsRes, samplesRes] = await Promise.all([
 fetch("http://localhost:8000/api/dataset/stats"),
 fetch("http://localhost:8000/api/dataset/samples?limit=15"),
 ]);

 if (statsRes.ok) {
 const statsData = await statsRes.json();
 setStats(statsData);
 }
 if (samplesRes.ok) {
 const samplesData = await samplesRes.json();
 setRecentSamples(samplesData.samples || []);
 }
 } catch (err) {
 console.error("Failed to connect to backend dataset API:", err);
 } finally {
 setIsLoadingStats(false);
 }
 }, []);

 useEffect(() => {
 fetchStatsAndSamples();
 }, [fetchStatsAndSamples]);

 // Current active sign's count
 const activeClassCount = stats.class_counts[selectedLabel] || 0;
 const progressPercent = Math.min(100, Math.round((activeClassCount / targetSampleCount) * 100));

 // Determine if ready for capture
 const handDetected = latestResult && latestResult.landmarks.length > 0;
 const canCapture = camera.status ==="active"&& handDetected && isQualityPass && !isCapturing && !burstActive;

 // Single sample capture function
 const captureSingleSample = useCallback(async () => {
 if (!latestResult || latestResult.landmarks.length === 0) {
 setActionFeedback({ message:"No hand detected in viewport.", type:"error"});
 return;
 }

 const landmarks21 = latestResult.landmarks[0];
 const handMeta = latestResult.handedness[0] || { displayLabel:"Right", score: 0.95 };

 const detectedHand =
 preferredHand ==="auto"
 ? handMeta.displayLabel.toLowerCase() ==="left"
 ?"left"
 :"right"
 : preferredHand;

 const payload = {
 label: selectedLabel,
 hand: detectedHand,
 landmarks: landmarks21.map((pt) => ({ x: pt.x, y: pt.y, z: pt.z })),
 handedness_score: handMeta.score || 0.95,
 source:"collected",
 session_id: activeSessionId,
 };

 try {
 setIsCapturing(true);
 const res = await fetch("http://localhost:8000/api/dataset/samples", {
 method:"POST",
 headers: {"Content-Type":"application/json"},
 body: JSON.stringify(payload),
 });

 if (!res.ok) {
 const err = await res.json();
 throw new Error(err.detail ||"Capture failed");
 }

 setActionFeedback({ message: `Captured sample for Sign '${selectedLabel}'!`, type:"success"});
 fetchStatsAndSamples();
 } catch (err: any) {
 setActionFeedback({ message: err.message ||"Failed to record sample", type:"error"});
 } finally {
 setIsCapturing(false);
 }
 }, [latestResult, preferredHand, selectedLabel, activeSessionId, fetchStatsAndSamples]);

 // Burst capture handler
 const startBurstCapture = async () => {
 if (!canCapture) return;

 setBurstActive(true);
 setBurstRemaining(burstTotal);
 const newSessionId = `sess_${Date.now().toString(36)}`;
 setActiveSessionId(newSessionId);

 let captured = 0;
 const intervalMs = 280; // Sample every 280ms

 const burstTimer = setInterval(async () => {
 captured++;
 setBurstRemaining(burstTotal - captured);
 setBurstVariationPrompt(VARIATION_PROMPTS[captured % VARIATION_PROMPTS.length]);

 if (latestResult && latestResult.landmarks.length > 0) {
 const landmarks21 = latestResult.landmarks[0];
 const handMeta = latestResult.handedness[0] || { displayLabel:"Right", score: 0.95 };

 const detectedHand =
 preferredHand ==="auto"
 ? handMeta.displayLabel.toLowerCase() ==="left"
 ?"left"
 :"right"
 : preferredHand;

 const payload = {
 label: selectedLabel,
 hand: detectedHand,
 landmarks: landmarks21.map((pt) => ({ x: pt.x, y: pt.y, z: pt.z })),
 handedness_score: handMeta.score || 0.95,
 source:"collected",
 session_id: newSessionId,
 };

 try {
 await fetch("http://localhost:8000/api/dataset/samples", {
 method:"POST",
 headers: {"Content-Type":"application/json"},
 body: JSON.stringify(payload),
 });
 } catch (e) {
 console.warn("Burst frame skipped:", e);
 }
 }

 if (captured >= burstTotal) {
 clearInterval(burstTimer);
 setBurstActive(false);
 setBurstRemaining(0);
 setBurstVariationPrompt("");
 setActionFeedback({ message: `Burst collection completed (${burstTotal} samples)!`, type:"success"});
 fetchStatsAndSamples();
 }
 }, intervalMs);
 };

 // Keyboard shortcut: Spacebar captures single sample when focused
 useEffect(() => {
 const handleKeyDown = (e: KeyboardEvent) => {
 if (e.code ==="Space"&& e.target === document.body && canCapture) {
 e.preventDefault();
 captureSingleSample();
 }
 };
 window.addEventListener("keydown", handleKeyDown);
 return () => window.removeEventListener("keydown", handleKeyDown);
 }, [canCapture, captureSingleSample]);

 // Handle single sample deletion
 const handleDeleteSample = async (id: string) => {
 try {
 const res = await fetch(`http://localhost:8000/api/dataset/samples/${id}`, {
 method:"DELETE",
 });
 if (res.ok) {
 setActionFeedback({ message: `Sample deleted`, type:"info"});
 fetchStatsAndSamples();
 }
 } catch (e) {
 console.error(e);
 }
 };

 // Handle label deletion
 const handleDeleteLabel = async (labelToDelete: string) => {
 if (!confirm(`Delete all ${stats.class_counts[labelToDelete] || 0} samples for gesture '${labelToDelete}'?`)) {
 return;
 }
 try {
 const res = await fetch(`http://localhost:8000/api/dataset/labels/${labelToDelete}`, {
 method:"DELETE",
 });
 if (res.ok) {
 setActionFeedback({ message: `Deleted all samples for '${labelToDelete}'`, type:"info"});
 fetchStatsAndSamples();
 }
 } catch (e) {
 console.error(e);
 }
 };

 // Trigger export download
 const handleExport = (format:"json"|"csv") => {
 window.open(`http://localhost:8000/api/dataset/export?format=${format}`,"_blank");
 };

 return (
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-mono bg-gestura-bg">
 {/* Header */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-gestura-border pb-4">
 <div>
 <div className="flex items-center gap-2 mb-1">
 <Badge variant="primary"size="sm">
 PHASE 4 • DATASET STUDIO
 </Badge>
 <span className="text-xs font-bold text-ink-muted">
 ON-DEVICE VECTOR RECORDER
 </span>
 </div>
 <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-ink font-display">
 Kinematic Dataset Collection
 </h1>
 </div>

 {/* Action Export Buttons */}
 <div className="flex flex-wrap items-center gap-2">
 <Button
 variant="secondary"
 size="sm"
 onClick={() => handleExport("json")}
 disabled={stats.total_samples === 0}
 className="btn-kinetic"
 >
 <Download className="w-4 h-4 mr-1"/> EXPORT JSON
 </Button>
 <Button
 variant="secondary"
 size="sm"
 onClick={() => handleExport("csv")}
 disabled={stats.total_samples === 0}
 className="btn-kinetic"
 >
 <Download className="w-4 h-4 mr-1"/> EXPORT CSV
 </Button>
 </div>
 </div>

 {/* Action Notification Feedback */}
 {actionFeedback && (
 <Alert
 variant={actionFeedback.type ==="success"?"success": actionFeedback.type ==="error"?"danger":"info"}
 title={actionFeedback.type.toUpperCase()}
 className="animate-in fade-in duration-200"
 >
 <div className="flex justify-between items-center w-full">
 <span>{actionFeedback.message}</span>
 <button
 onClick={() => setActionFeedback(null)}
 className="text-xs font-bold underline uppercase ml-4"
 >
 Dismiss
 </button>
 </div>
 </Alert>
 )}

 {/* Class Imbalance / Quality Warning */}
 {stats.has_imbalance && stats.imbalance_warning && (
 <Alert variant="warning"title="DATASET IMBALANCE DETECTED">
 {stats.imbalance_warning}
 </Alert>
 )}

 {/* Main Grid */}
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
 {/* Left 7 Cols: Camera Viewport & Capture Console */}
 <div className="lg:col-span-7 space-y-6">
 <CameraViewport />

 {/* Interactive Capture Controls Card */}
 <Card variant="white"shadowSize="md"className="border-gestura-border p-6 space-y-6">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-gestura-border/15 pb-4">
 <div>
 <span className="text-xs font-bold text-ink-muted uppercase block">
 CAPTURE CONTROL PANEL
 </span>
 <h3 className="text-xl font-black uppercase text-ink font-display">
 SIGN &quot;{selectedLabel}&quot;
 </h3>
 </div>

 {/* Progress toward target */}
 <div className="text-right font-mono">
 <span className="text-xs font-bold text-ink-muted block uppercase">
 PROGRESS: {activeClassCount} / {targetSampleCount} SAMPLES
 </span>
 <div className="w-48 mt-1.5">
 <ProgressBar value={progressPercent} max={100} variant="primary"size="sm"/>
 </div>
 </div>
 </div>

 {/* Burst Mode Status Banner */}
 {burstActive && (
 <div className="p-4 bg-primary-light border-gestura-border flex items-center justify-between shadow-soft animate-pulse">
 <div className="flex items-center gap-3">
 <Sparkles className="w-5 h-5 text-primary animate-spin"/>
 <div>
 <span className="text-xs font-black uppercase text-primary block">
 BURST RECORDING ACTIVE: {burstRemaining} LEFT
 </span>
 <span className="text-xs font-bold text-ink">
 PROMPT: &ldquo;{burstVariationPrompt}&rdquo;
 </span>
 </div>
 </div>
 <Badge variant="primary"size="sm">
 {burstTotal - burstRemaining} / {burstTotal}
 </Badge>
 </div>
 )}

 {/* Capture Buttons */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <Button
 variant="primary"
 size="lg"
 onClick={captureSingleSample}
 disabled={!canCapture}
 isLoading={isCapturing}
 className="btn-kinetic w-full"
 >
 <Camera className="w-4 h-4 mr-2"/>
 CAPTURE 1 SAMPLE (SPACE)
 </Button>

 <Button
 variant="secondary"
 size="lg"
 onClick={startBurstCapture}
 disabled={!canCapture || burstActive}
 className="btn-kinetic w-full"
 >
 <Zap className="w-4 h-4 mr-2"/>
 BURST CAPTURE ({burstTotal} SAMPLES)
 </Button>
 </div>

 {/* Quality Gating Helper Note */}
 <div className="p-3 bg-gestura-bg-secondary border-gestura-border text-xs flex items-center justify-between">
 <div className="flex items-center gap-2">
 <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0"/>
 <span className="text-ink-muted">
 {canCapture
 ?"Hand detected with pass quality. Ready to record."
 : camera.status !=="active"
 ?"Start webcam above to enable vector recording."
 : !handDetected
 ?"Position hand in front of camera to record."
 :"Adjust hand according to quality banner above."}
 </span>
 </div>
 <Badge variant={canCapture ?"success":"neutral"} size="sm">
 {canCapture ?"READY":"LOCKED"}
 </Badge>
 </div>
 </Card>

 {/* Stored Samples Manifest Table */}
 <Card variant="white"shadowSize="md"className="border-gestura-border p-6 space-y-4">
 <div className="flex items-center justify-between border-gestura-border/15 pb-3">
 <div className="flex items-center gap-2">
 <Database className="w-4 h-4 text-primary"/>
 <h4 className="text-base font-black uppercase text-ink font-display">
 RECENT RECORDED VECTORS ({recentSamples.length})
 </h4>
 </div>
 <Button variant="secondary"size="sm"onClick={fetchStatsAndSamples} className="text-xs">
 <RotateCcw className="w-3.5 h-3.5 mr-1"/> Refresh
 </Button>
 </div>

 {recentSamples.length === 0 ? (
 <EmptyState
 icon={<Layers className="w-8 h-8 text-primary"/>}
 title="Zero Samples Recorded"
 description="Use the capture buttons above to record your first 21-point gesture vectors."
 statusBadge="Empty Dataset"
 className="bg-gestura-bg-secondary border-gestura-border shadow-soft"
 />
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-xs font-mono border-collapse">
 <thead>
 <tr className="bg-gestura-bg-secondary border-gestura-border text-left">
 <th className="p-2 font-bold uppercase">ID</th>
 <th className="p-2 font-bold uppercase">Class</th>
 <th className="p-2 font-bold uppercase">Hand</th>
 <th className="p-2 font-bold uppercase">Score</th>
 <th className="p-2 font-bold uppercase">Session</th>
 <th className="p-2 font-bold uppercase text-right">Action</th>
 </tr>
 </thead>
 <tbody>
 {recentSamples.map((s) => (
 <tr key={s.id} className="border-b border-gestura-border/15 hover:bg-primary-light/40">
 <td className="p-2 font-bold text-ink-muted">{s.id.slice(0, 10)}...</td>
 <td className="p-2 font-black text-primary">{s.label}</td>
 <td className="p-2 uppercase">{s.hand}</td>
 <td className="p-2">{Math.round(s.handedness_score * 100)}%</td>
 <td className="p-2 text-ink-muted">{s.session_id.slice(0, 8)}</td>
 <td className="p-2 text-right">
 <button
 onClick={() => handleDeleteSample(s.id)}
 className="p-1 hover:bg-danger hover:text-white border border-transparent hover:border-gestura-border transition-colors"
 title="Delete vector sample"
 >
 <Trash2 className="w-3.5 h-3.5"/>
 </button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </Card>
 </div>

 {/* Right 5 Cols: Gesture Class Config & Dataset Telemetry */}
 <div className="lg:col-span-5 space-y-6">
 {/* Target Gesture Configuration Card */}
 <Card variant="white"shadowSize="md"className="border-gestura-border p-6 space-y-5">
 <CardHeader className="p-0 border-gestura-border/15 pb-3">
 <CardTitle className="text-lg font-display">TARGET GESTURE CLASS</CardTitle>
 <CardDescription className="font-sans">
 Set label and target parameters for recording
 </CardDescription>
 </CardHeader>

 <CardContent className="p-0 space-y-4 font-mono">
 {!isCreatingCustom ? (
 <div className="space-y-3">
 <Select
 label="SELECT EXISTING GESTURE"
 options={[
 ...DEFAULT_LABELS,
 ...Object.keys(stats.class_counts)
 .filter((k) => !DEFAULT_LABELS.some((d) => d.value === k))
 .map((k) => ({ value: k, label: `Custom: ${k}` })),
 ]}
 value={selectedLabel}
 onChange={(e) => setSelectedLabel(e.target.value)}
 />

 <Button
 variant="secondary"
 size="sm"
 isFullWidth
 onClick={() => setIsCreatingCustom(true)}
 className="btn-kinetic text-xs"
 >
 <Plus className="w-3.5 h-3.5 mr-1"/> + Create New Custom Class
 </Button>
 </div>
 ) : (
 <div className="p-3 bg-gestura-bg-secondary border-gestura-border space-y-3 shadow-soft">
 <Input
 label="NEW GESTURE LABEL"
 placeholder="e.g. PEACE, THUMBS_UP, Z"
 value={customLabelInput}
 onChange={(e) => setCustomLabelInput(e.target.value)}
 />
 <div className="flex gap-2">
 <Button
 variant="primary"
 size="sm"
 onClick={() => {
 if (customLabelInput.trim()) {
 const clean = customLabelInput.trim().toUpperCase().replace(/\s+/g,"_");
 setSelectedLabel(clean);
 setIsCreatingCustom(false);
 setCustomLabelInput("");
 }
 }}
 className="btn-kinetic flex-1"
 >
 Set Active
 </Button>
 <Button
 variant="secondary"
 size="sm"
 onClick={() => setIsCreatingCustom(false)}
 className="btn-kinetic"
 >
 Cancel
 </Button>
 </div>
 </div>
 )}

 {/* Handedness Preference */}
 <Select
 label="HANDEDNESS MODE"
 options={[
 { value:"auto", label:"Auto-detect from Camera"},
 { value:"right", label:"Force Right Hand"},
 { value:"left", label:"Force Left Hand"},
 { value:"unspecified", label:"Unspecified"},
 ]}
 value={preferredHand}
 onChange={(e) => setPreferredHand(e.target.value as any)}
 />

 {/* Target Sample Target */}
 <div className="p-3 bg-gestura-bg-secondary border-gestura-border space-y-2 text-xs">
 <div className="flex justify-between font-bold">
 <span className="text-ink-muted">TARGET GOAL:</span>
 <span className="text-ink font-black">{targetSampleCount} samples</span>
 </div>
 <div className="flex gap-2">
 {[25, 50, 100, 200].map((count) => (
 <button
 key={count}
 onClick={() => setTargetSampleCount(count)}
 className={`flex-1 py-1 text-[11px] font-bold ${
 targetSampleCount === count
 ?"bg-primary text-white border-gestura-border shadow-soft"
 :"bg-surface text-ink border-gestura-border hover:bg-white"
 }`}
 >
 {count}
 </button>
 ))}
 </div>
 </div>
 </CardContent>
 </Card>

 {/* Dataset Statistics Card */}
 <Card variant="white"shadowSize="md"className="border-gestura-border p-6 space-y-4">
 <div className="flex items-center justify-between border-gestura-border/15 pb-3">
 <CardTitle className="text-lg font-display">DATASET TELEMETRY</CardTitle>
 <Badge variant="primary"size="sm">
 {stats.total_samples} TOTAL
 </Badge>
 </div>

 <div className="grid grid-cols-2 gap-3 text-xs font-mono">
 <div className="p-3 bg-gestura-bg-secondary border-gestura-border shadow-soft">
 <span className="text-[10px] text-ink-muted uppercase block font-bold">CLASSES</span>
 <span className="text-lg font-black text-ink">
 {Object.keys(stats.class_counts).length} classes
 </span>
 </div>
 <div className="p-3 bg-gestura-bg-secondary border-gestura-border shadow-soft">
 <span className="text-[10px] text-ink-muted uppercase block font-bold">SESSIONS</span>
 <span className="text-lg font-black text-primary">
 {stats.session_count} bursts
 </span>
 </div>
 </div>

 {/* Per-Class Distribution List */}
 <div className="space-y-2 pt-2">
 <span className="text-xs font-bold uppercase text-ink-muted block font-mono">
 CLASS DISTRIBUTION & SAMPLES
 </span>

 {Object.keys(stats.class_counts).length === 0 ? (
 <p className="text-xs text-ink-muted italic font-sans">No gesture classes recorded yet.</p>
 ) : (
 <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 font-mono text-xs">
 {Object.entries(stats.class_counts).map(([lbl, cnt]) => (
 <div
 key={lbl}
 className={`p-2 border-gestura-border flex items-center justify-between ${
 lbl === selectedLabel ?"bg-primary-light font-black":"bg-surface"
 }`}
 >
 <div className="flex items-center gap-2">
 <span className="w-2 h-2 rounded-full bg-primary"/>
 <span>{lbl}</span>
 </div>
 <div className="flex items-center gap-3">
 <span className="font-bold text-ink">{cnt} pts</span>
 <button
 onClick={() => handleDeleteLabel(lbl)}
 className="text-ink-muted hover:text-danger p-0.5"
 title={`Delete all ${lbl} samples`}
 >
 <Trash2 className="w-3.5 h-3.5"/>
 </button>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>

 {/* Handedness Distribution */}
 <div className="pt-3 border-gestura-border/15 flex justify-between text-xs font-mono">
 <span className="text-ink-muted font-bold">HAND RATIO:</span>
 <span className="font-bold text-ink">
 Right: {stats.hand_counts.right || 0} • Left: {stats.hand_counts.left || 0}
 </span>
 </div>
 </Card>
 </div>
 </div>
 </div>
 );
}

export default function DatasetPage() {
 return (
 <HandDetectionProvider>
 <DatasetStudioContent />
 </HandDetectionProvider>
 );
}
