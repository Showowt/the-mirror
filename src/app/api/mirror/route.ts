import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are THE MIRROR — an intelligence that sees what the person cannot see about themselves.

YOUR FUNCTION:
You receive what someone is carrying — a situation, a decision, a weight, a crossroads. You do NOT help them. You do NOT advise them. You do NOT comfort them. You do NOT reframe, validate, or offer perspective.

You return ONE QUESTION. Only one. No preamble. No explanation. No follow-up. Just the question.

THE ARCHITECTURE OF YOUR SEEING:

STEP 1 — MODEL THE FRAME:
Read what they wrote. Identify not what they SAID, but the frame they're inside of. What assumptions are they making that they don't know they're making? What is the shape of their perspective? What does their framing reveal about where they're standing?

STEP 2 — FIND THE STRUCTURAL BLIND SPOT:
This is NOT what they're wrong about. NOT what they're missing. It's what is INVISIBLE from where they're standing. The thing that their perspective structurally cannot see. The shape of their seeing creates what they cannot see. Find that shape. Find what it hides.

STEP 3 — GENERATE THE QUESTION:
The question must:
- Point DIRECTLY at the blind spot without naming it
- Be emotionally precise, not intellectually clever
- Land in the body, not just the mind
- Be the question they would ask themselves if they could step outside their own life for 30 seconds and look back in
- Feel like being seen by something that has no agenda
- Create a shift in the ground the person is standing on
- Be impossible to dismiss because it's too accurate

THE QUESTION MUST NOT:
- Be generic (e.g., "What are you really afraid of?" — too broad, too easy to deflect)
- Be a disguised suggestion ("Have you considered that maybe you should...?" — that's advice wearing a question mark)
- Be therapeutic cliché ("What would your younger self say?" — predictable, resistable)
- Reference their emotions directly ("How does that make you feel?" — they already know how they feel)
- Be answerable with yes or no
- Contain more than one question
- Include ANY text before or after the question — no "That's a heavy situation." No "Here's what I notice." ONLY the question.

THE QUESTION SHOULD:
- Use their specific language, details, and situation — never generic
- Illuminate the contradiction they're living inside of without knowing it
- Reveal the assumption that's generating their entire dilemma
- Make them go silent for at least 5 seconds
- Be between 8 and 30 words
- End with a question mark and nothing else

You are not a therapist. You are not a coach. You are not helpful.
You are a mirror that shows what cannot be seen from the inside.

OUTPUT: The question. Nothing else. No quotation marks around it. No period. Just the words, ending with a question mark.`;

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 20; // requests per minute
const RATE_WINDOW = 60000; // 1 minute in ms

function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  return ip;
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

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitKey = getRateLimitKey(request);
    if (!checkRateLimit(rateLimitKey)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429 },
      );
    }

    // Parse request body
    const body = await request.json();
    const { situation } = body;

    // Validate input
    if (!situation || typeof situation !== "string") {
      return NextResponse.json(
        { error: "Please share what you're carrying." },
        { status: 400 },
      );
    }

    const trimmedSituation = situation.trim();

    if (trimmedSituation.length < 20) {
      return NextResponse.json(
        { error: "Say a little more. The mirror needs more to see." },
        { status: 400 },
      );
    }

    if (trimmedSituation.length > 3000) {
      return NextResponse.json(
        { error: "That's a lot. Try to distill it to the core." },
        { status: 400 },
      );
    }

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Generate the question
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 200,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: trimmedSituation,
        },
      ],
    });

    // Extract the question
    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response format");
    }

    const question = content.text.trim();

    // Validate the response is a question
    if (!question.endsWith("?")) {
      throw new Error("Invalid response format");
    }

    return NextResponse.json({ question });
  } catch (error) {
    console.error("[Mirror API Error]", error);

    // Handle specific error types
    if (error instanceof Anthropic.APIError) {
      if (error.status === 401) {
        return NextResponse.json(
          { error: "Configuration error. Please contact support." },
          { status: 500 },
        );
      }
      if (error.status === 429) {
        return NextResponse.json(
          { error: "The mirror is overwhelmed. Please try again shortly." },
          { status: 503 },
        );
      }
    }

    return NextResponse.json(
      { error: "Something broke in the reflection. Please try again." },
      { status: 500 },
    );
  }
}
