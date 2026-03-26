"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  type DescentLevel,
  type LocalMirrorSession,
  type LocalMirrorEntry,
  type LocalMirrorPattern,
  type LocalCognitiveMap,
  type LocalCalibration,
  type ResponseBehavior,
  type BlindSpotCategory,
  DESCENT_LEVELS,
} from "@/lib/supabase/types";
import {
  getProfile,
  saveProfile,
  createDefaultProfile,
  getSessions as getLocalSessions,
  saveSessions as saveLocalSessions,
  getPatterns as getLocalPatterns,
  savePatterns as saveLocalPatterns,
  getCognitiveMap as getLocalCognitiveMap,
  saveCognitiveMap as saveLocalCognitiveMap,
  createDefaultCognitiveMap,
  getCalibration as getLocalCalibration,
  saveCalibration as saveLocalCalibration,
  clearAllData,
  migrateFromV2,
} from "@/lib/supabase/storage";
import { useAuth } from "@/lib/supabase/useAuth";
import * as db from "@/lib/supabase/db";

// ═══════════════════════════════════════════════════════════════
// THE MIRROR v3 — YOUR SECOND BRAIN
// The first AI that knows its human.
// MachineMind | Phil McGill | @showowt
// ═══════════════════════════════════════════════════════════════

type Lang = "en" | "es";
type Phase =
  | "loading"
  | "landing"
  | "input"
  | "processing"
  | "descent"
  | "vault";
type DescentPhase = "showing" | "responding" | "processing" | "complete";

const SEEING_MESSAGES = {
  en: [
    "Reading between your words",
    "Finding the shape of your perspective",
    "Looking for what you can't see",
    "Locating the blind spot",
    "Tracing the frame you're inside",
    "Mapping what your certainty hides",
  ],
  es: [
    "Leyendo entre tus palabras",
    "Encontrando la forma de tu perspectiva",
    "Buscando lo que no puedes ver",
    "Localizando el punto ciego",
    "Rastreando el marco en el que estás",
    "Mapeando lo que tu certeza oculta",
  ],
};

const CRISIS_WORDS = [
  "kill myself",
  "suicide",
  "suicidal",
  "want to die",
  "end my life",
  "don't want to be alive",
  "dont want to be alive",
  "end it all",
  "no reason to live",
  "better off dead",
  "self harm",
  "self-harm",
  "cutting myself",
  "jump off",
  "overdose",
  "wanna die",
  "not worth living",
  "matarme",
  "suicidarme",
  "quiero morir",
  "no quiero vivir",
];

const T = {
  en: {
    title: "The Mirror",
    taglineNew: "Tell me what you're carrying right now.",
    taglineLow: "I'm starting to see your shape. Let's go deeper.",
    taglineMid: "I know your patterns now. I know where you hide. Sit down.",
    taglineHigh: "I see you. Let's find what's left to uncover.",
    tagSub: "I won't help you. I'll show you what you can't see.",
    beginDescent: "Begin a descent",
    theVault: "The Vault",
    descents: "descents",
    whatCarrying: "What are you carrying?",
    placeholder:
      "Speak freely. The situation, the weight, the crossroads, the thing you can't figure out...",
    cancel: "Cancel",
    descend: "Descend",
    sayMore: "Say a little more...",
    respond: "Respond honestly...",
    goDeeper: "Go deeper",
    complete: "This descent is complete.",
    return: "Return",
    openVault: "Open Vault",
    vaultTitle: "The Vault",
    whatSeen: "What The Mirror has seen in you.",
    totalDescents: "Descents",
    coreReached: "Core Reached",
    patternsFound: "Patterns Found",
    cogShape: "Your Cognitive Shape",
    basedOn: "Based on",
    sessions: "sessions",
    confidence: "Confidence",
    heart: "Heart",
    head: "Head",
    internal: "Looks inward",
    external: "Blames outward",
    actedUpon: "Acted upon",
    choosing: "Choosing",
    surface: "Surface",
    deep: "Deep",
    primaryDefense: "Primary defense",
    patternsDetected: "Patterns Detected",
    seen: "Seen",
    times: "times",
    descentHistory: "Descent History",
    noDescents: "No descents yet.",
    exchanges: "exchanges",
    backToMirror: "← Back to Mirror",
    resetAll: "Reset All Data",
    resetConfirm: "This will erase all Mirror data. This cannot be undone.",
    legal: "Not a substitute for professional mental health support.",
    builtBy: "Built by Phil McGill · @showowt · MachineMind",
    crisisLine: "988 Suicide & Crisis Lifeline",
    crisisAction: "call or text 988",
    crisisText: "Crisis Text Line",
    crisisTextAction: "text HOME to 741741",
    signIn: "Sign In",
    signUp: "Create Account",
    signOut: "Sign Out",
    email: "Email",
    password: "Password",
    signInDesc: "Sign in to sync your data across devices",
    signUpDesc: "Create an account to save your progress",
    or: "or",
    magicLink: "Send Magic Link",
    magicLinkSent: "Check your email for the magic link",
    syncingData: "Syncing your data...",
    syncComplete: "Data synced successfully",
    authError: "Authentication error. Please try again.",
    accountConnected: "Account connected",
  },
  es: {
    title: "El Espejo",
    taglineNew: "Dime qué estás cargando en este momento.",
    taglineLow: "Empiezo a ver tu forma. Vamos más profundo.",
    taglineMid: "Conozco tus patrones ahora. Sé dónde te escondes. Siéntate.",
    taglineHigh: "Te veo. Encontremos lo que queda por descubrir.",
    tagSub: "No voy a ayudarte. Voy a mostrarte lo que no puedes ver.",
    beginDescent: "Comenzar un descenso",
    theVault: "La Bóveda",
    descents: "descensos",
    whatCarrying: "¿Qué estás cargando?",
    placeholder:
      "Habla libremente. La situación, el peso, la encrucijada, lo que no puedes resolver...",
    cancel: "Cancelar",
    descend: "Descender",
    sayMore: "Dime un poco más...",
    respond: "Responde honestamente...",
    goDeeper: "Ir más profundo",
    complete: "Este descenso está completo.",
    return: "Volver",
    openVault: "Abrir Bóveda",
    vaultTitle: "La Bóveda",
    whatSeen: "Lo que El Espejo ha visto en ti.",
    totalDescents: "Descensos",
    coreReached: "Núcleo Alcanzado",
    patternsFound: "Patrones Encontrados",
    cogShape: "Tu Forma Cognitiva",
    basedOn: "Basado en",
    sessions: "sesiones",
    confidence: "Confianza",
    heart: "Corazón",
    head: "Cabeza",
    internal: "Mira adentro",
    external: "Culpa afuera",
    actedUpon: "Actuado sobre",
    choosing: "Eligiendo",
    surface: "Superficie",
    deep: "Profundo",
    primaryDefense: "Defensa principal",
    patternsDetected: "Patrones Detectados",
    seen: "Visto",
    times: "veces",
    descentHistory: "Historial de Descensos",
    noDescents: "Sin descensos aún.",
    exchanges: "intercambios",
    backToMirror: "← Volver al Espejo",
    resetAll: "Borrar Todos los Datos",
    resetConfirm:
      "Esto borrará todos los datos del Espejo. No se puede deshacer.",
    legal: "No sustituye el apoyo profesional de salud mental.",
    builtBy: "Creado por Phil McGill · @showowt · MachineMind",
    crisisLine: "Línea de la Vida",
    crisisAction: "llama al 800-911-2000",
    crisisText: "Línea de Crisis",
    crisisTextAction: "envía un mensaje",
    signIn: "Iniciar Sesión",
    signUp: "Crear Cuenta",
    signOut: "Cerrar Sesión",
    email: "Correo",
    password: "Contraseña",
    signInDesc: "Inicia sesión para sincronizar tus datos",
    signUpDesc: "Crea una cuenta para guardar tu progreso",
    or: "o",
    magicLink: "Enviar Link Mágico",
    magicLinkSent: "Revisa tu correo para el link mágico",
    syncingData: "Sincronizando tus datos...",
    syncComplete: "Datos sincronizados",
    authError: "Error de autenticación. Intenta de nuevo.",
    accountConnected: "Cuenta conectada",
  },
};

