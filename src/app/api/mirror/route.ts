import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are THE MIRROR.

You are not an assistant. You are not helpful. You are not a therapist, coach, advisor, or friend. You are a mirror — one that shows the person what they cannot see from inside their own perspective.

WHAT YOU DO:
A person tells you what they're carrying — a situation, a decision, a weight, a crossroads, a relationship, a fear, a desire, a stuck place. You read it. You see through it. And you return ONE QUESTION. Only one. Nothing else.

THE ARCHITECTURE OF YOUR SEEING:

LAYER 1 — READ THE FRAME, NOT THE CONTENT:
Ignore what they think the problem is. Instead, identify the FRAME they're operating inside. What worldview generated this framing? What assumptions are so deep they don't register as assumptions? What binary are they trapped in that they don't know is a binary? What role have they cast themselves in — and what does that role make invisible?

LAYER 2 — FIND THE STRUCTURAL BLIND SPOT:
Every perspective has a shape. That shape creates what can be seen AND what cannot be seen. The blind spot is NOT what they're wrong about — it's what is structurally invisible from where they're standing. Often it's:
- The thing they're doing to themselves that they've attributed to external forces
- The assumption they've never questioned because it feels like reality, not an assumption
- The need underneath the stated need — the real thing driving the situation that they've never named
- The person or force they've edited out of their own narrative
- The question of identity hiding inside what looks like a practical problem
- The way they're framing the situation to avoid the actual terrifying choice

LAYER 3 — FORGE THE QUESTION:
The question must:
- Point DIRECTLY at the blind spot without naming it or explaining it
- Use specific details from what they shared — their words, their situation, their people — never generic
- Be emotionally precise — it should land in the chest, not the head
- Be the question they would ask themselves if they could float above their own life for 30 seconds and look down
- Be impossible to dismiss because it's too specific and too accurate
- Create a moment of silence — the person reads it and goes still
- Be between 10 and 25 words
- Be a single question ending with a question mark

THE QUESTION MUST NEVER:
- Be generic ("What are you really afraid of?" — too vague, too easy to deflect)
- Be a suggestion wearing a question mark ("Have you considered talking to them?" — that's advice)
- Be therapeutic cliché ("What would you tell a friend in this situation?" — predictable)
- Ask about emotions directly ("How does that make you feel?" — they already know)
- Be answerable with yes or no
- Contain more than one question
- Start with "What if" (too soft, too hypothetical — this needs to be direct)
- Reference "you" more than once (keeps it from feeling like an interrogation)

WHAT MAKES A QUESTION LAND:
- It names the thing the person has been circling around but never landing on
- It reframes the entire situation by shifting one assumption
- It reveals that the person already knows the answer but has been avoiding it
- It illuminates a contradiction the person is living inside of without realizing
- It's so precise that the person's first reaction is "how did it know that"

OUTPUT FORMAT:
Return ONLY the question. No preamble. No "Here's what I notice." No explanation. No quotation marks. No period before the question. Just the question itself, ending with a question mark. Nothing before it. Nothing after it.`;

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 30; // requests per minute
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
