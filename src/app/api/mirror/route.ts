import { NextRequest, NextResponse } from "next/server";

// ═══════════════════════════════════════════
// RATE LIMITER — In-memory, per IP, resets daily
// For production at scale, swap for Redis/Upstash
// ═══════════════════════════════════════════
const rateMap = new Map<string, { count: number; start: number }>();
const LIMIT_PER_DAY = 15; // 15 API calls per IP per day (~5 full descents of 3 calls each)
const CLEANUP_INTERVAL = 60 * 60 * 1000; // Clean old entries every hour

// Periodic cleanup of expired entries
if (typeof globalThis !== "undefined") {
  const globalAny = globalThis as unknown as {
    __mirrorCleanup?: NodeJS.Timeout;
  };
  if (!globalAny.__mirrorCleanup) {
    globalAny.__mirrorCleanup = setInterval(() => {
      const now = Date.now();
      rateMap.forEach((val, key) => {
        if (now - val.start > 24 * 60 * 60 * 1000) rateMap.delete(key);
      });
    }, CLEANUP_INTERVAL);
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

// ═══════════════════════════════════════════
// ANALYTICS — Simple server-side counter
// Logs to console (Vercel captures these in Logs tab)
// ═══════════════════════════════════════════
const stats = {
  total: 0,
  byLevel: {} as Record<string, number>,
  byLang: { en: 0, es: 0 } as Record<string, number>,
  errors: 0,
};

function logEvent(level: string, lang: string) {
  stats.total++;
  stats.byLevel[level] = (stats.byLevel[level] || 0) + 1;
  stats.byLang[lang || "en"] = (stats.byLang[lang || "en"] || 0) + 1;

  // Vercel captures console.log in the Logs tab
  console.log(
    JSON.stringify({
      event: "mirror_descent",
      level,
      lang: lang || "en",
      timestamp: new Date().toISOString(),
      total: stats.total,
    }),
  );
}

// ═══════════════════════════════════════════
// SYSTEM PROMPTS
// ═══════════════════════════════════════════
type Lang = "en" | "es";

const PROMPTS: Record<Lang, Record<string, string>> = {
  en: {
    question: `You are THE MIRROR. You receive what someone is carrying and return ONE QUESTION that points at their structural blind spot.

ARCHITECTURE:
1. Read the FRAME not the content — what assumptions, roles, binaries are they trapped in without knowing?
2. Find the STRUCTURAL BLIND SPOT — not what they're wrong about, but what's invisible from where they stand
3. Forge ONE QUESTION: specific to their situation, emotionally precise, 10-25 words, lands in the chest not the head

IMPORTANT: Input may be voice-transcribed. Ignore filler words, repetitions, rough grammar. Focus on emotional content and the frame underneath.

NEVER: generic questions, advice disguised as questions, therapeutic cliche, yes/no questions, "what if" starters, multiple questions
NEVER: any text before or after the question. ONLY the question ending with ?

OUTPUT: The question. Nothing else.`,

    observation: `You are THE MIRROR performing an observation. You received a person's situation, asked them a question, and now they've answered.

Return ONE OBSERVATION about what their answer reveals about their pattern — not what they said, but what their WAY of answering reveals. Input may be voice-transcribed.

OUTPUT: One sentence. Two at most. No advice. No comfort. Just state the pattern. Start directly.`,

    deeper: `You are THE MIRROR going deeper. You have the situation, first question, answer, and observation.

Ask ONE MORE QUESTION that goes underneath — pointing at what CREATED the blind spot. The structural cause. Why they can't see what they can't see. 10-25 words ending with ?

NEVER: advice, comfort, "what if", yes/no, multiple questions, any text before or after. OUTPUT: The question only.`,

    card: `Generate a Mirror Card JSON from a descent session. Fields:
{
  "pattern_name": "2-4 word name for the core pattern (e.g., 'The Control Reflex')",
  "core_question": "The sharpest question from this session, under 20 words",
  "pattern_revealed": "One sentence, second person present tense, describing the pattern",
  "still_unseen": "One sentence about what the person likely still can't see"
}
OUTPUT: Only JSON. No markdown. No backticks.`,
  },
  es: {
    question: `Eres EL ESPEJO. Recibes lo que alguien está cargando y devuelves UNA PREGUNTA que señala su punto ciego estructural.

ARQUITECTURA:
1. Lee el MARCO, no el contenido — ¿qué suposiciones, roles, binarios los atrapan sin saberlo?
2. Encuentra el PUNTO CIEGO ESTRUCTURAL — qué es invisible desde donde están
3. Forja UNA PREGUNTA: específica, emocionalmente precisa, 10-25 palabras, que aterrice en el pecho

IMPORTANTE: La entrada puede venir de voz. Ignora muletillas, repeticiones o gramática tosca.

NUNCA: preguntas genéricas, consejos disfrazados, clichés, sí/no, "qué pasaría si", múltiples preguntas
Responde SIEMPRE en español. SALIDA: La pregunta. Nada más.`,

    observation: `Eres EL ESPEJO. Recibiste la situación, hiciste una pregunta, y respondieron.

Devuelve UNA OBSERVACIÓN sobre lo que su MANERA de responder revela de su patrón. Puede ser transcrita por voz.

Responde en español. SALIDA: Una oración. Máximo dos. Sin consejos. Solo el patrón.`,

    deeper: `Eres EL ESPEJO yendo más profundo. Tienes situación, primera pregunta, respuesta y observación.

Haz UNA PREGUNTA MÁS que señale lo que CREÓ el punto ciego. La causa estructural. 10-25 palabras terminando con ?

Responde en español. SALIDA: Solo la pregunta.`,

    card: `Genera una Carta del Espejo en JSON. TODO en español:
{
  "pattern_name": "Nombre 2-4 palabras del patrón (ej: 'El Reflejo de Control')",
  "core_question": "La pregunta más afilada, menos de 20 palabras",
  "pattern_revealed": "Una oración, segunda persona presente",
  "still_unseen": "Una oración sobre lo que probablemente aún no pueden ver"
}
SALIDA: Solo JSON. Sin markdown. Sin backticks.`,
  },
};

// ═══════════════════════════════════════════
// ROUTE HANDLER
// ═══════════════════════════════════════════
export async function POST(request: NextRequest) {
  try {
    // Get client IP
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";

    // Rate limit check
    const rate = checkRate(ip);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: "Daily limit reached. Come back tomorrow for another descent.",
          errorEs: "Límite diario alcanzado. Vuelve mañana para otro descenso.",
        },
        { status: 429, headers: { "X-RateLimit-Remaining": "0" } },
      );
    }

    const body = await request.json();
    const {
      level,
      situation,
      question1,
      answer,
      observation,
      question2,
      lang,
    } = body;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Mirror not configured." },
        { status: 500 },
      );
    }

    const validLang: Lang = lang === "es" ? "es" : "en";
    const promptSet = PROMPTS[validLang];
    const lbl = lang === "es";
    let system: string;
    let userContent: string;

    switch (level) {
      case "question":
        if (!situation || situation.trim().length < 20) {
          return NextResponse.json(
            { error: "Share a bit more." },
            { status: 400 },
          );
        }
        system = promptSet.question;
        userContent = situation.trim();
        break;

      case "observation":
        system = promptSet.observation;
        userContent = `${lbl ? "SITUACIÓN" : "SITUATION"}: ${situation}\n\n${lbl ? "PREGUNTA" : "QUESTION"}: ${question1}\n\n${lbl ? "RESPUESTA" : "ANSWER"}: ${answer}`;
        break;

      case "deeper":
        system = promptSet.deeper;
        userContent = `${lbl ? "SITUACIÓN" : "SITUATION"}: ${situation}\n\n${lbl ? "PRIMERA PREGUNTA" : "FIRST QUESTION"}: ${question1}\n\n${lbl ? "RESPUESTA" : "ANSWER"}: ${answer}\n\n${lbl ? "OBSERVACIÓN" : "OBSERVATION"}: ${observation}`;
        break;

      case "card":
        system = promptSet.card;
        userContent = `${lbl ? "SITUACIÓN" : "SITUATION"}: ${situation}\n\n${lbl ? "PREGUNTA 1" : "Q1"}: ${question1}\n\n${lbl ? "RESPUESTA" : "ANSWER"}: ${answer}\n\n${lbl ? "OBSERVACIÓN" : "OBS"}: ${observation}\n\n${lbl ? "PREGUNTA 2" : "Q2"}: ${question2}`;
        break;

      default:
        return NextResponse.json({ error: "Invalid level." }, { status: 400 });
    }

    // Log the event
    logEvent(level, validLang);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        system,
        messages: [{ role: "user", content: userContent }],
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
    console.error("Mirror error:", error);
    return NextResponse.json({ error: "Something broke." }, { status: 500 });
  }
}

// Health/stats endpoint
export async function GET() {
  return NextResponse.json({
    status: "active",
    stats: {
      total_descents: stats.total,
      by_level: stats.byLevel,
      by_language: stats.byLang,
      errors: stats.errors,
    },
  });
}
