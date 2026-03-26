import { NextRequest, NextResponse } from "next/server";

// ═══════════════════════════════════════════════════════════════
// THE MIRROR v3 — API ROUTE
// Flexible endpoint for v3 component
// ═══════════════════════════════════════════════════════════════

// Rate limiter
const rateMap = new Map<string, { count: number; start: number }>();
const LIMIT_PER_DAY = 50; // Increased for v3 multi-turn sessions

if (typeof globalThis !== "undefined") {
  const globalAny = globalThis as unknown as {
    __mirrorV3Cleanup?: NodeJS.Timeout;
  };
  if (!globalAny.__mirrorV3Cleanup) {
    globalAny.__mirrorV3Cleanup = setInterval(
      () => {
        const now = Date.now();
        rateMap.forEach((val, key) => {
          if (now - val.start > 24 * 60 * 60 * 1000) rateMap.delete(key);
        });
      },
      60 * 60 * 1000,
    );
  }
}

function checkRate(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateMap.get(ip);

  if (!entry || now - entry.start > 24 * 60 * 60 * 1000) {
    rateMap.set(ip, { count: 1, start: now });
    return { allowed: true, remaining: LIMIT_PER_DAY - 1 };
  }

  if (entry.count >= LIMIT_PER_DAY) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: LIMIT_PER_DAY - entry.count };
}

// Analytics
const stats = {
  total: 0,
  errors: 0,
};

export async function POST(request: NextRequest) {
  try {
    // Get client IP
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";

    // Rate limit check
    const rate = checkRate(ip);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Daily limit reached. Come back tomorrow." },
        { status: 429, headers: { "X-RateLimit-Remaining": "0" } },
      );
    }

    const body = await request.json();
    const { system, content } = body;

    if (!system || !content) {
      return NextResponse.json(
        { error: "Missing system prompt or content." },
        { status: 400 },
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Mirror not configured." },
        { status: 500 },
      );
    }

    stats.total++;

    // Log for analytics
    console.log(
      JSON.stringify({
        event: "mirror_v3_call",
        timestamp: new Date().toISOString(),
        total: stats.total,
        ip_hash: ip.slice(0, 8),
      }),
    );

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
        system,
        messages: [{ role: "user", content }],
      }),
    });

    if (!response.ok) {
      stats.errors++;
      console.error("Anthropic error:", response.status);
      return NextResponse.json(
        { error: "Mirror couldn't focus." },
        { status: 502 },
      );
    }

    const data = await response.json();
    const result = data?.content?.[0]?.text?.trim();

    if (!result) {
      return NextResponse.json(
        { error: "Nothing reflected." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { result },
      { headers: { "X-RateLimit-Remaining": String(rate.remaining) } },
    );
  } catch (error) {
    stats.errors++;
    console.error("Mirror v3 error:", error);
    return NextResponse.json({ error: "Something broke." }, { status: 500 });
  }
}

// Health endpoint
export async function GET() {
  return NextResponse.json({
    status: "active",
    version: "v3",
    stats: {
      total_calls: stats.total,
      errors: stats.errors,
    },
  });
}