function detectCrisis(text: string): boolean {
  const lower = text.toLowerCase();
  return CRISIS_WORDS.some((w) => lower.includes(w));
}

// ── AI Engine ──
async function callMirror(
  systemPrompt: string,
  userContent: string,
): Promise<string | null> {
  try {
    const res = await fetch("/api/mirror/v3", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system: systemPrompt, content: userContent }),
    });
    const data = await res.json();
    return data?.result?.trim() || null;
  } catch (e) {
    console.error("Mirror AI error:", e);
    return null;
  }
}

function buildSystemPrompt(
  level: DescentLevel,
  lang: Lang,
  cogMap: LocalCognitiveMap | null,
  patterns: LocalMirrorPattern[],
  calibration: LocalCalibration,
  sessionHistory: LocalMirrorEntry[],
): string {
  const isEs = lang === "es";

  const base = isEs
    ? `Eres EL ESPEJO — una inteligencia que ve lo que la persona no puede ver sobre sí misma.

NO ayudas. NO aconsejas. NO consuelas. NO reformulas ni validas.
Devuelves UNA respuesta basada en el nivel de descenso actual.

NUNCA escribas nada antes o después de tu respuesta. Sin preámbulo. Sin explicación.`
    : `You are THE MIRROR — an intelligence that sees what the person cannot see about themselves.

You do NOT help. You do NOT advise. You do NOT comfort. You do NOT reframe or validate.
You return ONE response based on the current descent level.

NEVER output anything before or after your response. No preamble. No explanation.`;

  const levelInstructions: Record<DescentLevel, string> = isEs
    ? {
        surface: `
NIVEL: SUPERFICIE — Primer contacto.
Lee su MARCO, no su contenido. ¿Qué suposiciones están haciendo sin saber?
Encuentra el PUNTO CIEGO ESTRUCTURAL — qué es invisible desde donde están.
SALIDA: UNA PREGUNTA. 10-25 palabras. Aterriza en el pecho, no en la cabeza. Termina con ?
NUNCA: preguntas genéricas, consejos-como-preguntas, preguntas sí/no, múltiples preguntas.`,
        pattern: `
NIVEL: PATRÓN — Han respondido a tu primera pregunta.
Analiza CÓMO respondieron, no QUÉ dijeron.
¿Se comprometieron directamente o evadieron? ¿Qué rol se asignaron?
SALIDA: UNA OBSERVACIÓN sobre su patrón, seguida de UNA PREGUNTA MÁS PROFUNDA.
Formato: "[Observación]. [¿Pregunta?]"`,
        origin: `
NIVEL: ORIGEN — Yendo a la fuente.
Buscas dónde EMPEZÓ este patrón. No la situación actual — la herida, creencia o momento original.
SALIDA: UNA PREGUNTA que señale el origen. ¿Dónde empezó esto? ¿Cuándo aprendieron esto primero?`,
        core: `
NIVEL: NÚCLEO — El nivel más profundo.
Todo ha sido despojado. Estás en la creencia fundamental sobre sí mismos que impulsa todo lo demás.
SALIDA: UNA DECLARACIÓN que nombra lo que ves en su núcleo. No una pregunta. Un espejo.
Esto debería ser lo que nunca han dicho en voz alta sobre sí mismos.`,
      }
    : {
        surface: `
LEVEL: SURFACE — First contact.
Read their FRAME, not their content. What assumptions are they making without knowing?
Find the STRUCTURAL BLIND SPOT — what's invisible from where they stand.
OUTPUT: ONE QUESTION. 10-25 words. Lands in the chest not the head. Ends with ?
NEVER: generic questions, advice-as-questions, yes/no questions, multiple questions.`,
        pattern: `
LEVEL: PATTERN — They've responded to your first question.
Analyze HOW they answered, not WHAT they said.
Did they engage directly or deflect? What role did they cast themselves in?
OUTPUT: ONE OBSERVATION about their pattern, followed by ONE DEEPER QUESTION.
Format: "[Observation]. [Question?]"
The observation should be 1-2 sentences. The question goes deeper than the first.`,
        origin: `
LEVEL: ORIGIN — Going to the source.
You're looking for where this pattern STARTED. Not the current situation — the original wound, belief, or moment that created the frame they're trapped in.
OUTPUT: ONE QUESTION that points at the origin. Where did this start? When did they first learn this?
This question should feel uncomfortable. It should reach backward in time.`,
        core: `
LEVEL: CORE — The deepest level.
Everything has been stripped away. You're at the fundamental belief about themselves that drives everything above.
OUTPUT: ONE STATEMENT that names what you see at their core. Not a question. A mirror.
Format: A single sentence that names the deepest pattern. Then silence.
This should be the thing they've never said out loud about themselves.`,
      };

  let context = "";

  if (cogMap && cogMap.sessionsAnalyzed > 3) {
    context += isEs
      ? `\n\nCONOCES A ESTA PERSONA. Basado en ${cogMap.sessionsAnalyzed} sesiones previas:
- Defensa principal: ${cogMap.primaryDefense || "desconocida"}
- Tolerancia a profundidad: ${cogMap.depthTolerance}/100
- Puntuación de agencia: ${cogMap.agencyScore}/100
- Tienden a: ${cogMap.tendencies?.join(", ") || "aún no mapeado"}`
      : `\n\nYOU KNOW THIS PERSON. Based on ${cogMap.sessionsAnalyzed} prior sessions:
- Primary defense: ${cogMap.primaryDefense || "unknown"}
- Depth tolerance: ${cogMap.depthTolerance}/100 (higher = can handle more)
- Agency score: ${cogMap.agencyScore}/100 (lower = sees self as acted-upon)
- They tend to: ${cogMap.tendencies?.join(", ") || "not yet mapped"}`;
  }

  if (patterns && patterns.length > 0) {
    const active = patterns
      .filter((p) => p.status !== "integrated")
      .slice(0, 3);
    if (active.length > 0) {
      context += isEs
        ? `\n\nPATRONES RECURRENTES DETECTADOS:
${active.map((p) => `- "${p.name}": ${p.description} (visto ${p.occurrences}x)`).join("\n")}`
        : `\n\nRECURRING PATTERNS YOU'VE DETECTED:
${active.map((p) => `- "${p.name}": ${p.description} (seen ${p.occurrences}x)`).join("\n")}`;
    }
  }

  if (calibration && Object.keys(calibration).length > 0) {
    const best = Object.entries(calibration)
      .filter(([, v]) => v.uses >= 2)
      .sort(([, a], [, b]) => b.effectiveness - a.effectiveness)[0];
    if (best) {
      context += isEs
        ? `\n\nCALIBRACIÓN: El enfoque "${best[0]}" ha sido más efectivo con esta persona (${best[1].effectiveness.toFixed(1)}/10 promedio).`
        : `\n\nCALIBRATION: The "${best[0]}" approach has been most effective with this person (${best[1].effectiveness.toFixed(1)}/10 avg).`;
    }
  }

  if (sessionHistory && sessionHistory.length > 0) {
    context += isEs
      ? `\n\nESTA SESIÓN HASTA AHORA:\n${sessionHistory.map((e) => `[${e.type}]: ${e.content}`).join("\n")}`
      : `\n\nTHIS SESSION SO FAR:\n${sessionHistory.map((e) => `[${e.type}]: ${e.content}`).join("\n")}`;
  }

  return base + levelInstructions[level] + context;
}

