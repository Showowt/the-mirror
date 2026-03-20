// ═══════════════════════════════════════════════════════════════
// THE MIRROR v2.1 — VOICE RECOGNITION HOOK
// Web Speech API — runs entirely client-side, no API key needed
// ═══════════════════════════════════════════════════════════════

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { Lang } from "./types";

// Type definitions for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

interface UseVoiceResult {
  listening: boolean;
  supported: boolean;
  toggle: () => void;
  stop: () => void;
}

export function useVoice(
  lang: Lang,
  onResult: (transcript: string) => void,
  onInterim: (transcript: string) => void,
): UseVoiceResult {
  const recRef = useRef<SpeechRecognitionInstance | null>(null);
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Get the SpeechRecognition constructor
    const SR =
      (
        window as unknown as {
          SpeechRecognition?: SpeechRecognitionConstructor;
          webkitSpeechRecognition?: SpeechRecognitionConstructor;
        }
      ).SpeechRecognition ||
      (
        window as unknown as {
          webkitSpeechRecognition?: SpeechRecognitionConstructor;
        }
      ).webkitSpeechRecognition;

    setSupported(!!SR);
    if (!SR) return;

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    recRef.current = rec;

    rec.onresult = (e: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";
      for (let i = 0; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          final += transcript + " ";
        } else {
          interim += transcript;
        }
      }
      if (final) onResult(final.trim());
      if (interim) onInterim(interim);
    };

    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error !== "aborted" && e.error !== "no-speech") {
        console.error("[Voice Error]", e.error);
      }
      setListening(false);
    };

    rec.onend = () => {
      setListening(false);
    };

    return () => {
      try {
        rec.abort();
      } catch {
        // Ignore cleanup errors
      }
    };
  }, [onResult, onInterim]);

  // Update language when it changes
  useEffect(() => {
    if (recRef.current) {
      recRef.current.lang = lang === "es" ? "es-MX" : "en-US";
    }
  }, [lang]);

  const start = useCallback(() => {
    if (!recRef.current) return;
    try {
      recRef.current.lang = lang === "es" ? "es-MX" : "en-US";
      recRef.current.start();
      setListening(true);
    } catch {
      // Already started, restart
      try {
        recRef.current.stop();
      } catch {
        // Ignore
      }
      setTimeout(() => {
        try {
          recRef.current?.start();
          setListening(true);
        } catch {
          // Ignore
        }
      }, 200);
    }
  }, [lang]);

  const stop = useCallback(() => {
    if (!recRef.current) return;
    try {
      recRef.current.stop();
    } catch {
      // Ignore
    }
    setListening(false);
  }, []);

  const toggle = useCallback(() => {
    if (listening) {
      stop();
    } else {
      start();
    }
  }, [listening, start, stop]);

  return { listening, supported, toggle, stop };
}
