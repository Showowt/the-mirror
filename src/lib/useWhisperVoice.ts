// ═══════════════════════════════════════════════════════════════
// THE MIRROR — WHISPER VOICE TRANSCRIPTION
// OpenAI Whisper for 99%+ accuracy across 99+ languages
// Real-time recording with automatic transcription
// ═══════════════════════════════════════════════════════════════

"use client";

import { useState, useRef, useCallback, useEffect } from "react";

// Debug flag - set to true to enable verbose logging
const DEBUG_VOICE = true;
const log = (...args: unknown[]) => {
  if (DEBUG_VOICE) {
    console.log("[Voice]", ...args);
  }
};

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
  const [isSupported, setIsSupported] = useState(false); // Start false, set true after client check
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

  // Check support on mount (client-side only)
  useEffect(() => {
    // Only run on client
    if (typeof window === "undefined") return;

    const checkSupport = () => {
      try {
        const hasMediaDevices = !!(
          typeof navigator !== "undefined" &&
          navigator.mediaDevices &&
          navigator.mediaDevices.getUserMedia
        );
        const hasMediaRecorder = typeof MediaRecorder !== "undefined";
        const supported = hasMediaDevices && hasMediaRecorder;
        console.log("[Voice] Support check:", {
          hasMediaDevices,
          hasMediaRecorder,
          supported,
        });
        setIsSupported(supported);
      } catch (e) {
        console.error("[Voice] Support check failed:", e);
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
    async (audioBlob: Blob, mimeType: string) => {
      log("transcribeAudio called", {
        blobSize: audioBlob.size,
        blobType: audioBlob.type,
        mimeType,
      });

      setIsProcessing(true);

      try {
        // Determine the correct file extension based on mimeType
        const extension = mimeType.includes("mp4") ? "mp4" : "webm";
        const filename = `recording.${extension}`;

        log("Creating FormData with filename:", filename);

        const formData = new FormData();
        // Use the actual mimeType from the recording
        const blobWithType = new Blob([audioBlob], { type: mimeType });
        formData.append("audio", blobWithType, filename);
        formData.append("language", "auto"); // Auto-detect language

        log("Sending fetch to /api/transcribe...");

        const response = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        });

        log("Fetch response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          log("Error response:", errorText);
          let errorMessage = "Transcription failed";
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.error || errorMessage;
          } catch {
            // If not JSON, use the text directly
            errorMessage = errorText || errorMessage;
          }
          throw new Error(errorMessage);
        }

        const result = await response.json();
        log("Transcription result:", result);

        if (result.text && result.text.trim()) {
          log("Calling onTranscript with:", result.text.trim());
          onTranscript(result.text.trim(), true);
        } else {
          log("No text in result or empty text");
          onError?.("No speech detected. Please try again.");
        }
      } catch (error) {
        console.error("[Whisper] Transcription error:", error);
        log("Transcription error:", error);
        onError?.(
          error instanceof Error ? error.message : "Transcription failed",
        );
      } finally {
        setIsProcessing(false);
        log("Processing complete");
      }
    },
    [onTranscript, onError],
  );

  // Store mimeType in a ref so onstop can access it
  const mimeTypeRef = useRef<string>("audio/webm");

  // Start recording
  const start = useCallback(async () => {
    log("start() called", { isRecording, isProcessing });

    if (isRecording || isProcessing) {
      log("Already recording or processing, returning");
      return;
    }

    try {
      log("Requesting microphone access...");

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000, // Optimal for Whisper
        },
      });

      log("Microphone access granted", {
        tracks: stream.getAudioTracks().length,
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

      // Set up MediaRecorder - test supported formats
      log("Testing supported MIME types...");
      const formats = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/ogg;codecs=opus",
        "audio/wav",
      ];

      let selectedMimeType = "";
      for (const format of formats) {
        if (MediaRecorder.isTypeSupported(format)) {
          selectedMimeType = format;
          log("Selected MIME type:", format);
          break;
        }
      }

      if (!selectedMimeType) {
        log("No supported MIME type found!");
        throw new Error("No supported audio format found");
      }

      mimeTypeRef.current = selectedMimeType;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType,
        audioBitsPerSecond: 128000,
      });

      log("MediaRecorder created", {
        state: mediaRecorder.state,
        mimeType: mediaRecorder.mimeType,
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        log("ondataavailable", {
          dataSize: event.data.size,
          totalChunks: audioChunksRef.current.length + 1,
        });
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        log("onstop triggered", {
          chunksCount: audioChunksRef.current.length,
          mimeType: mimeTypeRef.current,
        });

        // Combine all chunks into a single blob
        const chunks = audioChunksRef.current;
        const usedMimeType = mimeTypeRef.current;

        if (chunks.length === 0) {
          log("No audio chunks collected!");
          onError?.("No audio recorded. Please try again.");
          return;
        }

        const audioBlob = new Blob(chunks, { type: usedMimeType });

        log("Audio blob created", {
          blobSize: audioBlob.size,
          blobType: audioBlob.type,
        });

        // Only transcribe if we have meaningful audio (> 1KB to catch very short recordings)
        if (audioBlob.size > 1000) {
          log("Blob size OK, calling transcribeAudio...");
          await transcribeAudio(audioBlob, usedMimeType);
        } else {
          log("Blob too small, skipping transcription", {
            size: audioBlob.size,
          });
          onError?.("Recording too short. Please speak longer.");
        }

        // Clean up
        audioChunksRef.current = [];
      };

      mediaRecorder.onerror = (event) => {
        log("MediaRecorder error:", event);
        console.error("[Voice] MediaRecorder error:", event);
        onError?.("Recording error occurred");
      };

      mediaRecorderRef.current = mediaRecorder;

      // Use timeslice of 250ms to ensure we get data chunks
      mediaRecorder.start(250);
      log("MediaRecorder started with timeslice 250ms");

      setIsRecording(true);
      lastAudioTimeRef.current = Date.now();

      // Start audio level monitoring
      monitorAudioLevel();

      // Set max duration timer
      maxDurationTimerRef.current = setTimeout(() => {
        log("Max duration reached, stopping...");
        if (isRecording) {
          stop();
        }
      }, maxDuration);

      log("Recording started successfully");
    } catch (error) {
      console.error("[Whisper] Failed to start recording:", error);
      log("Failed to start recording:", error);
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
    log("stop() called", { isRecording });

    if (!isRecording) {
      log("Not recording, returning");
      return;
    }

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

    // Stop MediaRecorder - this will trigger onstop
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      log("Stopping MediaRecorder, state:", mediaRecorderRef.current.state);

      // Request any pending data before stopping
      if (mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.requestData();
      }

      mediaRecorderRef.current.stop();
      log("MediaRecorder.stop() called");
    } else {
      log("MediaRecorder already inactive or null");
    }

    // Stop all tracks
    if (streamRef.current) {
      log("Stopping stream tracks...");
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        log("Track stopped:", track.kind);
      });
      streamRef.current = null;
    }

    analyserRef.current = null;
    log("stop() complete");
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
