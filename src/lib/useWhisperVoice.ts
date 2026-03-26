// ═══════════════════════════════════════════════════════════════
// THE MIRROR — WHISPER VOICE TRANSCRIPTION
// OpenAI Whisper for 99%+ accuracy across 99+ languages
// Real-time recording with automatic transcription
// ═══════════════════════════════════════════════════════════════

"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface UseWhisperVoiceOptions {
  onTranscript: (text: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  silenceTimeout?: number; // ms of silence before auto-stopping (default: 2000)
  maxDuration?: number; // max recording duration in ms (default: 120000 = 2 min)
}

interface UseWhisperVoiceResult {
  isRecording: boolean;
  isProcessing: boolean;
  isSupported: boolean;
  audioLevel: number; // 0-100 for visualization
  start: () => Promise<void>;
  stop: () => Promise<void>;
  toggle: () => Promise<void>;
}

export function useWhisperVoice({
  onTranscript,
  onError,
  silenceTimeout = 2000,
  maxDuration = 120000,
}: UseWhisperVoiceOptions): UseWhisperVoiceResult {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxDurationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const lastAudioTimeRef = useRef<number>(Date.now());

  // Check support on mount
  useEffect(() => {
    const checkSupport = async () => {
      try {
        const hasMediaDevices = !!(
          navigator.mediaDevices && navigator.mediaDevices.getUserMedia
        );
        const hasMediaRecorder = typeof MediaRecorder !== "undefined";
        setIsSupported(hasMediaDevices && hasMediaRecorder);
      } catch {
        setIsSupported(false);
      }
    };
    checkSupport();

    return () => {
      // Cleanup on unmount
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (maxDurationTimerRef.current) {
        clearTimeout(maxDurationTimerRef.current);
      }
    };
  }, []);

  // Monitor audio levels for visualization and silence detection
  const monitorAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average volume
    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    const normalizedLevel = Math.min(100, Math.round((average / 128) * 100));
    setAudioLevel(normalizedLevel);

    // Detect sound vs silence
    if (normalizedLevel > 5) {
      lastAudioTimeRef.current = Date.now();
      // Clear silence timer when sound detected
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    } else {
      // Start silence timer if not already running
      if (!silenceTimerRef.current && isRecording) {
        const silenceDuration = Date.now() - lastAudioTimeRef.current;
        if (silenceDuration >= silenceTimeout) {
          // Auto-stop after silence
          stop();
          return;
        }
      }
    }

    if (isRecording) {
      animationFrameRef.current = requestAnimationFrame(monitorAudioLevel);
    }
  }, [isRecording, silenceTimeout]);

  // Transcribe audio using Whisper API
  const transcribeAudio = useCallback(
    async (audioBlob: Blob) => {
      setIsProcessing(true);

      try {
        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");
        formData.append("language", "auto"); // Auto-detect language

        const response = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Transcription failed");
        }

        const result = await response.json();

        if (result.text && result.text.trim()) {
          onTranscript(result.text.trim(), true);
        }
      } catch (error) {
        console.error("[Whisper] Transcription error:", error);
        onError?.(
          error instanceof Error ? error.message : "Transcription failed",
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [onTranscript, onError],
  );

  // Start recording
  const start = useCallback(async () => {
    if (isRecording || isProcessing) return;

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000, // Optimal for Whisper
        },
      });

      streamRef.current = stream;

      // Set up audio analysis for level monitoring
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Set up MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4";

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000,
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Combine all chunks into a single blob
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

        // Only transcribe if we have meaningful audio (> 0.5 seconds)
        if (audioBlob.size > 5000) {
          await transcribeAudio(audioBlob);
        }

        // Clean up
        audioChunksRef.current = [];
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100); // Collect data every 100ms

      setIsRecording(true);
      lastAudioTimeRef.current = Date.now();

      // Start audio level monitoring
      monitorAudioLevel();

      // Set max duration timer
      maxDurationTimerRef.current = setTimeout(() => {
        if (isRecording) {
          stop();
        }
      }, maxDuration);
    } catch (error) {
      console.error("[Whisper] Failed to start recording:", error);
      onError?.(
        error instanceof Error ? error.message : "Failed to access microphone",
      );
    }
  }, [
    isRecording,
    isProcessing,
    transcribeAudio,
    monitorAudioLevel,
    maxDuration,
    onError,
  ]);

  // Stop recording
  const stop = useCallback(async () => {
    if (!isRecording) return;

    // Clear timers
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    setIsRecording(false);
    setAudioLevel(0);

    // Stop MediaRecorder
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    analyserRef.current = null;
  }, [isRecording]);

  // Toggle recording
  const toggle = useCallback(async () => {
    if (isRecording) {
      await stop();
    } else {
      await start();
    }
  }, [isRecording, start, stop]);

  return {
    isRecording,
    isProcessing,
    isSupported,
    audioLevel,
    start,
    stop,
    toggle,
  };
}
