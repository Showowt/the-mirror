// ═══════════════════════════════════════════════════════════════════════════
// THE MIRROR PROTOCOL API — DROP 007
// REST API for external platform integration.
// Coaching apps, therapy platforms, HR tools pay to use this.
// MachineMind | Phil McGill
// ═══════════════════════════════════════════════════════════════════════════
//
// ENDPOINTS:
// POST /api/mirror-protocol/reflect     — Send user input, get Mirror question
// POST /api/mirror-protocol/analyze     — Send session data, get analysis
// POST /api/mirror-protocol/onboard     — Run onboarding calibration
// GET  /api/mirror-protocol/onboard     — Get onboarding questions
// GET  /api/mirror-protocol/insights    — Get aggregate transmission insights
// POST /api/mirror-protocol/calibrate   — Get optimal approach for a user profile
//
// All endpoints require API key in x-mirror-api-key header.
// ═══════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  MirrorPromptBuilder,
  CalibrationEngine,
  SessionAnalyzer,
  OnboardingEngine,
  EmergenceDetector,
  type DescentLevel,
  type CognitiveMap,
  type MirrorPattern,
  type CalibrationRecord,
  type SessionEntry,
  type BlindSpotCategory,
} from "@/lib/mirror-intelligence-engine";

// ── Rate Limit Tiers ──

const RATE_LIMITS: Record<string, number> = {
  free: 100, // 100 requests per hour
  starter: 500, // 500 requests per hour
  growth: 2000, // 2000 requests per hour
  premium: 10000, // 10000 requests per hour
  enterprise: 100000, // 100000 requests per hour
};

// ── Auth ──

interface AuthResult {
  valid: boolean;
  partnerId: string | null;
  tier: string | null;
  error?: string;
}

async function validateApiKey(request: NextRequest): Promise<AuthResult> {
  const apiKey = request.headers.get("x-mirror-api-key");
  if (!apiKey) {
    return {
      valid: false,
      partnerId: null,
      tier: null,
      error: "Missing API key",
    };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("[MirrorProtocol] Missing Supabase configuration");
    return {
      valid: false,
      partnerId: null,
      tier: null,
      error: "Server configuration error",
    };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { data, error } = await supabase
      .from("mirror_api_keys")
      .select(
        "partner_id, tier, is_active, rate_limit_per_hour, requests_this_hour, hour_reset_at",
      )
      .eq("api_key_hash", hashApiKey(apiKey))
      .eq("is_active", true)
      .single();

    if (error || !data) {
      return {
        valid: false,
        partnerId: null,
        tier: null,
        error: "Invalid API key",
      };
    }

    // Check if hour has reset
    const now = new Date();
    const resetAt = data.hour_reset_at ? new Date(data.hour_reset_at) : null;

    if (!resetAt || now > resetAt) {
      // Reset the counter
      const nextReset = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
      await supabase
        .from("mirror_api_keys")
        .update({
          requests_this_hour: 1,
          hour_reset_at: nextReset.toISOString(),
        })
        .eq("partner_id", data.partner_id);
    } else {
      // Check rate limit
      const limit =
        data.rate_limit_per_hour || RATE_LIMITS[data.tier] || RATE_LIMITS.free;
      if (data.requests_this_hour >= limit) {
        return {
          valid: false,
          partnerId: data.partner_id,
          tier: "rate_limited",
          error: `Rate limit exceeded. ${limit} requests per hour allowed.`,
        };
      }

      // Increment request count
      await supabase
        .from("mirror_api_keys")
        .update({ requests_this_hour: data.requests_this_hour + 1 })
        .eq("partner_id", data.partner_id);
    }

    return { valid: true, partnerId: data.partner_id, tier: data.tier };
  } catch (err) {
    console.error("[MirrorProtocol] Auth error:", err);
    return {
      valid: false,
      partnerId: null,
      tier: null,
      error: "Authentication failed",
    };
  }
}

function hashApiKey(key: string): string {
  // Simple hash for key lookup
  // In production, use crypto.subtle.digest for SHA-256
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash.toString(36);
}

// ── Claude Client ──

async function callClaude(
  systemPrompt: string,
  userContent: string,
): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[MirrorProtocol] Missing ANTHROPIC_API_KEY");
    return null;
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: "user", content: userContent }],
      }),
    });

    if (!response.ok) {
      console.error("[MirrorProtocol] Claude API error:", response.status);
      return null;
    }

    const data = await response.json();
    return data?.content?.[0]?.text?.trim() || null;
  } catch (e) {
    console.error("[MirrorProtocol] Claude API error:", e);
    return null;
  }
}