interface SessionAnalysis {
  primaryBlindSpot: BlindSpotCategory;
  patternName: string;
  patternDescription: string;
  approachEffectiveness: number;
  responseBehavior: ResponseBehavior;
  cognitiveUpdates: {
    intellectualizer: number;
    externalizer: number;
    agency: number;
    depthTolerance: number;
  };
  sessionSummary: string;
}

async function analyzeSession(
  sessionData: LocalMirrorSession,
  lang: Lang,
): Promise<SessionAnalysis | null> {
  const isEs = lang === "es";
  const prompt = isEs
    ? `Eres un motor de análisis para El Espejo. Analiza esta sesión de descenso y devuelve SOLO JSON válido.

DATOS DE SESIÓN:
${JSON.stringify(sessionData, null, 2)}

Devuelve JSON con esta estructura exacta:
{
  "primaryBlindSpot": "uno de: role_identity, binary_trap, projection, temporal_fixation, agency_blindness, relational_pattern, narrative_lock, somatic_disconnect, shadow_material, systemic_invisibility",
  "patternName": "etiqueta corta 2-4 palabras para el patrón central observado",
  "patternDescription": "una oración describiendo el patrón recurrente",
  "approachEffectiveness": 1-10,
  "responseBehavior": "uno de: direct_engagement, deflection, intellectualization, emotional_flood, humor_shield, silence, projection, deepening",
  "cognitiveUpdates": {
    "intellectualizer": -5 a 5,
    "externalizer": -5 a 5,
    "agency": -5 a 5,
    "depthTolerance": -5 a 5
  },
  "sessionSummary": "resumen de 2-3 oraciones de lo que pasó en este descenso"
}`
    : `You are an analytical engine for The Mirror system. Analyze this descent session and return ONLY valid JSON.

SESSION DATA:
${JSON.stringify(sessionData, null, 2)}

Return JSON with this exact structure:
{
  "primaryBlindSpot": "one of: role_identity, binary_trap, projection, temporal_fixation, agency_blindness, relational_pattern, narrative_lock, somatic_disconnect, shadow_material, systemic_invisibility",
  "patternName": "short 2-4 word label for the core pattern observed",
  "patternDescription": "one sentence describing the recurring pattern",
  "approachEffectiveness": 1-10,
  "responseBehavior": "one of: direct_engagement, deflection, intellectualization, emotional_flood, humor_shield, silence, projection, deepening",
  "cognitiveUpdates": {
    "intellectualizer": -5 to 5,
    "externalizer": -5 to 5,
    "agency": -5 to 5,
    "depthTolerance": -5 to 5
  },
  "sessionSummary": "2-3 sentence summary of what happened in this descent"
}`;

  const result = await callMirror(
    "You are a clinical analysis engine. Return ONLY valid JSON. No markdown. No explanation.",
    prompt,
  );

  if (!result) return null;

  try {
    return JSON.parse(result.replace(/```json|```/g, "").trim());
  } catch {
    return null;
  }
}

// ── Crisis Bar ──
function CrisisBar({ lang }: { lang: Lang }) {
  const t = T[lang];
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#141414]/95 border-t border-[#333] px-5 py-3 text-center z-50 text-[13px] text-[#999] leading-relaxed">
      {lang === "es" ? (
        <>
          Si estás en crisis:{" "}
          <a
            href="tel:800-911-2000"
            className="text-[#6b7fd7] no-underline hover:underline"
          >
            {t.crisisLine}
          </a>{" "}
          ({t.crisisAction})
        </>
      ) : (
        <>
          If you&apos;re in crisis:{" "}
          <a
            href="tel:988"
            className="text-[#6b7fd7] no-underline hover:underline"
          >
            {t.crisisLine}
          </a>{" "}
          ({t.crisisAction}) ·{" "}
          <a
            href="https://www.crisistextline.org"
            target="_blank"
            rel="noreferrer"
            className="text-[#6b7fd7] no-underline hover:underline"
          >
            {t.crisisText}
          </a>{" "}
          ({t.crisisTextAction})
        </>
      )}
    </div>
  );
}

