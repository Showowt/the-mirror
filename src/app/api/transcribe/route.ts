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
// Base MIME types (without codec specifications)
const VALID_AUDIO_TYPES = [
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/x-m4a",
  "audio/mp3",
];

// Extract base MIME type (handles cases like "audio/webm;codecs=opus")
function getBaseMimeType(mimeType: string): string {
  return mimeType.split(";")[0].trim().toLowerCase();
}

export async function POST(req: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[Transcribe:${requestId}] === START REQUEST ===`);

  try {
    // Rate limiting
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
    const rate = checkTranscribeRate(ip);
    console.log(
      `[Transcribe:${requestId}] IP: ${ip}, Rate remaining: ${rate.remaining}`,
    );

    if (!rate.allowed) {
      console.log(`[Transcribe:${requestId}] Rate limit exceeded`);
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again later." },
        {
          status: 429,
          headers: { "X-RateLimit-Remaining": "0" },
        },
      );
    }

    // Parse FormData
    console.log(`[Transcribe:${requestId}] Parsing FormData...`);
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;
    const languageHint = formData.get("language") as string | null;

    console.log(
      `[Transcribe:${requestId}] FormData parsed - audio: ${audioFile ? "present" : "missing"}, language: ${languageHint || "auto"}`,
    );

    if (!audioFile) {
      console.log(`[Transcribe:${requestId}] ERROR: No audio file provided`);
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 },
      );
    }

    // Log file details
    console.log(`[Transcribe:${requestId}] File details:`, {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size,
      sizeKB: (audioFile.size / 1024).toFixed(2) + "KB",
    });

    // Validate file type - handle codec specifications like "audio/webm;codecs=opus"
    const fileType = audioFile.type || "";
    const baseMimeType = getBaseMimeType(fileType);
    console.log(`[Transcribe:${requestId}] MIME type check:`, {
      original: fileType,
      base: baseMimeType,
    });

    if (baseMimeType && !VALID_AUDIO_TYPES.includes(baseMimeType)) {
      console.log(
        `[Transcribe:${requestId}] ERROR: Invalid audio format: ${fileType} (base: ${baseMimeType})`,
      );
      return NextResponse.json(
        { error: "Invalid audio format. Supported: webm, mp4, mp3, wav, ogg" },
        { status: 400 },
      );
    }

    // Validate file size (max 25MB for Whisper)
    if (audioFile.size > 25 * 1024 * 1024) {
      console.log(
        `[Transcribe:${requestId}] ERROR: File too large: ${audioFile.size} bytes`,
      );
      return NextResponse.json(
        { error: "Audio file too large (max 25MB)" },
        { status: 400 },
      );
    }

    // Check for empty file
    if (audioFile.size === 0) {
      console.log(`[Transcribe:${requestId}] ERROR: Empty audio file`);
      return NextResponse.json(
        { error: "Audio file is empty" },
        { status: 400 },
      );
    }

    // Check API key
    const apiKey = process.env.OPENAI_API_KEY;
    console.log(`[Transcribe:${requestId}] API Key check:`, {
      exists: !!apiKey,
      length: apiKey?.length || 0,
      prefix: apiKey?.substring(0, 10) + "..." || "N/A",
    });

    if (!apiKey) {
      console.error(
        `[Transcribe:${requestId}] ERROR: Missing OPENAI_API_KEY env var`,
      );
      return NextResponse.json(
        { error: "Transcription service not configured" },
        { status: 500 },
      );
    }

    // Convert File to Buffer for OpenAI
    console.log(`[Transcribe:${requestId}] Converting file to buffer...`);
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log(
      `[Transcribe:${requestId}] Buffer created, size: ${buffer.length} bytes`,
    );

    // Create FormData for OpenAI API
    console.log(`[Transcribe:${requestId}] Building OpenAI FormData...`);
    const openaiFormData = new FormData();

    // Determine file extension based on MIME type (use base type for lookup)
    const mimeToExt: Record<string, string> = {
      "audio/webm": "webm",
      "audio/mp4": "mp4",
      "audio/mpeg": "mp3",
      "audio/mp3": "mp3",
      "audio/wav": "wav",
      "audio/ogg": "ogg",
      "audio/x-m4a": "m4a",
    };
    const extension = mimeToExt[baseMimeType] || "webm";
    const fileName = audioFile.name || `audio.${extension}`;

    // Create a Blob from the buffer
    const blob = new Blob([buffer], { type: audioFile.type || "audio/webm" });
    openaiFormData.append("file", blob, fileName);
    openaiFormData.append("model", "whisper-1");

    console.log(`[Transcribe:${requestId}] FormData built:`, {
      fileName,
      blobType: audioFile.type || "audio/webm",
      blobSize: blob.size,
    });

    // Language hint improves accuracy (optional - Whisper auto-detects well)
    if (languageHint && languageHint !== "auto") {
      openaiFormData.append("language", languageHint);
      console.log(
        `[Transcribe:${requestId}] Language hint set: ${languageHint}`,
      );
    }

    // Response format
    openaiFormData.append("response_format", "verbose_json");

    // Optional: Add prompt for better context
    openaiFormData.append(
      "prompt",
      "This is a person sharing their thoughts, feelings, or a situation they're dealing with. Transcribe accurately including emotional nuances.",
    );

    // Call OpenAI Whisper API
    console.log(`[Transcribe:${requestId}] Calling OpenAI Whisper API...`);
    const startTime = Date.now();

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

    const elapsed = Date.now() - startTime;
    console.log(
      `[Transcribe:${requestId}] OpenAI response received in ${elapsed}ms, status: ${response.status}`,
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Transcribe:${requestId}] OpenAI ERROR:`, {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorText,
      });

      // Parse error for better user message
      let userMessage = "Transcription failed. Please try again.";
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.message) {
          console.error(
            `[Transcribe:${requestId}] OpenAI error message: ${errorJson.error.message}`,
          );
          // Don't expose internal errors to user, but log them
          if (errorJson.error.type === "invalid_request_error") {
            userMessage = "Invalid audio format. Please try recording again.";
          }
        }
      } catch {
        // errorText is not JSON
      }

      return NextResponse.json({ error: userMessage }, { status: 503 });
    }

    // Parse response
    console.log(`[Transcribe:${requestId}] Parsing OpenAI response...`);
    const responseText = await response.text();
    console.log(
      `[Transcribe:${requestId}] Raw response length: ${responseText.length} chars`,
    );

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error(`[Transcribe:${requestId}] JSON parse error:`, parseError);
      console.error(
        `[Transcribe:${requestId}] Raw response:`,
        responseText.substring(0, 500),
      );
      return NextResponse.json(
        { error: "Failed to parse transcription response" },
        { status: 500 },
      );
    }

    console.log(`[Transcribe:${requestId}] SUCCESS:`, {
      textLength: result.text?.length || 0,
      language: result.language,
      duration: result.duration,
      segmentCount: result.segments?.length || 0,
    });

    console.log(`[Transcribe:${requestId}] === END REQUEST (success) ===`);

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
    console.error(`[Transcribe:${requestId}] UNCAUGHT ERROR:`, error);
    console.error(
      `[Transcribe:${requestId}] Error type:`,
      error instanceof Error ? error.constructor.name : typeof error,
    );
    console.error(
      `[Transcribe:${requestId}] Error message:`,
      error instanceof Error ? error.message : String(error),
    );
    console.error(
      `[Transcribe:${requestId}] Error stack:`,
      error instanceof Error ? error.stack : "N/A",
    );
    console.log(`[Transcribe:${requestId}] === END REQUEST (error) ===`);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
