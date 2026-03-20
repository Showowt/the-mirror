import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { PROMPT_L1, PROMPT_L2, PROMPT_L3, PROMPT_CARD } from "@/lib/prompts";

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 60; // requests per minute
const RATE_WINDOW = 60000;

function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : "unknown";
}

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

const PROMPTS: Record<string, string> = {
  l1: PROMPT_L1,
  l2: PROMPT_L2,
  l3: PROMPT_L3,
  card: PROMPT_CARD,
};

export async function POST(request: NextRequest) {
  try {
    const rateLimitKey = getRateLimitKey(request);
    if (!checkRateLimit(rateLimitKey)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429 },
      );
    }

    const body = await request.json();
    const { level, content } = body;

    if (!level || !content || typeof content !== "string") {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const systemPrompt = PROMPTS[level];
    if (!systemPrompt) {
      return NextResponse.json(
        { error: "Invalid descent level." },
        { status: 400 },
      );
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length < 10) {
      return NextResponse.json(
        { error: "Say a little more." },
        { status: 400 },
      );
    }

    if (trimmedContent.length > 5000) {
      return NextResponse.json(
        { error: "Too much. Distill it." },
        { status: 400 },
      );
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: trimmedContent,
        },
      ],
    });

    const textContent = response.content[0];
    if (textContent.type !== "text") {
      throw new Error("Unexpected response format");
    }

    const result = textContent.text.trim();

    // For card level, try to parse JSON
    if (level === "card") {
      try {
        const cleaned = result.replace(/```json|```/g, "").trim();
        const cardData = JSON.parse(cleaned);
        return NextResponse.json({ result: cardData, type: "card" });
      } catch {
        // Return raw text if JSON parsing fails
        return NextResponse.json({ result, type: "text" });
      }
    }

    return NextResponse.json({ result, type: "text" });
  } catch (error) {
    console.error("[Mirror API Error]", error);

    if (error instanceof Anthropic.APIError) {
      if (error.status === 401) {
        return NextResponse.json(
          { error: "Configuration error." },
          { status: 500 },
        );
      }
      if (error.status === 429) {
        return NextResponse.json(
          { error: "The mirror is overwhelmed. Try again shortly." },
          { status: 503 },
        );
      }
    }

    return NextResponse.json(
      { error: "The reflection broke. Try again." },
      { status: 500 },
    );
  }
}