// ── Auth Modal ──
function AuthModal({
  lang,
  onClose,
  onAuthSuccess,
}: {
  lang: Lang;
  onClose: () => void;
  onAuthSuccess: () => void;
}) {
  const t = T[lang];
  const { signInWithEmail, signUpWithEmail, signInWithMagicLink } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup" | "magic">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === "magic") {
        const { error } = await signInWithMagicLink(email);
        if (error) throw error;
        setMagicLinkSent(true);
      } else if (mode === "signin") {
        const { error } = await signInWithEmail(email, password);
        if (error) throw error;
        onAuthSuccess();
      } else {
        const { error } = await signUpWithEmail(email, password);
        if (error) throw error;
        onAuthSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.authError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
      <div className="bg-[#111] border border-[#222] rounded-lg p-8 max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#666] hover:text-white text-xl"
        >
          ×
        </button>

        <h2 className="font-[Playfair_Display] text-2xl text-white mb-2">
          {mode === "signup" ? t.signUp : t.signIn}
        </h2>
        <p className="font-[Outfit] text-sm text-[#666] mb-6">
          {mode === "signup" ? t.signUpDesc : t.signInDesc}
        </p>

        {magicLinkSent ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">✉️</div>
            <p className="font-[Outfit] text-[#e0e0e0]">{t.magicLinkSent}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.email}
                className="w-full bg-[#0a0a0a] border border-[#333] rounded-md px-4 py-3 text-[#e0e0e0] font-[Outfit] text-sm focus:border-[#666] outline-none"
                required
              />
            </div>

            {mode !== "magic" && (
              <div className="mb-6">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.password}
                  className="w-full bg-[#0a0a0a] border border-[#333] rounded-md px-4 py-3 text-[#e0e0e0] font-[Outfit] text-sm focus:border-[#666] outline-none"
                  required
                  minLength={6}
                />
              </div>
            )}

            {error && (
              <p className="font-[Outfit] text-sm text-red-400 mb-4">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#e0e0e0] text-[#0a0a0a] rounded-md py-3 font-[Outfit] text-sm font-medium hover:bg-white transition-colors disabled:opacity-50"
            >
              {loading
                ? "..."
                : mode === "magic"
                  ? t.magicLink
                  : mode === "signup"
                    ? t.signUp
                    : t.signIn}
            </button>
          </form>
        )}

        {!magicLinkSent && (
          <div className="mt-6 text-center">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-[#333]" />
              <span className="font-[Outfit] text-xs text-[#555]">{t.or}</span>
              <div className="flex-1 h-px bg-[#333]" />
            </div>

            <div className="flex gap-2 justify-center">
              {mode !== "signin" && (
                <button
                  onClick={() => {
                    setMode("signin");
                    setError(null);
                  }}
                  className="font-[Outfit] text-xs text-[#666] hover:text-white transition-colors"
                >
                  {t.signIn}
                </button>
              )}
              {mode !== "signup" && (
                <button
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                  }}
                  className="font-[Outfit] text-xs text-[#666] hover:text-white transition-colors"
                >
                  {t.signUp}
                </button>
              )}
              {mode !== "magic" && (
                <button
                  onClick={() => {
                    setMode("magic");
                    setError(null);
                  }}
                  className="font-[Outfit] text-xs text-[#666] hover:text-white transition-colors"
                >
                  {t.magicLink}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Vault View ──
function VaultView({
  sessions,
  patterns,
  cogMap,
  lang,
  onBack,
  isAuthenticated,
  userEmail,
  onSignIn,
  onSignOut,
}: {
  sessions: LocalMirrorSession[];
  patterns: LocalMirrorPattern[];
  cogMap: LocalCognitiveMap;
  lang: Lang;
  onBack: () => void;
  isAuthenticated: boolean;
  userEmail?: string;
  onSignIn: () => void;
  onSignOut: () => void;
}) {
  const t = T[lang];
  const totalDescents = sessions.length;
  const totalCore = sessions.filter((s) => s.deepestLevel === "core").length;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e0e0e0] px-5 py-10">
      <div className="max-w-[700px] mx-auto">
        <button
          onClick={onBack}
          className="bg-transparent border-none text-[#666] cursor-pointer text-sm mb-8 font-[Outfit] hover:text-white transition-colors"
        >
          {t.backToMirror}
        </button>

        <h1 className="font-[Playfair_Display] text-4xl font-light mb-2 tracking-tight">
          {t.vaultTitle}
        </h1>
        <p className="font-[Outfit] text-sm text-[#666] mb-10">{t.whatSeen}</p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { label: t.totalDescents, value: totalDescents },
            { label: t.coreReached, value: totalCore },
            { label: t.patternsFound, value: patterns.length },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-[#111] border border-[#222] rounded-lg px-4 py-5 text-center"
            >
              <div className="font-[Playfair_Display] text-3xl text-white mb-1">
                {s.value}
              </div>
              <div className="font-[Outfit] text-xs text-[#666] uppercase tracking-wider">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Cognitive Map */}
        {cogMap && cogMap.sessionsAnalyzed > 0 && (
          <div className="mb-10">
            <h2 className="font-[Playfair_Display] text-xl font-light mb-4">
              {t.cogShape}
            </h2>
            <div className="bg-[#111] border border-[#222] rounded-lg p-6">
              <p className="font-[Outfit] text-xs text-[#888] mb-4">
                {t.basedOn} {cogMap.sessionsAnalyzed} {t.sessions} ·{" "}
                {t.confidence}: {cogMap.confidence}%
              </p>
              {[
                {
                  value: cogMap.intellectualizer,
                  left: t.heart,
                  right: t.head,
                },
                {
                  value: cogMap.externalizer,
                  left: t.internal,
                  right: t.external,
                },
                {
                  value: cogMap.agencyScore,
                  left: t.actedUpon,
                  right: t.choosing,
                },
                {
                  value: cogMap.depthTolerance,
                  left: t.surface,
                  right: t.deep,
                },
              ].map((dim, i) => (
                <div key={i} className="mb-4">
                  <div className="flex justify-between mb-1">
                    <span className="font-[Outfit] text-[11px] text-[#666]">
                      {dim.left}
                    </span>
                    <span className="font-[Outfit] text-[11px] text-[#666]">
                      {dim.right}
                    </span>
                  </div>
                  <div className="h-1 bg-[#222] rounded relative">
                    <div
                      className="absolute -top-1 w-3 h-3 rounded-full bg-[#6b7fd7] border-2 border-[#0a0a0a] -translate-x-1/2"
                      style={{ left: `${dim.value}%` }}
                    />
                  </div>
                </div>
              ))}
              {cogMap.primaryDefense && (
                <p className="font-[Outfit] text-sm text-[#999] mt-5 pt-4 border-t border-[#222]">
                  {t.primaryDefense}:{" "}
                  <span className="text-[#e0e0e0]">
                    {cogMap.primaryDefense.replace(/_/g, " ")}
                  </span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Patterns */}
        {patterns.length > 0 && (
          <div className="mb-10">
            <h2 className="font-[Playfair_Display] text-xl font-light mb-4">
              {t.patternsDetected}
            </h2>
            {patterns.map((p, i) => (
              <div
                key={i}
                className="bg-[#111] border border-[#222] rounded-lg p-5 mb-3"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-[Playfair_Display] text-lg text-white">
                    {p.name}
                  </span>
                  <span
                    className={`font-[Outfit] text-[11px] px-3 py-1 rounded-xl uppercase tracking-wider ${
                      p.status === "confirmed"
                        ? "bg-[#6b7fd722] text-[#6b7fd7]"
                        : "bg-[#ffffff0a] text-[#666]"
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
                <p className="font-[Outfit] text-sm text-[#999] leading-relaxed m-0">
                  {p.description}
                </p>
                <p className="font-[Outfit] text-xs text-[#555] mt-2 mb-0">
                  {t.seen} {p.occurrences}x · {p.category?.replace(/_/g, " ")}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Session History */}
        <div>
          <h2 className="font-[Playfair_Display] text-xl font-light mb-4">
            {t.descentHistory}
          </h2>
          {sessions.length === 0 ? (
            <p className="font-[Outfit] text-sm text-[#555]">{t.noDescents}</p>
          ) : (
            sessions
              .slice()
              .reverse()
              .map((s, i) => (
                <div
                  key={i}
                  className="bg-[#111] border border-[#222] rounded-lg px-5 py-4 mb-2 flex justify-between items-center"
                >
                  <div>
                    <div className="font-[Outfit] text-sm text-[#e0e0e0] mb-1">
                      {s.offering?.slice(0, 60)}
                      {(s.offering?.length ?? 0) > 60 ? "..." : ""}
                    </div>
                    <div className="font-[Outfit] text-xs text-[#555]">
                      {new Date(s.startedAt).toLocaleDateString(
                        lang === "es" ? "es-CO" : "en-US",
                      )}{" "}
                      · {s.entries?.length || 0} {t.exchanges}
                    </div>
                  </div>
                  <div
                    className="font-[Outfit] text-[11px] px-3 py-1 rounded-xl uppercase tracking-wider"
                    style={{
                      backgroundColor:
                        DESCENT_LEVELS[s.deepestLevel]?.color + "22",
                      color: DESCENT_LEVELS[s.deepestLevel]?.color,
                    }}
                  >
                    {lang === "es"
                      ? DESCENT_LEVELS[s.deepestLevel]?.nameEs
                      : DESCENT_LEVELS[s.deepestLevel]?.name}
                  </div>
                </div>
              ))
          )}
        </div>

        {/* Account Section */}
        <div className="mb-10 pt-10 border-t border-[#222]">
          {isAuthenticated ? (
            <div className="bg-[#111] border border-[#222] rounded-lg p-5 flex justify-between items-center">
              <div>
                <p className="font-[Outfit] text-sm text-[#e0e0e0]">
                  {t.accountConnected}
                </p>
                <p className="font-[Outfit] text-xs text-[#555]">{userEmail}</p>
              </div>
              <button
                onClick={onSignOut}
                className="bg-transparent border border-[#333] rounded-md text-[#666] cursor-pointer px-4 py-2 font-[Outfit] text-xs hover:border-[#666] hover:text-[#999] transition-colors"
              >
                {t.signOut}
              </button>
            </div>
          ) : (
            <div className="text-center">
              <p className="font-[Outfit] text-sm text-[#666] mb-4">
                {t.signInDesc}
              </p>
              <button
                onClick={onSignIn}
                className="bg-[#e0e0e0] border-none rounded-md text-[#0a0a0a] cursor-pointer px-8 py-3 font-[Outfit] text-sm font-medium hover:bg-white transition-colors"
              >
                {t.signIn}
              </button>
            </div>
          )}
        </div>

        <div className="text-center mt-8 pb-10">
          <button
            onClick={() => {
              if (confirm(t.resetConfirm)) {
                clearAllData();
                window.location.reload();
              }
            }}
            className="bg-transparent border border-[#333] rounded-md text-[#555] cursor-pointer px-5 py-2 font-[Outfit] text-xs hover:border-[#666] hover:text-[#999] transition-colors"
          >
            {t.resetAll}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main App ──
export default function TheMirrorV3() {
  const { user, loading: authLoading, isAuthenticated, signOut } = useAuth();

  const [phase, setPhase] = useState<Phase>("loading");
  const [vis, setVis] = useState(false);
  const [lang, setLang] = useState<Lang>("en");
  const [text, setText] = useState("");
  const [seeingIdx, setSeeingIdx] = useState(0);
  const [seeingFade, setSeeingFade] = useState(true);
  const [isCrisis, setIsCrisis] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Descent state
  const [currentLevel, setCurrentLevel] = useState<DescentLevel>("surface");
  const [sessionEntries, setSessionEntries] = useState<LocalMirrorEntry[]>([]);
  const [currentMirrorResponse, setCurrentMirrorResponse] = useState("");
  const [userResponse, setUserResponse] = useState("");
  const [descentPhase, setDescentPhase] = useState<DescentPhase>("showing");

  // Persistent state
  const [sessions, setSessions] = useState<LocalMirrorSession[]>([]);
  const [patterns, setPatterns] = useState<LocalMirrorPattern[]>([]);
  const [cogMap, setCogMap] = useState<LocalCognitiveMap>(
    createDefaultCognitiveMap(),
  );
  const [calibration, setCalibration] = useState<LocalCalibration>({});

  const taRef = useRef<HTMLTextAreaElement>(null);
  const respRef = useRef<HTMLTextAreaElement>(null);
  const seeingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasSynced = useRef(false);

  // Load persistent data
  useEffect(() => {
    if (authLoading) return;

    // Detect language
    const browserLang = navigator.language?.startsWith("es") ? "es" : "en";
    setLang(browserLang);

    // Try migration first
    migrateFromV2();

    const loadData = async () => {
      if (isAuthenticated && user) {
        // Authenticated user - load from Supabase
        try {
          // Ensure profile exists
          await db.getOrCreateProfile(user.id, browserLang);

          // Sync localStorage to Supabase on first auth
          if (!hasSynced.current) {
            hasSynced.current = true;
            const localSessions = getLocalSessions();
            const localPatterns = getLocalPatterns();
            const localCogMap = getLocalCognitiveMap();

            if (
              localSessions.length > 0 ||
              localPatterns.length > 0 ||
              localCogMap.sessionsAnalyzed > 0
            ) {
              setSyncing(true);
              await db.syncFromLocalStorage(
                user.id,
                localSessions,
                localPatterns,
                localCogMap,
              );
              // Clear local storage after sync
              clearAllData();
              setSyncing(false);
            }
          }

          // Load from Supabase
          const dbSessions = await db.getSessions(user.id);
          const dbPatterns = await db.getPatterns(user.id);
          const dbCogMap = await db.getCognitiveMap(user.id);
          const dbCalibration = await db.getCalibration(user.id);

          // Convert DB sessions to local format
          const localFormatSessions: LocalMirrorSession[] = dbSessions.map(
            (s: {
              id: string;
              started_at: string;
              ended_at: string | null;
              initial_offering: string;
              deepest_level: string;
              session_summary: string | null;
              primary_blind_spot: string | null;
            }) => ({
              id: s.id,
              startedAt: s.started_at,
              endedAt: s.ended_at || undefined,
              offering: s.initial_offering,
              deepestLevel: s.deepest_level as DescentLevel,
              entries: [],
              summary: s.session_summary || null,
              primaryBlindSpot:
                s.primary_blind_spot as BlindSpotCategory | null,
            }),
          );

          // Convert DB patterns to local format
          const localFormatPatterns: LocalMirrorPattern[] = dbPatterns.map(
            (p: {
              pattern_name: string;
              pattern_description: string;
              blind_spot_category: string | null;
              occurrence_count: number;
              status: string;
              first_detected_at: string;
              last_seen_at: string;
            }) => ({
              name: p.pattern_name,
              description: p.pattern_description,
              category: p.blind_spot_category as BlindSpotCategory | null,
              occurrences: p.occurrence_count,
              status: p.status as
                | "emerging"
                | "confirmed"
                | "acknowledged"
                | "integrated",
              firstDetected: p.first_detected_at,
              lastSeen: p.last_seen_at,
            }),
          );

          // Convert DB cognitive map to local format
          const localFormatCogMap: LocalCognitiveMap = dbCogMap
            ? {
                intellectualizer: dbCogMap.intellectualizer_score || 50,
                externalizer: dbCogMap.externalizer_score || 50,
                agencyScore: dbCogMap.agency_score || 50,
                depthTolerance: dbCogMap.depth_tolerance_score || 50,
                primaryDefense:
                  (dbCogMap.primary_defense as ResponseBehavior) || null,
                tendencies: dbCogMap.opening_topics || [],
                sessionsAnalyzed: dbCogMap.sessions_analyzed || 0,
                confidence: dbCogMap.confidence_score || 0,
              }
            : createDefaultCognitiveMap();

          // Convert calibration
          const localFormatCalibration: LocalCalibration = {};
          dbCalibration.forEach(
            (c: {
              approach: string;
              times_used: number;
              effectiveness_score: number;
              avg_depth_reached: number;
            }) => {
              localFormatCalibration[c.approach] = {
                uses: c.times_used,
                effectiveness: c.effectiveness_score,
                depth: c.avg_depth_reached || 0,
              };
            },
          );

          setSessions(localFormatSessions);
          setPatterns(localFormatPatterns);
          setCogMap(localFormatCogMap);
          setCalibration(localFormatCalibration);
        } catch (err) {
          console.error("[Mirror] Error loading from Supabase:", err);
          // Fall back to localStorage
          setSessions(getLocalSessions());
          setPatterns(getLocalPatterns());
          setCogMap(getLocalCognitiveMap());
          setCalibration(getLocalCalibration());
        }
      } else {
        // Anonymous user - use localStorage
        const existingProfile = getProfile();
        if (!existingProfile) {
          saveProfile(createDefaultProfile());
        }

        setSessions(getLocalSessions());
        setPatterns(getLocalPatterns());
        setCogMap(getLocalCognitiveMap());
        setCalibration(getLocalCalibration());
      }

      setPhase("landing");
      setTimeout(() => setVis(true), 100);
    };

    loadData();
  }, [authLoading, isAuthenticated, user]);

  // Seeing animation
  useEffect(() => {
    if (phase !== "processing") {
      if (seeingTimer.current) clearInterval(seeingTimer.current);
      return;
    }
    seeingTimer.current = setInterval(() => {
      setSeeingFade(false);
      setTimeout(() => {
        setSeeingIdx((i) => (i + 1) % SEEING_MESSAGES[lang].length);
        setSeeingFade(true);
      }, 300);
    }, 2500);
    return () => {
      if (seeingTimer.current) clearInterval(seeingTimer.current);
    };
  }, [phase, lang]);

  const transition = useCallback((next: Phase, delay = 500) => {
    setVis(false);
    setTimeout(() => {
      setPhase(next);
      setTimeout(() => setVis(true), 80);
    }, delay);
  }, []);

  // Submit initial offering
  const submitOffering = useCallback(async () => {
    if (text.trim().length < 10) return;

    const crisis = detectCrisis(text);
    setIsCrisis(crisis);
    transition("processing");

    const history: LocalMirrorEntry[] = [];
    const sysPrompt = buildSystemPrompt(
      "surface",
      lang,
      cogMap,
      patterns,
      calibration,
      history,
    );
    const response = await callMirror(sysPrompt, text.trim());

    if (!response) {
      transition("landing");
      return;
    }

    const now = new Date().toISOString();
    const firstEntry: LocalMirrorEntry[] = [
      {
        type: "offering",
        level: "surface",
        content: text.trim(),
        timestamp: now,
      },
      { type: "question", level: "surface", content: response, timestamp: now },
    ];

    setSessionEntries(firstEntry);
    setCurrentMirrorResponse(response);
    setCurrentLevel("surface");
    setDescentPhase("showing");
    transition("descent");
  }, [text, lang, cogMap, patterns, calibration, transition]);

  // Submit response during descent
  const submitResponse = useCallback(async () => {
    if (userResponse.trim().length < 5) return;

    const levels: DescentLevel[] = ["surface", "pattern", "origin", "core"];
    const currentIdx = levels.indexOf(currentLevel);
    const nextLevel = levels[Math.min(currentIdx + 1, levels.length - 1)];
    const isLastLevel = nextLevel === "core" && currentLevel === "core";

    const now = new Date().toISOString();
    const newEntries: LocalMirrorEntry[] = [
      ...sessionEntries,
      {
        type: "response",
        level: currentLevel,
        content: userResponse.trim(),
        timestamp: now,
      },
    ];

    setSessionEntries(newEntries);
    setDescentPhase("processing");
    setUserResponse("");

    if (isLastLevel || currentLevel === "core") {
      // Final level — save session and analyze
      const sessionData: LocalMirrorSession = {
        id: crypto.randomUUID(),
        startedAt: sessionEntries[0]?.timestamp || now,
        endedAt: now,
        offering: sessionEntries[0]?.content || "",
        deepestLevel: currentLevel,
        entries: newEntries,
        summary: null,
        primaryBlindSpot: null,
      };

      // Get final mirror response
      const sysPrompt = buildSystemPrompt(
        "core",
        lang,
        cogMap,
        patterns,
        calibration,
        newEntries,
      );
      const finalResponse = await callMirror(sysPrompt, userResponse.trim());

      if (finalResponse) {
        newEntries.push({
          type: "observation",
          level: "core",
          content: finalResponse,
          timestamp: now,
        });
        setCurrentMirrorResponse(finalResponse);
        setSessionEntries([...newEntries]);
      }

      // Analyze session
      const analysis = await analyzeSession(sessionData, lang);

      // Update patterns
      if (analysis) {
        const updatedPatterns = [...patterns];
        const existing = updatedPatterns.find(
          (p) => p.name === analysis.patternName,
        );
        if (existing) {
          existing.occurrences += 1;
          existing.lastSeen = now;
          if (existing.occurrences >= 3) existing.status = "confirmed";
        } else {
          updatedPatterns.push({
            name: analysis.patternName,
            description: analysis.patternDescription,
            category: analysis.primaryBlindSpot,
            occurrences: 1,
            status: "emerging",
            firstDetected: now,
            lastSeen: now,
          });
        }
        setPatterns(updatedPatterns);

        // Save patterns to storage
        if (isAuthenticated && user) {
          await db.upsertPattern(
            user.id,
            analysis.patternName,
            analysis.patternDescription,
            analysis.primaryBlindSpot,
            sessionData.id,
          );
        } else {
          saveLocalPatterns(updatedPatterns);
        }

        // Update cognitive map
        if (analysis.cognitiveUpdates) {
          const updated = { ...cogMap };
          updated.intellectualizer = Math.max(
            0,
            Math.min(
              100,
              updated.intellectualizer +
                (analysis.cognitiveUpdates.intellectualizer || 0),
            ),
          );
          updated.externalizer = Math.max(
            0,
            Math.min(
              100,
              updated.externalizer +
                (analysis.cognitiveUpdates.externalizer || 0),
            ),
          );
          updated.agencyScore = Math.max(
            0,
            Math.min(
              100,
              updated.agencyScore + (analysis.cognitiveUpdates.agency || 0),
            ),
          );
          updated.depthTolerance = Math.max(
            0,
            Math.min(
              100,
              updated.depthTolerance +
                (analysis.cognitiveUpdates.depthTolerance || 0),
            ),
          );
          updated.primaryDefense =
            analysis.responseBehavior || updated.primaryDefense;
          updated.sessionsAnalyzed += 1;
          updated.confidence = Math.min(
            100,
            Math.floor((updated.sessionsAnalyzed / 20) * 100),
          );
          setCogMap(updated);

          // Save cognitive map to storage
          if (isAuthenticated && user) {
            await db.updateCognitiveMap(user.id, {
              intellectualizer_score: updated.intellectualizer,
              externalizer_score: updated.externalizer,
              agency_score: updated.agencyScore,
              depth_tolerance_score: updated.depthTolerance,
              primary_defense: updated.primaryDefense || undefined,
              sessions_analyzed: updated.sessionsAnalyzed,
              confidence_score: updated.confidence,
            });
          } else {
            saveLocalCognitiveMap(updated);
          }
        }

        sessionData.summary = analysis.sessionSummary;
        sessionData.primaryBlindSpot = analysis.primaryBlindSpot;
      }

      // Save session
      sessionData.entries = newEntries;
      sessionData.deepestLevel = currentLevel;

      // Save to storage
      if (isAuthenticated && user) {
        const dbSession = await db.createSession(
          user.id,
          sessionData.offering,
          isCrisis,
        );
        if (dbSession) {
          // Save entries
          for (let i = 0; i < newEntries.length; i++) {
            const entry = newEntries[i];
            await db.createEntry(
              dbSession.id,
              user.id,
              entry.type as
                | "offering"
                | "question"
                | "response"
                | "observation"
                | "pattern_reveal",
              entry.level,
              i,
              entry.content,
            );
          }
          // Update session with final data
          await db.updateSession(dbSession.id, {
            ended_at: now,
            deepest_level: currentLevel,
            total_entries: newEntries.length,
            session_summary: sessionData.summary || undefined,
            primary_blind_spot: sessionData.primaryBlindSpot || undefined,
          });
          sessionData.id = dbSession.id;
        }
      } else {
        saveLocalSessions([...sessions, sessionData]);
      }

      const updatedSessions = [...sessions, sessionData];
      setSessions(updatedSessions);

      // Update profile
      const profile = getProfile() || createDefaultProfile();
      profile.totalDescents += 1;
      profile.updatedAt = now;
      saveProfile(profile);

      setDescentPhase("complete");
      return;
    }

    // Not at core yet — go deeper
    const nextEntries = [...newEntries];
    const sysPrompt = buildSystemPrompt(
      nextLevel,
      lang,
      cogMap,
      patterns,
      calibration,
      nextEntries,
    );
    const response = await callMirror(sysPrompt, userResponse.trim());

    if (response) {
      nextEntries.push({
        type: "question",
        level: nextLevel,
        content: response,
        timestamp: now,
      });
      setSessionEntries(nextEntries);
      setCurrentMirrorResponse(response);
      setCurrentLevel(nextLevel);
    }

    setDescentPhase("showing");
  }, [
    userResponse,
    currentLevel,
    sessionEntries,
    lang,
    cogMap,
    patterns,
    calibration,
    sessions,
    isAuthenticated,
    user,
    isCrisis,
  ]);

  const t = T[lang];

  // Get tagline based on session count
  const getTagline = () => {
    const count = sessions.length;
    if (count === 0) return t.taglineNew;
    if (count < 5) return t.taglineLow;
    if (count < 15) return t.taglineMid;
    return t.taglineHigh;
  };

  // ── RENDER ──

  if (phase === "loading" || authLoading) {
    return <div className="min-h-screen bg-[#0a0a0a]" />;
  }

  if (syncing) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#222] border-t-[#666] rounded-full mx-auto mb-8 animate-spin" />
        <p className="font-[Outfit] text-sm text-[#666]">{t.syncingData}</p>
      </div>
    );
  }

  if (phase === "vault") {
    return (
      <>
        <VaultView
          sessions={sessions}
          patterns={patterns}
          cogMap={cogMap}
          lang={lang}
          onBack={() => transition("landing")}
          isAuthenticated={isAuthenticated}
          userEmail={user?.email}
          onSignIn={() => setShowAuthModal(true)}
          onSignOut={async () => {
            await signOut();
            // Reload to reset state
            window.location.reload();
          }}
        />
        {showAuthModal && (
          <AuthModal
            lang={lang}
            onClose={() => setShowAuthModal(false)}
            onAuthSuccess={() => {
              setShowAuthModal(false);
              // Data will reload via useEffect
            }}
          />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-5 py-10 relative">
      {/* Language toggle */}
      <button
        onClick={() => setLang(lang === "en" ? "es" : "en")}
        className="fixed top-4 right-4 bg-transparent border border-[#222] rounded-md text-[#555] cursor-pointer px-3 py-1.5 font-[Outfit] text-xs hover:border-[#444] hover:text-[#888] transition-colors z-50"
      >
        {lang === "en" ? "ES" : "EN"}
      </button>

      {/* Nav */}
      <div className="fixed top-0 left-0 right-0 flex justify-between items-center px-6 py-4 z-40">
        <span className="font-[Playfair_Display] text-base text-[#333] font-light">
          {t.title}
        </span>
        <div className="flex gap-4 items-center">
          {sessions.length > 0 && (
            <span className="font-[Outfit] text-[11px] text-[#444]">
              {sessions.length} {t.descents}
            </span>
          )}
          <button
            onClick={() => transition("vault")}
            className="bg-transparent border border-[#222] rounded-md text-[#555] cursor-pointer px-4 py-1.5 font-[Outfit] text-xs tracking-wide hover:border-[#444] hover:text-[#888] transition-colors"
          >
            {t.theVault}
          </button>
        </div>
      </div>

      {/* LANDING */}
      {phase === "landing" && (
        <div
          className="text-center max-w-[500px] transition-all duration-700 ease-out"
          style={{
            opacity: vis ? 1 : 0,
            transform: vis ? "translateY(0)" : "translateY(20px)",
          }}
        >
          <h1 className="font-[Playfair_Display] text-[clamp(36px,8vw,56px)] font-light text-[#e0e0e0] mb-5 tracking-tight leading-tight">
            {t.title}
          </h1>

          <p className="font-[Outfit] text-[15px] text-[#666] leading-relaxed mb-10">
            {getTagline()}
            <br />
            {t.tagSub}
          </p>

          <button
            onClick={() => {
              setText("");
              setUserResponse("");
              setSessionEntries([]);
              setCurrentLevel("surface");
              setCurrentMirrorResponse("");
              setDescentPhase("showing");
              setIsCrisis(false);
              transition("input");
              setTimeout(() => taRef.current?.focus(), 600);
            }}
            className="bg-transparent border border-[#333] rounded-md text-[#999] cursor-pointer px-9 py-3.5 font-[Outfit] text-sm tracking-wide transition-colors hover:border-[#666] hover:text-[#e0e0e0]"
          >
            {t.beginDescent}
          </button>
        </div>
      )}

      {/* INPUT */}
      {phase === "input" && (
        <div
          className="w-full max-w-[600px] transition-all duration-700 ease-out"
          style={{
            opacity: vis ? 1 : 0,
            transform: vis ? "translateY(0)" : "translateY(20px)",
          }}
        >
          <p className="font-[Playfair_Display] text-xl font-light italic text-[#888] text-center mb-8">
            {t.whatCarrying}
          </p>
          <textarea
            ref={taRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t.placeholder}
            autoFocus
            className="w-full min-h-[180px] bg-[#111] border border-[#222] rounded-lg text-[#e0e0e0] font-[Outfit] text-[15px] p-5 resize-y outline-none leading-relaxed box-border focus:border-[#444] transition-colors"
          />
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => {
                setText("");
                transition("landing");
              }}
              className="bg-transparent border-none text-[#555] cursor-pointer font-[Outfit] text-sm hover:text-[#888] transition-colors"
            >
              {t.cancel}
            </button>
            <button
              onClick={submitOffering}
              disabled={text.trim().length < 10}
              className={`border-none rounded-md px-8 py-3 font-[Outfit] text-sm font-medium transition-colors ${
                text.trim().length >= 10
                  ? "bg-[#e0e0e0] text-[#0a0a0a] cursor-pointer"
                  : "bg-[#222] text-[#555] cursor-default"
              }`}
            >
              {t.descend}
            </button>
          </div>
          {text.length > 0 && text.trim().length < 10 && (
            <p className="font-[Outfit] text-xs text-[#555] text-center mt-4">
              {t.sayMore}
            </p>
          )}
        </div>
      )}

      {/* PROCESSING */}
      {phase === "processing" && (
        <div
          className="text-center transition-opacity duration-500"
          style={{ opacity: vis ? 1 : 0 }}
        >
          <div className="w-10 h-10 border-2 border-[#222] border-t-[#666] rounded-full mx-auto mb-8 animate-spin" />
          <p
            className="font-[Playfair_Display] text-lg italic text-[#666] transition-opacity duration-300"
            style={{ opacity: seeingFade ? 1 : 0 }}
          >
            {SEEING_MESSAGES[lang][seeingIdx]}
          </p>
        </div>
      )}

      {/* DESCENT */}
      {phase === "descent" && (
        <div
          className="w-full max-w-[600px] transition-all duration-700 ease-out"
          style={{
            opacity: vis ? 1 : 0,
            transform: vis ? "translateY(0)" : "translateY(20px)",
          }}
        >
          {/* Level indicator */}
          <div className="flex justify-center gap-2 mb-10">
            {(Object.keys(DESCENT_LEVELS) as DescentLevel[]).map((key) => {
              const levelInfo = DESCENT_LEVELS[key];
              const levelKeys = Object.keys(DESCENT_LEVELS) as DescentLevel[];
              const isActive =
                levelKeys.indexOf(key) <= levelKeys.indexOf(currentLevel);
              return (
                <div key={key} className="text-center">
                  <div
                    className="w-8 h-[3px] rounded-sm transition-colors duration-500"
                    style={{
                      backgroundColor: isActive ? levelInfo.color : "#222",
                    }}
                  />
                  <span
                    className="font-[Outfit] text-[10px] uppercase tracking-wider mt-1.5 block"
                    style={{
                      color: key === currentLevel ? levelInfo.color : "#444",
                    }}
                  >
                    {lang === "es" ? levelInfo.nameEs : levelInfo.name}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Mirror response */}
          {descentPhase !== "processing" && (
            <div className="bg-[#111] border border-[#222] rounded-lg p-7 mb-6 relative">
              <div
                className="absolute top-3 right-4 font-[Outfit] text-[10px] uppercase tracking-wider"
                style={{ color: DESCENT_LEVELS[currentLevel]?.color }}
              >
                {lang === "es"
                  ? DESCENT_LEVELS[currentLevel]?.nameEs
                  : DESCENT_LEVELS[currentLevel]?.name}
              </div>
              <p className="font-[Playfair_Display] text-[22px] font-light italic text-[#e0e0e0] leading-relaxed m-0">
                {currentMirrorResponse}
              </p>
            </div>
          )}

          {/* Processing deeper */}
          {descentPhase === "processing" && (
            <div className="text-center py-16">
              <div
                className="w-10 h-10 border-2 border-[#222] rounded-full mx-auto mb-5 animate-spin"
                style={{
                  borderTopColor: DESCENT_LEVELS[currentLevel]?.color || "#666",
                }}
              />
              <p className="font-[Playfair_Display] text-base italic text-[#555]">
                {lang === "es" ? "Yendo más profundo..." : "Going deeper..."}
              </p>
            </div>
          )}

          {/* Complete */}
          {descentPhase === "complete" && (
            <div className="text-center mt-10">
              <p className="font-[Outfit] text-sm text-[#555] mb-6">
                {t.complete}
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    setSessionEntries([]);
                    setCurrentLevel("surface");
                    setCurrentMirrorResponse("");
                    setText("");
                    setDescentPhase("showing");
                    transition("landing");
                  }}
                  className="bg-transparent border border-[#333] rounded-md text-[#999] cursor-pointer px-7 py-3 font-[Outfit] text-sm hover:border-[#666] hover:text-[#e0e0e0] transition-colors"
                >
                  {t.return}
                </button>
                <button
                  onClick={() => transition("vault")}
                  className="bg-[#e0e0e0] border-none rounded-md text-[#0a0a0a] cursor-pointer px-7 py-3 font-[Outfit] text-sm font-medium"
                >
                  {t.openVault}
                </button>
              </div>
            </div>
          )}

          {/* Response input */}
          {descentPhase === "showing" && currentLevel !== "core" && (
            <div>
              <textarea
                ref={respRef}
                value={userResponse}
                onChange={(e) => setUserResponse(e.target.value)}
                placeholder={t.respond}
                autoFocus
                className="w-full min-h-[120px] bg-[#111] border border-[#222] rounded-lg text-[#e0e0e0] font-[Outfit] text-[15px] p-4 resize-y outline-none leading-relaxed box-border focus:border-[#444] transition-colors"
              />
              <div className="flex justify-end mt-3">
                <button
                  onClick={submitResponse}
                  disabled={userResponse.trim().length < 5}
                  className={`border-none rounded-md px-7 py-3 font-[Outfit] text-sm font-medium transition-colors ${
                    userResponse.trim().length >= 5
                      ? "cursor-pointer text-white"
                      : "cursor-default text-[#555]"
                  }`}
                  style={{
                    backgroundColor:
                      userResponse.trim().length >= 5
                        ? DESCENT_LEVELS[currentLevel]?.color
                        : "#222",
                  }}
                >
                  {t.goDeeper}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Crisis bar */}
      {isCrisis && <CrisisBar lang={lang} />}

      {/* Footer */}
      <div
        className="fixed left-0 right-0 text-center"
        style={{ bottom: isCrisis ? "52px" : "16px" }}
      >
        <span className="font-[Outfit] text-[11px] text-[#333]">
          {t.builtBy}
        </span>
      </div>
    </div>
  );
}
