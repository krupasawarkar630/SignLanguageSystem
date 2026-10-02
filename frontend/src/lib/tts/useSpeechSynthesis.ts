"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface TTSOptions {
  voice?: SpeechSynthesisVoice | null;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export function useSpeechSynthesis() {
  const [supported, setSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Settings
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string | null>(null);
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);

  const synth = typeof window !== "undefined" ? window.speechSynthesis : null;

  const loadVoices = useCallback(() => {
    if (!synth) return;
    const availableVoices = synth.getVoices();
    setVoices(availableVoices);
    
    // Auto-select a default if not set, preferably a local English one
    if (availableVoices.length > 0 && !selectedVoiceURI) {
      const defaultVoice = availableVoices.find(v => v.lang.startsWith("en") && v.localService) || availableVoices[0];
      setSelectedVoiceURI(defaultVoice.voiceURI);
    }
  }, [synth, selectedVoiceURI]);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setSupported(true);
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    // Load persisted settings
    const savedVoice = localStorage.getItem("gestura_tts_voice");
    const savedRate = localStorage.getItem("gestura_tts_rate");
    const savedPitch = localStorage.getItem("gestura_tts_pitch");
    
    if (savedVoice) setSelectedVoiceURI(savedVoice);
    if (savedRate) setRate(parseFloat(savedRate));
    if (savedPitch) setPitch(parseFloat(savedPitch));

    return () => {
      if (synth) synth.onvoiceschanged = null;
    };
  }, [loadVoices, synth]);

  // Persist settings changes
  useEffect(() => {
    if (selectedVoiceURI) localStorage.setItem("gestura_tts_voice", selectedVoiceURI);
  }, [selectedVoiceURI]);
  
  useEffect(() => {
    localStorage.setItem("gestura_tts_rate", rate.toString());
  }, [rate]);

  useEffect(() => {
    localStorage.setItem("gestura_tts_pitch", pitch.toString());
  }, [pitch]);

  const speak = useCallback((text: string, options?: TTSOptions) => {
    if (!supported || !synth) return;

    // Stop any ongoing speech
    synth.cancel();

    if (!text.trim()) return;

    const utterance = new SpeechSynthesisUtterance(text);
    
    const voiceToUse = options?.voice || voices.find(v => v.voiceURI === selectedVoiceURI);
    if (voiceToUse) {
      utterance.voice = voiceToUse;
    }
    
    utterance.rate = options?.rate ?? rate;
    utterance.pitch = options?.pitch ?? pitch;
    utterance.volume = options?.volume ?? 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onerror = (event) => {
      console.error("SpeechSynthesis error:", event);
      setIsSpeaking(false);
      setIsPaused(false);
    };

    synth.speak(utterance);
  }, [supported, synth, voices, selectedVoiceURI, rate, pitch]);

  const stop = useCallback(() => {
    if (!supported || !synth) return;
    synth.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  }, [supported, synth]);

  const pause = useCallback(() => {
    if (!supported || !synth) return;
    synth.pause();
    setIsPaused(true);
  }, [supported, synth]);

  const resume = useCallback(() => {
    if (!supported || !synth) return;
    synth.resume();
    setIsPaused(false);
  }, [supported, synth]);

  return {
    supported,
    voices,
    isSpeaking,
    isPaused,
    selectedVoiceURI,
    setSelectedVoiceURI,
    rate,
    setRate,
    pitch,
    setPitch,
    speak,
    stop,
    pause,
    resume
  };
}
