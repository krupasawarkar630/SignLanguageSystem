"use client";

import React, { useState } from"react";
import {
 Card,
 CardHeader,
 CardTitle,
 CardDescription,
 CardContent,
 CardFooter,
 Button,
 Badge,
 Toggle,
 Input,
 Select,
 Alert,
} from"@/components/ui";
import {
 Settings as SettingsIcon,
 Volume2,
 Hand,
 Sliders,
 CheckCircle2,
 Activity,
 Zap,
 Scan,
} from"lucide-react";
import { useBackendStatus } from"@/lib/useBackendStatus";

export default function SettingsPage() {
 const [speechEnabled, setSpeechEnabled] = useState(true);
 const [autoSpeak, setAutoSpeak] = useState(false);
 const [primaryHand, setPrimaryHand] = useState("Right");
 const [confidenceThreshold, setConfidenceThreshold] = useState("85");
 const [holdDuration, setHoldDuration] = useState("800");
 const [backendUrl, setBackendUrl] = useState("http://127.0.0.1:8000");
 const { health, refetch } = useBackendStatus();

 return (
 <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-mono">
 {/* Page Header */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
 <div>
 <div className="flex items-center gap-2 mb-1">
 <Badge variant="primary"size="sm">
 CONFIGURATION
 </Badge>
 <span className="text-xs font-bold text-ink-muted">
 SYSTEM & VISION PARAMETERS
 </span>
 </div>
 <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black font-display">
 System & Kinematics Settings
 </h1>
 </div>
 </div>

 {/* Backend API Connection Card */}
 <Card variant="cream"shadowSize="md">
 <CardHeader>
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <Activity className="w-5 h-5 text-primary"/>
 <CardTitle className="text-lg font-display">FASTAPI BACKEND TELEMETRY</CardTitle>
 </div>
 <Badge
 variant={health.status ==="healthy"?"secondary":"danger"}
 size="sm"
 >
 {health.status ==="healthy"?"CONNECTED": health.status.toUpperCase()}
 </Badge>
 </div>
 <CardDescription className="font-sans">
 Target host for vector dataset persistence, local training triggers, and ML services
 </CardDescription>
 </CardHeader>

 <CardContent className="space-y-4">
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
 <div className="md:col-span-2">
 <Input
 label="FASTAPI BACKEND URL"
 value={backendUrl}
 onChange={(e) => setBackendUrl(e.target.value)}
 helperText="Default: http://127.0.0.1:8000"
 />
 </div>
 <Button variant="primary"onClick={refetch}>
 TEST CONNECTION
 </Button>
 </div>

 <div className="p-3 bg-white text-xs space-y-1">
 <div className="flex justify-between">
 <span className="text-ink-muted">SERVICE:</span>
 <span className="font-bold">{health.service ||"N/A"}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-ink-muted">VERSION:</span>
 <span className="font-bold">{health.version ||"N/A"}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-ink-muted">UPTIME:</span>
 <span className="font-bold">{health.uptimeSeconds ? `${health.uptimeSeconds}s` :"N/A"}</span>
 </div>
 </div>
 </CardContent>
 </Card>

 {/* Recognition Settings Card */}
 <Card variant="white"shadowSize="md">
 <CardHeader>
 <div className="flex items-center gap-2">
 <Scan className="w-5 h-5 text-primary"/>
 <CardTitle className="text-lg font-display">KINEMATICS & SENSITIVITY</CardTitle>
 </div>
 <CardDescription className="font-sans">
 Configure dominant hand mirroring, confidence thresholds, and temporal hold debounce
 </CardDescription>
 </CardHeader>

 <CardContent className="space-y-6">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <Select
 label="DOMINANT HAND"
 options={[
 { value:"Right", label:"Right Hand (Default)"},
 { value:"Left", label:"Left Hand (Auto-Mirrored)"},
 { value:"Both", label:"Dual Hand Support"},
 ]}
 value={primaryHand}
 onChange={(e) => setPrimaryHand(e.target.value)}
 helperText="Left hand poses are automatically mirrored to canonical right representation"
 />

 <Input
 label="CONFIDENCE THRESHOLD (%)"
 type="number"
 min="50"
 max="99"
 value={confidenceThreshold}
 onChange={(e) => setConfidenceThreshold(e.target.value)}
 helperText="Minimum probability required to accept a sign (e.g. 85%)"
 />
 </div>

 <Input
 label="HOLD DURATION (MILLISECONDS)"
 type="number"
 min="300"
 max="2500"
 step="100"
 value={holdDuration}
 onChange={(e) => setHoldDuration(e.target.value)}
 helperText="How long a gesture must be held steadily before appending to sentence (e.g. 800ms)"
 />
 </CardContent>
 </Card>

 {/* Speech & Audio Card */}
 <Card variant="white"shadowSize="md">
 <CardHeader>
 <div className="flex items-center gap-2">
 <Volume2 className="w-5 h-5 text-secondary-dark"/>
 <CardTitle className="text-lg font-display">SPEECH SYNTHESIS (TTS)</CardTitle>
 </div>
 <CardDescription className="font-sans">
 Web Speech API configuration for synthesized vocal audio
 </CardDescription>
 </CardHeader>

 <CardContent className="space-y-5 font-sans">
 <div className="flex items-center justify-between p-4 bg-[#F7F4ED]">
 <div>
 <span className="font-bold text-sm uppercase block font-display">Enable Speech Synthesizer</span>
 <span className="text-xs text-ink-muted">Allow browser to vocalize sentences via audio</span>
 </div>
 <Toggle checked={speechEnabled} onChange={setSpeechEnabled} />
 </div>

 <div className="flex items-center justify-between p-4 bg-[#F7F4ED]">
 <div>
 <span className="font-bold text-sm uppercase block font-display">Auto-Speak Completed Sentences</span>
 <span className="text-xs text-ink-muted">Automatically speak when pause or punctuation occurs</span>
 </div>
 <Toggle checked={autoSpeak} onChange={setAutoSpeak} />
 </div>
 </CardContent>

 <CardFooter className="justify-end">
 <Button variant="primary">SAVE PREFERENCES</Button>
 </CardFooter>
 </Card>
 </div>
 );
}
