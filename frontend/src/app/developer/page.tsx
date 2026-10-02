"use client";

import React, { useState } from"react";
import {
 Card,
 CardHeader,
 CardTitle,
 CardDescription,
 CardContent,
 Button,
 Badge,
 Alert,
 Input,
} from"@/components/ui";
import {
 Terminal,
 Play,
 Activity,
 CheckCircle2,
 RefreshCw,
 Code2,
 Cpu,
 Scan,
 Zap,
} from"lucide-react";
import { useBackendStatus } from"@/lib/useBackendStatus";

export default function DeveloperPage() {
 const { health, refetch } = useBackendStatus();
 const [testEndpoint, setTestEndpoint] = useState("/health");
 const [responseJson, setResponseJson] = useState<string | null>(null);
 const [isLoading, setIsLoading] = useState(false);

 const runApiTest = async () => {
 setIsLoading(true);
 const backendUrl =
 process.env.NEXT_PUBLIC_BACKEND_URL ||"http://127.0.0.1:8000";
 try {
 const res = await fetch(`${backendUrl}${testEndpoint}`);
 const data = await res.json();
 setResponseJson(JSON.stringify(data, null, 2));
 } catch (err: any) {
 setResponseJson(
 JSON.stringify({ error: err.message ||"Failed to fetch"}, null, 2)
 );
 } finally {
 setIsLoading(false);
 }
 };

 return (
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-mono">
 {/* Page Header */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
 <div>
 <div className="flex items-center gap-2 mb-1">
 <Badge variant="primary"size="sm">
 DEV SANDBOX
 </Badge>
 <span className="text-xs font-bold text-ink-muted">
 DIAGNOSTICS & TELEMETRY
 </span>
 </div>
 <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black font-display">
 Kinematic AI Diagnostics & Telemetry
 </h1>
 </div>

 <div className="flex items-center gap-2">
 <Button variant="secondary"size="sm"onClick={refetch}>
 <RefreshCw className="w-4 h-4 mr-1"/> Ping Backend
 </Button>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
 {/* Left: API Tester & Sandbox */}
 <div className="lg:col-span-7 space-y-6">
 <Card variant="white"shadowSize="lg">
 <CardHeader>
 <div className="flex items-center gap-2">
 <Terminal className="w-5 h-5 text-primary"/>
 <CardTitle className="text-lg font-display">FASTAPI ENDPOINT TESTER</CardTitle>
 </div>
 <CardDescription className="font-sans">
 Direct HTTP query client to test local FastAPI backend endpoints
 </CardDescription>
 </CardHeader>

 <CardContent className="space-y-4">
 <div className="flex gap-2">
 <div className="flex-1">
 <Input
 label="ENDPOINT PATH"
 value={testEndpoint}
 onChange={(e) => setTestEndpoint(e.target.value)}
 placeholder="/health"
 />
 </div>
 <div className="pt-6">
 <Button
 variant="primary"
 onClick={runApiTest}
 isLoading={isLoading}
 >
 <Play className="w-4 h-4 mr-1"/> GET
 </Button>
 </div>
 </div>

 <div className="space-y-1.5">
 <span className="text-xs font-bold uppercase text-black">
 RESPONSE JSON:
 </span>
 <pre className="p-4 bg-surface-dark text-emerald-400 font-mono text-xs overflow-x-auto min-h-[160px] shadow-soft">
 {responseJson ||
"// Click GET above to test FastAPI endpoint response"}
 </pre>
 </div>
 </CardContent>
 </Card>
 </div>

 {/* Right: Telemetry & Environment Specs */}
 <div className="lg:col-span-5 space-y-6">
 <Card variant="cream"shadowSize="md">
 <CardHeader>
 <CardTitle className="text-lg font-display">ENVIRONMENT TELEMETRY</CardTitle>
 <CardDescription className="font-sans">Active runtime environment & vision specs</CardDescription>
 </CardHeader>

 <CardContent className="space-y-3 text-xs">
 <div className="p-2.5 bg-white flex justify-between">
 <span className="text-ink-muted">BACKEND STATUS:</span>
 <span
 className={
 health.status ==="healthy"
 ?"text-emerald-700 font-bold"
 :"text-red-600 font-bold"
 }
 >
 {health.status.toUpperCase()}
 </span>
 </div>
 <div className="p-2.5 bg-white flex justify-between">
 <span className="text-ink-muted">FASTAPI VERSION:</span>
 <span className="font-bold">{health.version ||"0.1.0"}</span>
 </div>
 <div className="p-2.5 bg-white flex justify-between">
 <span className="text-ink-muted">NEXT.JS RUNTIME:</span>
 <span className="font-bold">App Router (v14.2)</span>
 </div>
 <div className="p-2.5 bg-white flex justify-between">
 <span className="text-ink-muted">CLIENT MEDIAPIPE:</span>
 <span className="font-bold">@mediapipe/tasks-vision</span>
 </div>
 <div className="p-2.5 bg-white flex justify-between">
 <span className="text-ink-muted">INFERENCE ENGINE:</span>
 <span className="font-bold">onnxruntime-web (WASM)</span>
 </div>
 <div className="p-2.5 bg-white flex justify-between">
 <span className="text-ink-muted">FEATURE VECTOR:</span>
 <span className="font-bold text-primary">82D Kinematic Vector</span>
 </div>
 </CardContent>
 </Card>
 </div>
 </div>
 </div>
 );
}
