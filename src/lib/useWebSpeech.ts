// ═══════════════════════════════════════════════════════════════
// THE MIRROR — WEB SPEECH API TRANSCRIPTION
// Free, real-time, browser-native speech recognition
// No API keys required - works immediately
// ═══════════════════════════════════════════════════════════════

"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface UseWebSpeechOptions {
  onTranscript: (text: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  language?: string; // e.g., "en-US", "es-ES", "auto"
  continuous?: boolean; // Keep listening after pauses
  interimResults?: boolean; // Show results while speaking
}

interface UseWebSpeechResult {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  start: () => void;
  stop: () => void;
  toggle: () => void;
  language: string;
  setLanguage: (lang: string) => void;
}

// TypeScript declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  onspeechend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export function useWebSpeech({
  onTranscript,
  onError,
  language = "auto",
  continuous = true,
  interimResults = true,
}: UseWebSpeechOptions): UseWebSpeechResult {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [currentLanguage, setCurrentLanguage] = useState(language);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const restartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isStoppingRef = useRef(false);

  // Check browser support
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);
      console.log("[WebSpeech] Browser supports speech recognition");
    } else {
      setIsSupported(false);
      console.log("[WebSpeech] Speech recognition not supported");
    }

    return () => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
    };
  }, []);

  // Map language codes
  const getLanguageCode = useCallback((lang: string): string => {
    const langMap: Record<string, string> = {
      auto: "", // Empty string = auto-detect
      en: "en-US",
      es: "es-ES",
      "es-CO": "es-CO",
      "es-MX": "es-MX",
      fr: "fr-FR",
      de: "de-DE",
      pt: "pt-BR",
      it: "it-IT",
      ja: "ja-JP",
      ko: "ko-KR",
      zh: "zh-CN",
    };
    return langMap[lang] || lang;
  }, []);

  // Initialize recognition
  const initRecognition = useCallback(() => {
    if (typeof window === "undefined") return null;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();

    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.maxAlternatives = 1;

    const langCode = getLanguageCode(currentLanguage);
    if (langCode) {
      recognition.lang = langCode;
    }

    recognition.onstart = () => {
      console.log("[WebSpeech] Recognition started", {
        lang: recognition.lang,
      });
      setIsListening(true);
      isStoppingRef.current = false;
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;

        if (result.isFinal) {
          finalTranscript += text;
          console.log("[WebSpeech] Final result:", text);
        } else {
          interimTranscript += text;
        }
      }

      // Update local transcript for display
      if (finalTranscript) {
        setTranscript((prev) => {
          const separator = prev.trim() ? " " : "";
          return prev.trim() + separator + finalTranscript;
        });
        onTranscript(finalTranscript, true);
      } else if (interimTranscript) {
        // Show interim results but don't commit them
        onTranscript(interimTranscript, false);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("[WebSpeech] Error:", event.error, event.message);

      // Handle specific errors
      switch (event.error) {
        case "no-speech":
          // User didn't speak - not a critical error
          console.log("[WebSpeech] No speech detected");
          break;
        case "audio-capture":
          onError?.("Microphone not available. Please check your settings.");
          break;
        case "not-allowed":
          onError?.("Microphone permission denied. Please allow access.");
          break;
        case "network":
          onError?.("Network error. Please check your connection.");
          break;
        case "aborted":
          // User aborted - not an error
          break;
        default:
          onError?.(`Speech recognition error: ${event.error}`);
      }

      // Don't restart on permission errors
      if (event.error === "not-allowed" || event.error === "audio-capture") {
        setIsListening(false);
        isStoppingRef.current = true;
      }
    };

    recognition.onend = () => {
      console.log("[WebSpeech] Recognition ended", {
        isStopping: isStoppingRef.current,
      });

      if (!isStoppingRef.current && continuous) {
        // Auto-restart for continuous mode
        restartTimeoutRef.current = setTimeout(() => {
          if (!isStoppingRef.current && recognitionRef.current) {
            console.log("[WebSpeech] Auto-restarting...");
            try {
              recognitionRef.current.start();
            } catch (e) {
              console.error("[WebSpeech] Failed to restart:", e);
              setIsListening(false);
            }
          }
        }, 100);
      } else {
        setIsListening(false);
      }
    };

    recognition.onspeechend = () => {
      console.log("[WebSpeech] Speech ended");
    };

    return recognition;
  }, [
    continuous,
    interimResults,
    currentLanguage,
    getLanguageCode,
    onTranscript,
    onError,
  ]);

  // Start listening
  const start = useCallback(() => {
    if (!isSupported) {
      onError?.("Speech recognition not supported in this browser");
      return;
    }

    if (isListening) {
      console.log("[WebSpeech] Already listening");
      return;
    }

    console.log("[WebSpeech] Starting...");
    isStoppingRef.current = false;
    setTranscript("");

    // Create fresh recognition instance
    const recognition = initRecognition();
    if (!recognition) {
      onError?.("Failed to initialize speech recognition");
      return;
    }

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (error) {
      console.error("[WebSpeech] Failed to start:", error);
      onError?.("Failed to start speech recognition");
      setIsListening(false);
    }
  }, [isSupported, isListening, initRecognition, onError]);

  // Stop listening
  const stop = useCallback(() => {
    console.log("[WebSpeech] Stopping...");
    isStoppingRef.current = true;

    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error("[WebSpeech] Error stopping:", e);
      }
      recognitionRef.current = null;
    }

    setIsListening(false);
  }, []);

  // Toggle listening
  const toggle = useCallback(() => {
    if (isListening) {
      stop();
    } else {
      start();
    }
  }, [isListening, start, stop]);

  // Update language
  const setLanguage = useCallback(
    (lang: string) => {
      setCurrentLanguage(lang);
      // If currently listening, restart with new language
      if (recognitionRef.current) {
        stop();
        setTimeout(() => start(), 100);
      }
    },
    [stop, start],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isStoppingRef.current = true;
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // Ignore
        }
      }
    };
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    start,
    stop,
    toggle,
    language: currentLanguage,
    setLanguage,
  };
}