// ── Usage Logging ──

async function logProtocolUsage(
  partnerId: string,
  endpoint: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) return;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    await supabase.from("mirror_api_usage").insert({
      partner_id: partnerId,
      endpoint,
      metadata,
      created_at: new Date().toISOString(),
    });
  } catch {
    // Non-fatal — don't break the request for logging
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINT 1: REFLECT
// The core product. Send what the user said, get a Mirror question back.
// ═══════════════════════════════════════════════════════════════════════════

async function handleReflect(request: NextRequest): Promise<NextResponse> {
  const auth = await validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json(
      { error: auth.error || "Invalid API key" },
      { status: auth.tier === "rate_limited" ? 429 : 401 },
    );
  }

  try {
    const body = await request.json();
    const {
      userInput,
      level = "surface",
      cognitiveMap = null,
      patterns = [],
      calibration = {},
      sessionHistory = [],
      externalUserId,
    } = body as {
      userInput: string;
      level?: DescentLevel;
      cognitiveMap?: CognitiveMap | null;
      patterns?: MirrorPattern[];
      calibration?: Record<string, CalibrationRecord>;
      sessionHistory?: SessionEntry[];
      externalUserId?: string;
    };

    if (!userInput || userInput.trim().length < 5) {
      return NextResponse.json(
        { error: "userInput is required (minimum 5 characters)" },
        { status: 400 },
      );
    }

    // Validate level
    const validLevels: DescentLevel[] = [
      "surface",
      "pattern",
      "origin",
      "core",
    ];
    if (!validLevels.includes(level)) {
      return NextResponse.json(
        { error: `Invalid level. Must be one of: ${validLevels.join(", ")}` },
        { status: 400 },
      );
    }

    // Build the full intelligence-layer system prompt
    const systemPrompt = MirrorPromptBuilder.build({
      level,
      cogMap: cognitiveMap,
      patterns,
      calibration,
      sessionEntries: sessionHistory,
    });

    const mirrorResponse = await callClaude(systemPrompt, userInput.trim());

    if (!mirrorResponse) {
      return NextResponse.json(
        { error: "Mirror reflection failed" },
        { status: 500 },
      );
    }

    // Determine which approach was used
    const blindSpot =
      patterns.find((p) => p.status === "confirmed")?.category || null;
    const approachUsed = CalibrationEngine.selectApproach(
      cognitiveMap,
      calibration,
      level,
      blindSpot,
    );

    // Log usage for analytics
    await logProtocolUsage(auth.partnerId!, "reflect", {
      level,
      externalUserId,
      approachUsed,
    });

    return NextResponse.json({
      reflection: mirrorResponse,
      level,
      approachUsed,
      metadata: {
        cognitiveMapConfidence: cognitiveMap?.confidence || 0,
        activePatterns: patterns.filter((p) => p.status !== "integrated")
          .length,
        partnerId: auth.partnerId,
      },
    });
  } catch (e) {
    console.error("[MirrorProtocol] Reflect error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINT 2: ANALYZE
// Post-session analysis. Returns cognitive updates, pattern detection,
// emergence events, calibration feedback.
// ═══════════════════════════════════════════════════════════════════════════

async function handleAnalyze(request: NextRequest): Promise<NextResponse> {
  const auth = await validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json(
      { error: auth.error || "Invalid API key" },
      { status: auth.tier === "rate_limited" ? 429 : 401 },
    );
  }

  try {
    const body = await request.json();
    const {
      sessionEntries,
      cognitiveMap = null,
      existingPatterns = [],
    } = body as {
      sessionEntries: SessionEntry[];
      cognitiveMap?: CognitiveMap | null;
      existingPatterns?: MirrorPattern[];
    };

    if (!sessionEntries || sessionEntries.length < 2) {
      return NextResponse.json(
        { error: "sessionEntries is required (minimum 2 entries)" },
        { status: 400 },
      );
    }

    // Validate session entries
    for (const entry of sessionEntries) {
      if (!entry.type || !entry.content) {
        return NextResponse.json(
          { error: "Each session entry must have type and content" },
          { status: 400 },
        );
      }
      const validTypes = [
        "offering",
        "question",
        "response",
        "observation",
        "pattern_reveal",
      ];
      if (!validTypes.includes(entry.type)) {
        return NextResponse.json(
          {
            error: `Session entry type must be one of: ${validTypes.join(", ")}`,
          },
          { status: 400 },
        );
      }
    }

    // Run full session analysis
    const analysisPayload = SessionAnalyzer.buildPayload(
      sessionEntries,
      cognitiveMap,
      existingPatterns,
    );

    const rawAnalysis = await callClaude(
      SessionAnalyzer.ANALYSIS_PROMPT,
      analysisPayload,
    );

    if (!rawAnalysis) {
      return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
    }

    let analysis;
    try {
      analysis = JSON.parse(rawAnalysis.replace(/```json|```/g, "").trim());
    } catch {
      return NextResponse.json(
        { error: "Analysis parsing failed", raw: rawAnalysis },
        { status: 500 },
      );
    }

    // Run emergence detection
    const emergencePayload = EmergenceDetector.buildDetectionPayload(
      sessionEntries,
      cognitiveMap,
      existingPatterns,
    );

    const rawEmergence = await callClaude(
      EmergenceDetector.DETECTION_PROMPT,
      emergencePayload,
    );

    let emergence = {
      events: [],
      sessionEmergenceScore: 0,
      deepestInsight: "",
    };
    if (rawEmergence) {
      try {
        emergence = JSON.parse(rawEmergence.replace(/```json|```/g, "").trim());
      } catch {
        // Non-fatal — emergence detection is supplementary
      }
    }

    // If the partner sent a cognitive map, apply the updates
    let updatedState = null;
    if (cognitiveMap) {
      updatedState = SessionAnalyzer.applyAnalysis(
        analysis,
        cognitiveMap,
        existingPatterns,
        {}, // calibration handled by partner
      );
    }

    await logProtocolUsage(auth.partnerId!, "analyze", {
      entriesCount: sessionEntries.length,
      emergenceScore: emergence.sessionEmergenceScore,
    });

    return NextResponse.json({
      analysis,
      emergence,
      updatedState: updatedState
        ? {
            cognitiveMap: updatedState.updatedCogMap,
            patterns: updatedState.updatedPatterns,
          }
        : null,
    });
  } catch (e) {
    console.error("[MirrorProtocol] Analyze error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINT 3: ONBOARD (POST)
// Run the 5-question onboarding sequence analysis.
// Partner sends the 5 responses, gets back initial cognitive map.
// ═══════════════════════════════════════════════════════════════════════════

async function handleOnboardPost(request: NextRequest): Promise<NextResponse> {
  const auth = await validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json(
      { error: auth.error || "Invalid API key" },
      { status: auth.tier === "rate_limited" ? 429 : 401 },
    );
  }

  try {
    const body = await request.json();
    const { responses } = body as {
      responses: { questionId: string; response: string }[];
    };

    if (!responses || responses.length < 3) {
      return NextResponse.json(
        {
          error: "Minimum 3 onboarding responses required",
          questions: OnboardingEngine.ONBOARDING_SEQUENCE.map((q) => ({
            id: q.id,
            question: q.question,
          })),
        },
        { status: 400 },
      );
    }

    // Validate response format
    for (const r of responses) {
      if (!r.questionId || !r.response) {
        return NextResponse.json(
          { error: "Each response must have questionId and response" },
          { status: 400 },
        );
      }
      if (r.response.trim().length < 10) {
        return NextResponse.json(
          {
            error: `Response for ${r.questionId} is too short (minimum 10 characters)`,
          },
          { status: 400 },
        );
      }
    }

    const analysisPayload = OnboardingEngine.buildAnalysisPayload(responses);

    const rawResult = await callClaude(
      OnboardingEngine.ONBOARDING_ANALYSIS_PROMPT,
      analysisPayload,
    );

    if (!rawResult) {
      return NextResponse.json(
        { error: "Onboarding analysis failed" },
        { status: 500 },
      );
    }

    let result;
    try {
      result = JSON.parse(rawResult.replace(/```json|```/g, "").trim());
    } catch {
      return NextResponse.json(
        { error: "Analysis parsing failed" },
        { status: 500 },
      );
    }

    await logProtocolUsage(auth.partnerId!, "onboard", {
      responsesCount: responses.length,
    });

    return NextResponse.json({
      cognitiveMap: {
        intellectualizer: result.intellectualizer,
        externalizer: result.externalizer,
        futureFixation: result.futureFixation,
        agency: result.agency,
        narrativeRigidity: result.narrativeRigidity,
        depthTolerance: result.depthTolerance,
        confrontationResponse: result.confrontationResponse,
        primaryDefense: result.primaryDefense,
        confidence: result.confidence,
        sessionsAnalyzed: 0,
      },
      suggestedApproach: result.suggestedApproach,
      initialPatternHypotheses: result.initialPatternHypotheses,
      notes: result.notes,
    });
  } catch (e) {
    console.error("[MirrorProtocol] Onboard error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINT 3: ONBOARD (GET)
// Get the onboarding questions
// ═══════════════════════════════════════════════════════════════════════════

async function handleOnboardGet(request: NextRequest): Promise<NextResponse> {
  const auth = await validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json(
      { error: auth.error || "Invalid API key" },
      { status: auth.tier === "rate_limited" ? 429 : 401 },
    );
  }

  return NextResponse.json({
    questions: OnboardingEngine.ONBOARDING_SEQUENCE.map((q) => ({
      id: q.id,
      question: q.question,
    })),
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINT 4: INSIGHTS (Transmission Layer)
// Aggregate anonymized insights across all Mirror users.
// This is the transmission data that coaching/therapy platforms pay for.
// ═══════════════════════════════════════════════════════════════════════════

async function handleInsights(request: NextRequest): Promise<NextResponse> {
  const auth = await validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json(
      { error: auth.error || "Invalid API key" },
      { status: auth.tier === "rate_limited" ? 429 : 401 },
    );
  }

  // Insights only available to premium tier
  if (auth.tier !== "premium" && auth.tier !== "enterprise") {
    return NextResponse.json(
      { error: "Insights endpoint requires premium or enterprise tier" },
      { status: 403 },
    );
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Pre-computed insights (refreshed by cron job)
    const { data, error } = await supabase
      .from("mirror_transmission_reports")
      .select("*")
      .order("generated_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "No insights available yet" },
        { status: 404 },
      );
    }

    await logProtocolUsage(auth.partnerId!, "insights", {});

    return NextResponse.json({
      report: data.report_data,
      generatedAt: data.generated_at,
      version: data.version,
    });
  } catch (e) {
    console.error("[MirrorProtocol] Insights error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINT 5: CALIBRATE
// Given a cognitive profile, returns the optimal approach.
// Quick lookup — no AI call needed.
// ═══════════════════════════════════════════════════════════════════════════

async function handleCalibrate(request: NextRequest): Promise<NextResponse> {
  const auth = await validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json(
      { error: auth.error || "Invalid API key" },
      { status: auth.tier === "rate_limited" ? 429 : 401 },
    );
  }

  try {
    const body = await request.json();
    const {
      cognitiveMap,
      calibrationHistory = {},
      currentLevel = "surface",
      targetBlindSpot = null,
    } = body as {
      cognitiveMap: CognitiveMap;
      calibrationHistory?: Record<string, CalibrationRecord>;
      currentLevel?: DescentLevel;
      targetBlindSpot?: BlindSpotCategory | null;
    };

    if (!cognitiveMap) {
      return NextResponse.json(
        { error: "cognitiveMap is required" },
        { status: 400 },
      );
    }

    const approach = CalibrationEngine.selectApproach(
      cognitiveMap,
      calibrationHistory,
      currentLevel,
      targetBlindSpot,
    );

    const injection = CalibrationEngine.buildCalibrationInjection(
      approach,
      cognitiveMap,
    );

    await logProtocolUsage(auth.partnerId!, "calibrate", {
      currentLevel,
      approach,
    });

    return NextResponse.json({
      recommendedApproach: approach,
      promptInjection: injection,
      reasoning: {
        cognitiveFactors: {
          intellectualizer: cognitiveMap?.intellectualizer,
          depthTolerance: cognitiveMap?.depthTolerance,
          confrontationResponse: cognitiveMap?.confrontationResponse,
          primaryDefense: cognitiveMap?.primaryDefense,
        },
        level: currentLevel,
        targetBlindSpot,
      },
    });
  } catch (e) {
    console.error("[MirrorProtocol] Calibrate error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ROUTE HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ endpoint: string }> },
): Promise<NextResponse> {
  const { endpoint } = await params;

  switch (endpoint) {
    case "reflect":
      return handleReflect(request);
    case "analyze":
      return handleAnalyze(request);
    case "onboard":
      return handleOnboardPost(request);
    case "calibrate":
      return handleCalibrate(request);
    default:
      return NextResponse.json(
        {
          error: "Unknown endpoint",
          availableEndpoints: {
            POST: ["reflect", "analyze", "onboard", "calibrate"],
            GET: ["onboard", "insights"],
          },
        },
        { status: 404 },
      );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ endpoint: string }> },
): Promise<NextResponse> {
  const { endpoint } = await params;

  switch (endpoint) {
    case "insights":
      return handleInsights(request);
    case "onboard":
      return handleOnboardGet(request);
    default:
      return NextResponse.json(
        {
          error: "Unknown endpoint",
          availableEndpoints: {
            POST: ["reflect", "analyze", "onboard", "calibrate"],
            GET: ["onboard", "insights"],
          },
        },
        { status: 404 },
      );
  }
}
