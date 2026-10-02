"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  Alert,
} from "@/components/ui";
import {
  HandDetectionProvider,
  useHandDetection,
} from "@/context/HandDetectionContext";
import { CameraViewport, DeveloperOverlay } from "@/components/camera";
import {
  Volume2,
  Settings,
  Hand,
  Trash2,
  Undo2,
  Copy,
  MessageSquarePlus,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGestureInference } from "@/lib/inference/useGestureInference";
import { formatSentence, QUICK_PHRASES, GESTURE_TO_WORD_MAP } from "@/lib/translation/sentenceBuilder";

import { useSpeechSynthesis } from "@/lib/tts/useSpeechSynthesis";
import { useSequenceInference } from "@/lib/inference/useSequenceInference";

type TranslationMode = "fingerspelling" | "words";

function TranslateStudioContent() {
  const [translationMode, setTranslationMode] = useState<TranslationMode>("fingerspelling");

  const { camera, landmarker } = useHandDetection();
  const { telemetry, latestResult } = landmarker;

  const staticInference = useGestureInference(latestResult, camera.status === "active" && translationMode === "fingerspelling");
  const sequenceInference = useSequenceInference(latestResult, camera.status === "active" && translationMode === "words");
  
  // Hacky stub: normally we would abstract this so both hooks return identical interfaces
  const inference = translationMode === "fingerspelling" 
    ? staticInference 
    : {
        isModelLoading: sequenceInference.isModelLoading,
        stabilizedLabel: sequenceInference.signState === "Result" ? (sequenceInference.predictions[0]?.label || "—") : "—",
        stabilizedConfidence: sequenceInference.predictions[0]?.confidence || 0,
        modelError: sequenceInference.modelError,
        rawPredictions: sequenceInference.predictions
      };
  const tts = useSpeechSynthesis();

  // Sentence Builder State
  const [buffer, setBuffer] = useState<string[]>([]);
  const [lastCommittedGesture, setLastCommittedGesture] = useState<string | null>(null);
  const [holdFrames, setHoldFrames] = useState(0);
  const [formattedText, setFormattedText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [manualText, setManualText] = useState("");
  const [autoSpeak, setAutoSpeak] = useState(false);

  const HOLD_THRESHOLD = 15; // Roughly 500ms at 30fps

  // Process gesture commitment
  useEffect(() => {
    if (!latestResult) return; // Wait for frames

    const label = inference.stabilizedLabel;
    
    if (label === "NO HAND" || label === "UNKNOWN" || label === "—") {
      setHoldFrames(0);
      if (label === "NO HAND") {
        setLastCommittedGesture(null);
      }
      return;
    }

    if (label === lastCommittedGesture) {
      setHoldFrames(0);
      return;
    }

    setHoldFrames((prev) => {
      const next = prev + 1;
      if (next >= HOLD_THRESHOLD) {
        // Commit gesture! Map to word if exists, else lowercase label
        const mappedWord = GESTURE_TO_WORD_MAP[label] || label.toLowerCase();
        setBuffer((b) => {
           const newBuffer = [...b, mappedWord];
           
           // Auto-speak if enabled and we hit a word that might finish a sentence
           if (autoSpeak) {
              const textToSpeak = formatSentence(newBuffer);
              if (textToSpeak.endsWith(".") || textToSpeak.endsWith("?")) {
                 tts.speak(textToSpeak);
              }
           }
           
           return newBuffer;
        });
        setLastCommittedGesture(label);
        return 0;
      }
      return next;
    });
  }, [inference.stabilizedLabel, latestResult, autoSpeak, tts]);

  // Update formatted text whenever buffer changes
  useEffect(() => {
    setFormattedText(formatSentence(buffer));
    setManualText(formatSentence(buffer));
  }, [buffer]);

  const handleClear = () => {
    setBuffer([]);
    setLastCommittedGesture(null);
    setHoldFrames(0);
    tts.stop();
  };

  const handleUndo = () => {
    setBuffer((b) => b.slice(0, -1));
    setLastCommittedGesture(null);
    setHoldFrames(0);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(isEditing ? manualText : formattedText);
  };

  const handleSpeakToggle = () => {
    if (tts.isSpeaking) {
      tts.stop();
    } else {
      const textToSpeak = isEditing ? manualText : formattedText;
      if (textToSpeak) tts.speak(textToSpeak);
    }
  };

  const removeChip = (index: number) => {
    setBuffer((b) => b.filter((_, i) => i !== index));
  };

  const insertQuickPhrase = (phrase: string) => {
    setBuffer((b) => {
       const newBuffer = [...b, phrase];
       if (autoSpeak) tts.speak(formatSentence(newBuffer));
       return newBuffer;
    });
  };

  const holdProgressPercent = Math.min((holdFrames / HOLD_THRESHOLD) * 100, 100);

  return (
    <>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-gestura-border pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="primary" size="sm">
              LIVE TRANSLATION STUDIO
            </Badge>
            <span className="text-xs font-mono font-bold text-ink-muted">
              PHASE 8 (TTS)
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-ink font-display">
            Real-Time Sign Translator
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/settings">
            <Button variant="secondary" size="sm">
              <Settings className="w-4 h-4 mr-1" />
              Settings
            </Button>
          </Link>
          <Link href="/gestures">
            <Button variant="primary" size="sm">
              Gesture Library →
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Live Camera Viewport */}
        <div className="lg:col-span-7 space-y-6">
          <CameraViewport />

          {/* Quick Phrases Panel */}
          <Card variant="white" shadowSize="md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquarePlus className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">QUICK PHRASES</CardTitle>
                </div>
              </div>
              <CardDescription>Click to instantly inject into sentence</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {QUICK_PHRASES.map((phrase, i) => (
                  <button
                    key={i}
                    onClick={() => insertQuickPhrase(phrase)}
                    className="px-3 py-1.5 bg-gestura-bg-secondary hover:bg-primary-light text-ink hover:text-primary rounded-full text-sm font-semibold transition-colors duration-200"
                  >
                    {phrase}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Sentence Builder */}
        <div className="lg:col-span-5 space-y-6">
          <Card variant="white" shadowSize="md" className="flex flex-col h-full min-h-[500px]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">SENTENCE BUILDER</CardTitle>
                <Badge variant={inference.isModelLoading ? "warning" : inference.modelError ? "danger" : "primary"} size="sm">
                  {inference.isModelLoading ? "LOADING MODEL..." : inference.modelError ? "MODEL ERROR" : "ACTIVE"}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 flex-1 flex flex-col">
              {/* Active Gesture Lock-in */}
              <div className="p-4 bg-gestura-bg-secondary border-gestura-border shadow-soft rounded-2xl relative overflow-hidden">
                {/* Progress Bar Background */}
                <div 
                  className="absolute bottom-0 left-0 h-1 bg-primary transition-all duration-75 ease-linear"
                  style={{ width: `${holdProgressPercent}%` }}
                />
                
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <span className="text-xs font-mono font-bold uppercase text-ink-muted block">
                      STABILIZED GESTURE
                    </span>
                    <span className={cn("text-3xl font-black", (inference.stabilizedLabel === "UNKNOWN" || inference.stabilizedLabel === "NO HAND" || inference.stabilizedLabel === "—") ? "text-ink-muted" : "text-primary")}>
                      {inference.modelError ? "N/A" : inference.stabilizedLabel}
                    </span>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-xs font-bold uppercase text-ink-muted block">
                      MODEL SCORE
                    </span>
                    <span className="text-sm font-black text-primary">
                      {inference.modelError ? "0.0%" : `${(inference.stabilizedConfidence * 100).toFixed(1)}%`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Word Chips */}
              <div className="flex-1 bg-primary-light/20 border border-gestura-border rounded-2xl p-4 flex flex-col">
                <div className="flex items-center justify-between mb-3 border-b border-gestura-border pb-2">
                  <span className="text-xs font-mono font-bold text-ink-muted uppercase">Word Buffer</span>
                  <div className="flex gap-2">
                    <button onClick={handleUndo} disabled={buffer.length === 0} className="p-1 text-ink-muted hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed" title="Undo Last">
                      <Undo2 className="w-4 h-4" />
                    </button>
                    <button onClick={handleClear} disabled={buffer.length === 0} className="p-1 text-ink-muted hover:text-danger disabled:opacity-30 disabled:cursor-not-allowed" title="Clear All">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4 max-h-[120px] overflow-y-auto" aria-live="polite">
                  {buffer.length === 0 ? (
                    <span className="text-sm text-ink-muted italic">Hold a gesture to add words...</span>
                  ) : (
                    buffer.map((word, idx) => (
                      <span key={idx} className="group inline-flex items-center gap-1 bg-white border border-gestura-border text-ink px-2.5 py-1 rounded-full text-sm font-semibold shadow-sm animate-fade-in-up">
                        {word}
                        <button onClick={() => removeChip(idx)} className="opacity-0 group-hover:opacity-100 text-ink-muted hover:text-danger transition-opacity" aria-label={`Remove ${word}`}>
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Final Formatted Output */}
                <div className="mt-auto pt-4 border-t border-gestura-border relative">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-mono font-bold text-ink-muted uppercase flex items-center gap-2">
                      Formatted Output
                      {tts.isSpeaking && <span className="w-2 h-2 rounded-full bg-primary animate-pulse" title="Speaking..." />}
                    </span>
                    <button onClick={() => setIsEditing(!isEditing)} className="text-xs font-bold text-primary hover:underline">
                      {isEditing ? "Done" : "Edit"}
                    </button>
                  </div>
                  
                  {isEditing ? (
                    <textarea 
                      value={manualText}
                      onChange={(e) => setManualText(e.target.value)}
                      className="w-full bg-white border border-gestura-border rounded-xl p-3 text-lg font-medium text-ink focus:ring-2 focus:ring-primary/50 outline-none resize-none"
                      rows={3}
                      aria-label="Manually edit sentence"
                    />
                  ) : (
                    <div className="w-full bg-white border border-gestura-border rounded-xl p-3 text-lg font-medium text-ink min-h-[80px]" aria-live="polite">
                      {formattedText || <span className="text-ink-muted italic">Awaiting input...</span>}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 mt-4">
                <div className="flex items-center gap-2 text-sm text-ink-muted flex-1">
                  <input 
                    type="checkbox" 
                    id="autoSpeak"
                    checked={autoSpeak}
                    onChange={(e) => setAutoSpeak(e.target.checked)}
                    className="rounded border-gestura-border text-primary focus:ring-primary/50"
                  />
                  <label htmlFor="autoSpeak" className="cursor-pointer select-none">Auto-Speak</label>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="neutral" onClick={handleCopy} disabled={buffer.length === 0} aria-label="Copy text">
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant={tts.isSpeaking ? "danger" : "primary"} 
                    onClick={handleSpeakToggle}
                    disabled={!tts.supported || (buffer.length === 0 && !isEditing) || (isEditing && !manualText)}
                    aria-label={tts.isSpeaking ? "Stop speaking" : "Speak sentence aloud"}
                    title={!tts.supported ? "Text-to-speech not supported in this browser" : ""}
                  >
                    <Volume2 className="w-4 h-4 mr-2" /> 
                    {tts.isSpeaking ? "STOP" : "SPEAK"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    <DeveloperOverlay />
    </>
  );
}

export default function TranslatePage() {
  return (
    <HandDetectionProvider>
      <TranslateStudioContent />
    </HandDetectionProvider>
  );
}
