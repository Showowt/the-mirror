// ═══════════════════════════════════════════════════════════════
// THE MIRROR v2.1 — VOICE RECOGNITION HOOK (FIXED)
// Web Speech API — robust implementation with proper result tracking
// ═══════════════════════════════════════════════════════════════

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { Lang } from "./types";

// Type definitions for Web Speech API
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
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
  onspeechend: (() => void) | null;
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

  // Track which result indices have been finalized to avoid duplicates
  const finalizedIndexRef = useRef<number>(-1);

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
      let interimTranscript = "";

      // Process only new results starting from resultIndex
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        const transcript = result[0].transcript;

        if (result.isFinal) {
          // Only process if we haven't already processed this index
          if (i > finalizedIndexRef.current) {
            finalizedIndexRef.current = i;
            // Clean up the transcript - trim and ensure single spaces
            const cleaned = transcript.trim().replace(/\s+/g, " ");
            if (cleaned) {
              onResult(cleaned);
            }
          }
        } else {
          // Accumulate interim results
          interimTranscript += transcript;
        }
      }

      // Only show interim if we have something
      if (interimTranscript) {
        onInterim(interimTranscript.trim());
      } else {
        onInterim("");
      }
    };

    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      // Ignore common non-error events
      if (e.error === "aborted" || e.error === "no-speech") {
        return;
      }
      console.error("[Voice Error]", e.error);
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

    // Reset the finalized index tracker
    finalizedIndexRef.current = -1;

    try {
      recRef.current.lang = lang === "es" ? "es-MX" : "en-US";
      recRef.current.start();
      setListening(true);
    } catch {
      // Already started or error, try to restart
      try {
        recRef.current.stop();
      } catch {
        // Ignore
      }
      setTimeout(() => {
        try {
          finalizedIndexRef.current = -1;
          recRef.current?.start();
          setListening(true);
        } catch {
          // Ignore
        }
      }, 300);
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
    onInterim(""); // Clear interim on stop
  }, [onInterim]);

  const toggle = useCallback(() => {
    if (listening) {
      stop();
    } else {
      start();
    }
  }, [listening, start, stop]);

  return { listening, supported, toggle, stop };
}
