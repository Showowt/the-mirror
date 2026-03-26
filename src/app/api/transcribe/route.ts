// ═══════════════════════════════════════════════════════════════
// THE MIRROR — WHISPER TRANSCRIPTION API
// OpenAI Whisper for 99%+ accuracy across all languages
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

// ─── RATE LIMITING ─────────────────────────────────────────────
const TRANSCRIBE_LIMIT_PER_HOUR = 20;
const transcribeRateMap = new Map<string, { count: number; start: number }>();

function checkTranscribeRate(ip: string): {
  allowed: boolean;
  remaining: number;
} {
  const now = Date.now();
  const entry = transcribeRateMap.get(ip);

  // Cleanup old entries (older than 1 hour)
  Array.from(transcribeRateMap.entries()).forEach(([key, val]) => {
    if (now - val.start > 60 * 60 * 1000) {
      transcribeRateMap.delete(key);
    }
  });

  if (!entry || now - entry.start > 60 * 60 * 1000) {
    transcribeRateMap.set(ip, { count: 1, start: now });
    return { allowed: true, remaining: TRANSCRIBE_LIMIT_PER_HOUR - 1 };
  }

  if (entry.count >= TRANSCRIBE_LIMIT_PER_HOUR) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: TRANSCRIBE_LIMIT_PER_HOUR - entry.count };
}

// ─── VALID AUDIO TYPES ─────────────────────────────────────────
const VALID_AUDIO_TYPES = [
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/x-m4a",
  "audio/mp3",
];

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
    const rate = checkTranscribeRate(ip);

    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again later." },
        {
          status: 429,
          headers: { "X-RateLimit-Remaining": "0" },
        },
      );
    }

    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;
    const languageHint = formData.get("language") as string | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 },
      );
    }

    // Validate file type
    const fileType = audioFile.type || "";
    if (fileType && !VALID_AUDIO_TYPES.includes(fileType)) {
      return NextResponse.json(
        { error: "Invalid audio format. Supported: webm, mp4, mp3, wav, ogg" },
        { status: 400 },
      );
    }

    // Validate file size (max 25MB for Whisper)
    if (audioFile.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Audio file too large (max 25MB)" },
        { status: 400 },
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("[Transcribe] Missing OPENAI_API_KEY");
      return NextResponse.json(
        { error: "Transcription service not configured" },
        { status: 500 },
      );
    }

    // Convert File to Buffer for OpenAI
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create FormData for OpenAI API
    const openaiFormData = new FormData();

    // Create a Blob from the buffer
    const blob = new Blob([buffer], { type: audioFile.type || "audio/webm" });
    openaiFormData.append("file", blob, audioFile.name || "audio.webm");
    openaiFormData.append("model", "whisper-1");

    // Language hint improves accuracy (optional - Whisper auto-detects well)
    if (languageHint && languageHint !== "auto") {
      openaiFormData.append("language", languageHint);
    }

    // Response format
    openaiFormData.append("response_format", "verbose_json");

    // Optional: Add prompt for better context
    openaiFormData.append(
      "prompt",
      "This is a person sharing their thoughts, feelings, or a situation they're dealing with. Transcribe accurately including emotional nuances.",
    );

    // Call OpenAI Whisper API
    const response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: openaiFormData,
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Transcribe] OpenAI error:", response.status, errorText);
      return NextResponse.json(
        { error: "Transcription failed. Please try again." },
        { status: 503 },
      );
    }

    const result = await response.json();

    return NextResponse.json({
      text: result.text,
      language: result.language,
      duration: result.duration,
      segments: result.segments?.map(
        (seg: { start: number; end: number; text: string }) => ({
          start: seg.start,
          end: seg.end,
          text: seg.text,
        }),
      ),
    });
  } catch (error) {
    console.error("[Transcribe] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
