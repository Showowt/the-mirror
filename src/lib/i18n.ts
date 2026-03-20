// ═══════════════════════════════════════════════════════════════
// THE MIRROR v2 — i18n — COMPLETE TRANSLATIONS
// English & Spanish (Colombian/Latin American)
// ═══════════════════════════════════════════════════════════════

import type { Lang, Translations } from "./types";

export const T: Record<Lang, Translations> = {
  en: {
    // Landing
    title: "The Mirror",
    tagline: "Tell me what you're carrying right now.",
    tagSub: "I won't help you. I'll show you what you can't see.",
    beginDescent: "Begin a descent",
    theVault: "The Vault",
    cards: "cards",
    card: "card",

    // Input
    promptL1: "What's the situation, the decision, the thing weighing on you?",
    promptL1Sub: "Don't organize it. Don't make it make sense. Just say it.",
    placeholder: "Start typing...",
    submitBtn: "Show me what I can't see",
    sayMore: "Say a little more...",

    // Processing
    procL1: [
      "Reading between your words",
      "Finding the shape of your perspective",
      "Locating the blind spot",
    ],
    procL2: [
      "Reading your answer",
      "Tracing the pattern underneath",
      "Seeing what the words reveal",
    ],
    procL3: [
      "Going deeper",
      "Finding what created the blind spot",
      "Reaching the foundation",
    ],
    procCard: [
      "Crystallizing the descent",
      "Forging your Mirror Card",
      "Capturing what was seen",
    ],

    // Question
    answerThis: "Answer this question",
    thatsEnough: "That's enough",
    levelLabel: "Descent level",
    level1: "Level 1 — The Question",
    level2: "Level 2 — The Observation",
    level3: "Level 3 — The Deeper Question",

    // Answer
    questionWas: "The question was:",
    answerIt:
      "Answer it. Don't explain your situation more. Answer the question.",
    answerPlaceholder: "Your answer...",
    goDeeper: "Go deeper",

    // Observation
    mirrorSees: "The Mirror sees:",

    // Deeper
    completeDescent: "Complete the descent",

    // Card
    mirrorCard: "MIRROR CARD",
    cutDeepest: "The question that cut deepest",
    patternRevealed: "The pattern revealed",
    stillUnseen: "What you might still not see",
    newDescent: "New descent",
    openVault: "Open the Vault",
    credit: "The Mirror — MachineMind",

    // Vault
    vaultTitle: "The Vault",
    descents: "descents",
    descent: "descent",
    patterns: "patterns",
    pattern: "pattern",
    identified: "identified",
    noDescents: "No descents yet. Your pattern map builds with each one.",
    back: "Back",
    clearVault: "Clear vault",
    startOver: "Start over",
    vaultCredit: "The Mirror — MachineMind — @showowt",

    // Crisis
    crisisText: "If you're in crisis:",
    crisisLine: "988 Suicide & Crisis Lifeline",
    crisisAction: "call or text 988",
  },
  es: {
    // Landing
    title: "El Espejo",
    tagline: "Dime qué estás cargando en este momento.",
    tagSub: "No voy a ayudarte. Voy a mostrarte lo que no puedes ver.",
    beginDescent: "Comenzar un descenso",
    theVault: "La Bóveda",
    cards: "cartas",
    card: "carta",

    // Input
    promptL1: "¿Cuál es la situación, la decisión, lo que te pesa?",
    promptL1Sub: "No lo organices. No trates de que tenga sentido. Solo dilo.",
    placeholder: "Empieza a escribir...",
    submitBtn: "Muéstrame lo que no puedo ver",
    sayMore: "Dime un poco más...",

    // Processing
    procL1: [
      "Leyendo entre tus palabras",
      "Encontrando la forma de tu perspectiva",
      "Localizando el punto ciego",
    ],
    procL2: [
      "Leyendo tu respuesta",
      "Rastreando el patrón debajo",
      "Viendo lo que las palabras revelan",
    ],
    procL3: [
      "Yendo más profundo",
      "Encontrando lo que creó el punto ciego",
      "Llegando a la base",
    ],
    procCard: [
      "Cristalizando el descenso",
      "Forjando tu Carta del Espejo",
      "Capturando lo que fue visto",
    ],

    // Question
    answerThis: "Responder esta pregunta",
    thatsEnough: "Es suficiente",
    levelLabel: "Nivel de descenso",
    level1: "Nivel 1 — La Pregunta",
    level2: "Nivel 2 — La Observación",
    level3: "Nivel 3 — La Pregunta Profunda",

    // Answer
    questionWas: "La pregunta fue:",
    answerIt:
      "Respóndela. No expliques más tu situación. Responde la pregunta.",
    answerPlaceholder: "Tu respuesta...",
    goDeeper: "Ir más profundo",

    // Observation
    mirrorSees: "El Espejo ve:",

    // Deeper
    completeDescent: "Completar el descenso",

    // Card
    mirrorCard: "CARTA DEL ESPEJO",
    cutDeepest: "La pregunta que caló más hondo",
    patternRevealed: "El patrón revelado",
    stillUnseen: "Lo que quizás aún no puedes ver",
    newDescent: "Nuevo descenso",
    openVault: "Abrir la Bóveda",
    credit: "El Espejo — MachineMind",

    // Vault
    vaultTitle: "La Bóveda",
    descents: "descensos",
    descent: "descenso",
    patterns: "patrones",
    pattern: "patrón",
    identified: "identificados",
    noDescents:
      "Sin descensos aún. Tu mapa de patrones se construye con cada uno.",
    back: "Volver",
    clearVault: "Limpiar bóveda",
    startOver: "Empezar de nuevo",
    vaultCredit: "El Espejo — MachineMind — @showowt",

    // Crisis
    crisisText: "Si estás en crisis:",
    crisisLine: "Línea de la Vida",
    crisisAction: "llama al 800-911-2000",
  },
};

// ═══ Language Detection ═══
export function detectLang(): Lang {
  if (typeof window === "undefined") return "en";
  try {
    const nav = navigator.language || "en";
    return nav.startsWith("es") ? "es" : "en";
  } catch {
    return "en";
  }
}

// ═══ Date Formatting ═══
export function formatDate(
  dateStr: string,
  lang: Lang,
  style: "short" | "long" = "short",
): string {
  const date = new Date(dateStr);
  const locale = lang === "es" ? "es-CO" : "en-US";

  if (style === "short") {
    return date.toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
    });
  }

  return date.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
