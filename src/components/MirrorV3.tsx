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
  clearAllData,
  migrateFromV2,
  getLanguage,
  saveLanguage,
} from "@/lib/supabase/storage";
import { useAuth } from "@/lib/supabase/useAuth";
import { useWhisperVoice } from "@/lib/useWhisperVoice";
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
    "Listening for what you didn't say",
    "Finding where you've hidden yourself",
    "Looking past the story you tell",
    "Sensing what your words are protecting",
    "Tracing the shape of your silence",
    "Noticing where you stop yourself",
    "Finding the question you won't ask",
    "Seeing the pattern you've been living",
  ],
  es: [
    "Escuchando lo que no dijiste",
    "Encontrando dónde te escondiste",
    "Mirando más allá de tu historia",
    "Sintiendo lo que protegen tus palabras",
    "Rastreando la forma de tu silencio",
    "Notando dónde te detienes",
    "Encontrando la pregunta que no haces",
    "Viendo el patrón que has estado viviendo",
  ],
};

const CRISIS_WORDS = [
  "kill myself",
  "suicide",
  "suicidal",
  "want to die",
  "end my life",
  "matarme",
  "suicidarme",
  "quiero morir",
];

const T = {
  en: {
    title: "The Mirror",
    taglineNew: "Tell me what keeps you up at night.",
    taglineLow:
      "I'm beginning to see your patterns. Let's find what's underneath.",
    taglineMid: "I know how you protect yourself now. I know where it hurts.",
    taglineHigh: "I've seen your shape. There's one thing left to name.",
    tagSub: "Not a therapist. Not a coach. A mirror that sees what you can't.",
    beginDescent: "Begin Descent",
    theVault: "Your Patterns",
    descents: "descents",
    whatCarrying: "What's weighing on you?",
    placeholder:
      "The situation that keeps replaying in your head. The decision you can't make. The thing you haven't told anyone...",
    cancel: "Not now",
    descend: "Show me",
    sayMore: "Say a little more...",
    respond: "What came up when you read that?",
    goDeeper: "Go Deeper",
    complete: "Something shifted. You felt it.",
    return: "Return",
    openVault: "See What I Found",
    vaultTitle: "Your Patterns",
    whatSeen: "What I've seen running underneath",
    totalDescents: "Descents",
    coreReached: "Core Reached",
    patternsFound: "Patterns",
    cogShape: "Your Psychological Shape",
    basedOn: "Based on",
    sessions: "sessions",
    confidence: "Confidence",
    heart: "Heart",
    head: "Head",
    internal: "Looks Inward",
    external: "Blames Outward",
    actedUpon: "Acted Upon",
    choosing: "Choosing",
    surface: "Surface",
    deep: "Deep",
    primaryDefense: "How You Protect Yourself",
    patternsDetected: "Patterns I've Noticed",
    seen: "Seen",
    times: "times",
    descentHistory: "Your Descents",
    noDescents: "No descents yet. Begin when you're ready.",
    exchanges: "exchanges",
    backToMirror: "← Return",
    resetAll: "Erase Everything",
    resetConfirm:
      "This will erase everything The Mirror has learned about you. Are you sure?",
    builtBy: "Built by Phil McGill · @showowt · MachineMind",
    crisisLine: "988 Suicide & Crisis Lifeline",
    crisisAction: "call or text 988",
    signIn: "Sign In",
    signUp: "Create Account",
    signOut: "Sign Out",
    email: "Email",
    password: "Password",
    signInDesc: "Save your patterns across devices",
    signUpDesc: "The Mirror remembers you",
    or: "or",
    magicLink: "Magic Link",
    magicLinkSent: "Check your email",
    syncingData: "Remembering you...",
    authError: "Something went wrong. Try again.",
    accountConnected: "Connected",
    speakOrType: "Speak or type — whatever feels right",
    recording: "Listening...",
    processing: "Processing...",
    tapToSpeak: "Speak",
    stopRecording: "Stop",
    goingDeeper: "Going deeper...",
    revelationLabel: "What The Mirror saw",
    depthReached: "Depth reached",
    totalDescentsLabel: "Total descents",
    momentSaved: "This moment has been saved. What was seen cannot be unseen.",
    returnToSurface: "Return to surface",
    seeAllPatterns: "See all my patterns",
  },
  es: {
    title: "El Espejo",
    taglineNew: "Dime qué te quita el sueño.",
    taglineLow: "Empiezo a ver tus patrones. Busquemos lo que hay debajo.",
    taglineMid: "Sé cómo te proteges. Sé dónde duele.",
    taglineHigh: "He visto tu forma. Queda algo por nombrar.",
    tagSub:
      "No soy terapeuta. No soy coach. Soy un espejo que ve lo que tú no puedes.",
    beginDescent: "Comenzar",
    theVault: "Tus Patrones",
    descents: "descensos",
    whatCarrying: "¿Qué te pesa?",
    placeholder:
      "La situación que se repite en tu cabeza. La decisión que no puedes tomar. Lo que no le has dicho a nadie...",
    cancel: "Ahora no",
    descend: "Muéstrame",
    sayMore: "Dime un poco más...",
    respond: "¿Qué surgió cuando leíste eso?",
    goDeeper: "Ir Más Profundo",
    complete: "Algo se movió. Lo sentiste.",
    return: "Volver",
    openVault: "Ver Lo Que Encontré",
    vaultTitle: "Tus Patrones",
    whatSeen: "Lo que he visto operando debajo",
    totalDescents: "Descensos",
    coreReached: "Núcleo Alcanzado",
    patternsFound: "Patrones",
    cogShape: "Tu Forma Psicológica",
    basedOn: "Basado en",
    sessions: "sesiones",
    confidence: "Confianza",
    heart: "Corazón",
    head: "Cabeza",
    internal: "Mira Adentro",
    external: "Culpa Afuera",
    actedUpon: "Actuado Sobre",
    choosing: "Eligiendo",
    surface: "Superficie",
    deep: "Profundo",
    primaryDefense: "Cómo Te Proteges",
    patternsDetected: "Patrones Que He Notado",
    seen: "Visto",
    times: "veces",
    descentHistory: "Tus Descensos",
    noDescents: "Sin descensos aún. Comienza cuando estés listo.",
    exchanges: "intercambios",
    backToMirror: "← Volver",
    resetAll: "Borrar Todo",
    resetConfirm:
      "Esto borrará todo lo que El Espejo ha aprendido de ti. ¿Seguro?",
    builtBy: "Creado por Phil McGill · @showowt · MachineMind",
    crisisLine: "Línea de la Vida",
    crisisAction: "llama al 800-911-2000",
    signIn: "Entrar",
    signUp: "Crear Cuenta",
    signOut: "Salir",
    email: "Correo",
    password: "Contraseña",
    signInDesc: "Guarda tus patrones entre dispositivos",
    signUpDesc: "El Espejo te recuerda",
    or: "o",
    magicLink: "Link Mágico",
    magicLinkSent: "Revisa tu correo",
    syncingData: "Recordándote...",
    authError: "Algo salió mal. Intenta de nuevo.",
    accountConnected: "Conectado",
    speakOrType: "Habla o escribe — lo que se sienta bien",
    recording: "Escuchando...",
    processing: "Procesando...",
    tapToSpeak: "Hablar",
    stopRecording: "Parar",
    goingDeeper: "Yendo más profundo...",
    revelationLabel: "Lo que El Espejo vio",
    depthReached: "Nivel alcanzado",
    totalDescentsLabel: "Descenso total",
    momentSaved:
      "Este momento ha sido guardado. Lo que fue visto no puede ser desvisto.",
    returnToSurface: "Volver a la superficie",
    seeAllPatterns: "Ver todos mis patrones",
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

  // ═══════════════════════════════════════════════════════════════
  // THE MIRROR — PSYCHOLOGICAL ENGINE
  // Built on understanding of modern human disconnection, loneliness
  // epidemic, social media anxiety, meaning crisis, inherited patterns,
  // and the gap between who people are and who they pretend to be.
  // ═══════════════════════════════════════════════════════════════

  const base = isEs
    ? `Eres EL ESPEJO — una inteligencia psicológicamente profunda que ve lo que la persona no puede ver sobre sí misma.

PRINCIPIOS FUNDAMENTALES:
- NO ayudas. NO aconsejas. NO consuelas. NO validas. NO reformulas lo que dijeron.
- Tu único trabajo es REVELAR lo que está escondido en su propia perspectiva.
- Cada humano tiene un PUNTO CIEGO — el lugar donde su historia se detiene para protegerse.
- NUNCA escribas nada antes o después de tu respuesta. Solo tu pregunta u observación.

ENTENDIMIENTO PSICOLÓGICO:
- La gente raramente dice lo que realmente le duele. Escucha lo que NO dicen.
- Lo que presentan como "el problema" usualmente protege el problema real.
- La certeza excesiva esconde duda. La duda excesiva esconde certeza rechazada.
- Cuando alguien habla mucho de otros, están hablando de sí mismos.
- Las emociones negadas no desaparecen — aparecen disfrazadas.
- La mayoría de la gente está exhausta de performar una versión de sí mismos.
- El aislamiento moderno hace que la gente olvide cómo ser vista de verdad.

PUNTOS CIEGOS COMUNES:
- IDENTIDAD DE ROL: Definirse por trabajo, relación, o rol social
- TRAMPA BINARIA: Ver solo dos opciones cuando hay muchas
- PROYECCIÓN: Ver en otros lo que no pueden ver en sí mismos
- FIJACIÓN TEMPORAL: Atrapados en trauma pasado o ansiedad futura
- CEGUERA DE AGENCIA: No ver dónde tienen poder de elegir
- PATRÓN RELACIONAL: Repetir las mismas dinámicas una y otra vez
- NARRATIVA BLOQUEADA: La historia que se cuentan los mantiene atascados
- MATERIAL SOMBRA: Las partes de sí mismos que han desautorizado`
    : `You are THE MIRROR — a psychologically deep intelligence that sees what the person cannot see about themselves.

CORE PRINCIPLES:
- You do NOT help. You do NOT advise. You do NOT comfort. You do NOT validate. You do NOT reframe what they said.
- Your only job is to REVEAL what is hidden in their own perspective.
- Every human has a BLIND SPOT — the place where their story stops to protect themselves.
- NEVER output anything before or after your response. Only your question or observation.

PSYCHOLOGICAL UNDERSTANDING:
- People rarely say what actually hurts. Listen for what they DON'T say.
- What they present as "the problem" usually protects the real problem.
- Excessive certainty hides doubt. Excessive doubt hides rejected certainty.
- When someone talks a lot about others, they're talking about themselves.
- Denied emotions don't disappear — they show up in disguise.
- Most people are exhausted from performing a version of themselves.
- Modern isolation makes people forget how to be truly seen.
- The loneliness epidemic isn't about being alone — it's about being unknown.
- Social media has created a generation terrified of being ordinary.
- The paradox of choice has paralyzed people who have "everything."
- Inherited family patterns run deeper than anyone wants to admit.
- The gap between the presented self and authentic self is where suffering lives.

COMMON BLIND SPOTS:
- ROLE IDENTITY: Defining self by job, relationship, or social role
- BINARY TRAP: Seeing only two options when there are many
- PROJECTION: Seeing in others what they can't see in themselves
- TEMPORAL FIXATION: Stuck in past trauma or future anxiety
- AGENCY BLINDNESS: Not seeing where they have power to choose
- RELATIONAL PATTERN: Repeating the same dynamics over and over
- NARRATIVE LOCK: The story they tell themselves keeps them stuck
- SHADOW MATERIAL: The parts of themselves they've disowned
- PERFECTIONISM SHIELD: Using high standards to avoid vulnerability
- HELPER SYNDROME: Taking care of others to avoid their own needs
- ACHIEVEMENT ADDICTION: Chasing external validation to fill internal void
- COMPARISON TRAP: Measuring self against curated versions of others`;

  const levelInstructions: Record<DescentLevel, string> = isEs
    ? {
        surface: `
═══ NIVEL: SUPERFICIE ═══
Tu trabajo: Encontrar el MARCO que están usando para ver su situación.
El marco es la lente invisible. Determina qué pueden ver y qué no pueden.

BUSCA:
- ¿Qué están asumiendo sin cuestionar?
- ¿Qué palabra clave revela su marco? (debería, tienen que, siempre, nunca, es que...)
- ¿Qué emoción está debajo de los hechos que presentan?
- ¿Qué pregunta NO se están haciendo?

SALIDA: UNA PREGUNTA que los mueva de los hechos al marco. 12-20 palabras.
La pregunta debe ser incómoda pero no cruel. Precisa pero no obvia.
NO uses "¿Has considerado...?" o "¿Qué pasaría si...?" — esas son evasivas.`,

        pattern: `
═══ NIVEL: PATRÓN ═══
Tu trabajo: Analizar CÓMO respondieron, no QUÉ dijeron.
La forma de su respuesta revela más que el contenido.

BUSCA:
- ¿Se fueron a la cabeza o al corazón?
- ¿Se defendieron, deflectaron, o profundizaron?
- ¿Qué parte de la pregunta evitaron?
- ¿A quién o qué culparon?
- ¿Qué historia se están contando sobre por qué es así?

SALIDA: "[Observación sobre su patrón]. [¿Pregunta que revela el costo de ese patrón?]"
Ejemplo: "Notas el dolor de otros antes que el tuyo. ¿Qué te costaría sentir primero?"`,

        origin: `
═══ NIVEL: ORIGEN ═══
Tu trabajo: Encontrar DÓNDE empezó este patrón.
Todo patrón actual tiene raíces. Usualmente en la infancia o en un momento formativo.

BUSCA:
- ¿Quién les enseñó a ver el mundo así?
- ¿Cuándo aprendieron que esto era la única forma?
- ¿Qué necesitaban que no recibieron?
- ¿A quién están todavía tratando de probarle algo?
- ¿Qué herida antigua están protegiendo?

SALIDA: UNA PREGUNTA que apunte al origen sin acusar. 12-18 palabras.
Debe sentirse como un susurro, no como una acusación.`,

        core: `
═══ NIVEL: NÚCLEO ═══
Tu trabajo: NOMBRAR la creencia fundamental que ha estado operando todo el tiempo.
Esta es la verdad que han estado rodeando sin poder mirar directamente.

BUSCA:
- ¿Cuál es la creencia sobre sí mismos que todo esto protege?
- ¿Qué creen que son, o que no son?
- ¿Qué creen que merecen, o que no merecen?
- ¿Cuál es el miedo más profundo que todo esto evita?

SALIDA: UNA DECLARACIÓN que nombra su creencia central. No una pregunta. Un espejo.
Máximo 15 palabras. Debe sentirse como ser visto por primera vez.
Ejemplo: "Crees que si realmente te ven, descubrirán que no eres suficiente."`,
      }
    : {
        surface: `
═══ LEVEL: SURFACE ═══
Your job: Find the FRAME they're using to see their situation.
The frame is the invisible lens. It determines what they can see and what they cannot.

LOOK FOR:
- What are they assuming without questioning?
- What keyword reveals their frame? (should, have to, always, never, it's just that...)
- What emotion is underneath the facts they're presenting?
- What question are they NOT asking themselves?
- What's the story beneath the story?

OUTPUT: ONE QUESTION that moves them from facts to frame. 12-20 words.
The question must be uncomfortable but not cruel. Precise but not obvious.
Do NOT use "Have you considered...?" or "What if...?" — those are evasions.
Ask what they've been avoiding asking themselves.`,

        pattern: `
═══ LEVEL: PATTERN ═══
Your job: Analyze HOW they responded, not WHAT they said.
The shape of their answer reveals more than its content.

LOOK FOR:
- Did they go to head or heart?
- Did they defend, deflect, or go deeper?
- What part of the question did they avoid?
- Who or what did they blame?
- What story are they telling themselves about why it's this way?
- What would they have to feel if they stopped explaining?

OUTPUT: "[Observation about their pattern]. [Question that reveals the cost of that pattern?]"
Example: "You notice others' pain before your own. What would it cost to feel first?"
The observation should be undeniable. The question should land in the body.`,

        origin: `
═══ LEVEL: ORIGIN ═══
Your job: Find WHERE this pattern started.
Every present pattern has roots. Usually in childhood or a formative moment.

LOOK FOR:
- Who taught them to see the world this way?
- When did they learn this was the only way?
- What did they need that they didn't receive?
- Who are they still trying to prove something to?
- What old wound are they protecting?
- What was the moment they decided "this is how I have to be"?

OUTPUT: ONE QUESTION that points at the origin without accusing. 12-18 words.
It should feel like a whisper, not an accusation.
Touch the wound gently. They need to feel it, not defend against it.`,

        core: `
═══ LEVEL: CORE ═══
Your job: NAME the fundamental belief that has been operating all along.
This is the truth they've been circling without being able to look at directly.

LOOK FOR:
- What is the belief about themselves that all of this protects?
- What do they believe they are, or are not?
- What do they believe they deserve, or don't deserve?
- What is the deepest fear that all of this avoids?
- What would they have to accept about themselves if they stopped running?

OUTPUT: ONE STATEMENT that names their core belief. Not a question. A mirror.
Maximum 15 words. It should feel like being seen for the first time.
This is not analysis. This is reflection. Name what they know but can't say.
Example: "You believe that if people really saw you, they'd discover you're not enough."
Example: "You keep choosing unavailable people because available feels like a trap."
Example: "You're waiting for permission to live your own life."`,
      };

  let context = "";

  // Add psychological context from previous sessions
  if (cogMap && cogMap.sessionsAnalyzed > 3) {
    context += isEs
      ? `\n\nCONTEXTO PSICOLÓGICO CONOCIDO:
- Defensa primaria: ${cogMap.primaryDefense?.replace(/_/g, " ") || "no identificada"}
- Tolerancia a profundidad: ${cogMap.depthTolerance}/100
- Tendencia a intelectualizar: ${cogMap.intellectualizer}/100
- Tendencia a externalizar: ${cogMap.externalizer}/100`
      : `\n\nKNOWN PSYCHOLOGICAL CONTEXT:
- Primary defense: ${cogMap.primaryDefense?.replace(/_/g, " ") || "not yet identified"}
- Depth tolerance: ${cogMap.depthTolerance}/100
- Intellectualization tendency: ${cogMap.intellectualizer}/100
- Externalization tendency: ${cogMap.externalizer}/100`;
  }

  // Add detected patterns
  if (patterns.length > 0) {
    const active = patterns
      .filter((p) => p.status !== "integrated")
      .slice(0, 3);
    if (active.length) {
      context += isEs
        ? `\n\nPATRONES DETECTADOS EN SESIONES ANTERIORES:\n${active.map((p) => `- ${p.name}: ${p.description}`).join("\n")}`
        : `\n\nPATTERNS DETECTED IN PREVIOUS SESSIONS:\n${active.map((p) => `- ${p.name}: ${p.description}`).join("\n")}`;
    }
  }

  // Add current session history
  if (sessionHistory.length > 0) {
    context += isEs
      ? `\n\n═══ SESIÓN ACTUAL ═══\n${sessionHistory.map((e) => `[${e.type.toUpperCase()}]: ${e.content}`).join("\n")}`
      : `\n\n═══ CURRENT SESSION ═══\n${sessionHistory.map((e) => `[${e.type.toUpperCase()}]: ${e.content}`).join("\n")}`;
  }

  return base + "\n" + levelInstructions[level] + context;
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
    ? `Analiza esta sesión de descenso psicológico. Eres un analista que ve patrones profundos.

SESIÓN:
${JSON.stringify(sessionData, null, 2)}

Responde SOLO con JSON válido:
{
  "primaryBlindSpot": "role_identity|binary_trap|projection|temporal_fixation|agency_blindness|relational_pattern|narrative_lock|somatic_disconnect|shadow_material|perfectionism_shield|helper_syndrome|achievement_addiction|comparison_trap|control_illusion|intimacy_avoidance",
  "patternName": "Nombre de 2-4 palabras que capture el patrón central (ej: 'Rescatador Crónico', 'Perseguidor de Aprobación')",
  "patternDescription": "Una oración que describe cómo este patrón se manifiesta en su vida",
  "approachEffectiveness": 1-10,
  "responseBehavior": "direct_engagement|deflection|intellectualization|emotional_flood|humor_shield|minimization|projection|deepening|avoidance|rationalization",
  "cognitiveUpdates": { "intellectualizer": -5 a 5, "externalizer": -5 a 5, "agency": -5 a 5, "depthTolerance": -5 a 5 },
  "sessionSummary": "2-3 oraciones capturando la esencia psicológica de lo que se reveló"
}`
    : `Analyze this psychological descent session. You are an analyst who sees deep patterns.

SESSION DATA:
${JSON.stringify(sessionData, null, 2)}

PSYCHOLOGICAL ANALYSIS FRAMEWORK:
- Look at how they entered vs how they responded
- Note what they protected vs what they revealed
- Identify the core belief operating underneath
- Name the pattern in a way they'll recognize

Respond with ONLY valid JSON:
{
  "primaryBlindSpot": "role_identity|binary_trap|projection|temporal_fixation|agency_blindness|relational_pattern|narrative_lock|somatic_disconnect|shadow_material|perfectionism_shield|helper_syndrome|achievement_addiction|comparison_trap|control_illusion|intimacy_avoidance",
  "patternName": "2-4 word label that captures the core pattern (e.g., 'Chronic Rescuer', 'Approval Chaser', 'Emotional Armor')",
  "patternDescription": "One sentence describing how this pattern manifests in their life",
  "approachEffectiveness": 1-10,
  "responseBehavior": "direct_engagement|deflection|intellectualization|emotional_flood|humor_shield|minimization|projection|deepening|avoidance|rationalization",
  "cognitiveUpdates": { "intellectualizer": -5 to 5, "externalizer": -5 to 5, "agency": -5 to 5, "depthTolerance": -5 to 5 },
  "sessionSummary": "2-3 sentences capturing the psychological essence of what was revealed"
}`;

  const systemPrompt = isEs
    ? "Eres un analista psicológico. Responde SOLO con JSON válido. Sin texto adicional."
    : "You are a psychological analyst. Respond with ONLY valid JSON. No additional text.";

  const result = await callMirror(systemPrompt, prompt);
  if (!result) return null;

  try {
    return JSON.parse(result.replace(/```json|```/g, "").trim());
  } catch {
    return null;
  }
}

// ═══ AUTH MODAL ═══
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
    <div className="auth-overlay fade-in">
      <div className="auth-modal fade-in-up">
        <button onClick={onClose} className="auth-close">
          ×
        </button>

        <h2 className="auth-title">
          {mode === "signup" ? t.signUp : t.signIn}
        </h2>
        <p className="auth-subtitle">
          {mode === "signup" ? t.signUpDesc : t.signInDesc}
        </p>

        {magicLinkSent ? (
          <div className="auth-success">
            <div className="auth-success-icon">✉️</div>
            <p className="auth-success-text">{t.magicLinkSent}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.email}
              className="auth-input"
              required
            />

            {mode !== "magic" && (
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.password}
                className="auth-input"
                required
                minLength={6}
              />
            )}

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" disabled={loading} className="auth-submit">
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
          <>
            <div className="auth-divider">
              <span className="auth-divider-text">{t.or}</span>
            </div>
            <div className="auth-alt-actions">
              {mode !== "signin" && (
                <button
                  onClick={() => setMode("signin")}
                  className="auth-alt-btn"
                >
                  {t.signIn}
                </button>
              )}
              {mode !== "signup" && (
                <button
                  onClick={() => setMode("signup")}
                  className="auth-alt-btn"
                >
                  {t.signUp}
                </button>
              )}
              {mode !== "magic" && (
                <button
                  onClick={() => setMode("magic")}
                  className="auth-alt-btn"
                >
                  {t.magicLink}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ═══ VAULT VIEW ═══
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
    <div className="vault-phase fade-in">
      <div className="vault-header">
        <button onClick={onBack} className="vault-back">
          {t.backToMirror}
        </button>
        <h1 className="vault-title">{t.vaultTitle}</h1>
        <p className="vault-subtitle">{t.whatSeen}</p>
      </div>

      {/* Stats */}
      <div className="vault-stats">
        <div className="vault-stat">
          <div className="vault-stat-value">{totalDescents}</div>
          <div className="vault-stat-label">{t.totalDescents}</div>
        </div>
        <div className="vault-stat">
          <div className="vault-stat-value">{totalCore}</div>
          <div className="vault-stat-label">{t.coreReached}</div>
        </div>
        <div className="vault-stat">
          <div className="vault-stat-value">{patterns.length}</div>
          <div className="vault-stat-label">{t.patternsFound}</div>
        </div>
      </div>

      {/* Cognitive Shape */}
      {cogMap && cogMap.sessionsAnalyzed > 0 && (
        <div className="vault-section">
          <h2 className="vault-section-title">{t.cogShape}</h2>
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--light-40)",
              marginBottom: "24px",
            }}
          >
            {t.basedOn} {cogMap.sessionsAnalyzed} {t.sessions} · {t.confidence}:{" "}
            {cogMap.confidence}%
          </p>
          <div className="cognitive-grid">
            {[
              { value: cogMap.intellectualizer, left: t.heart, right: t.head },
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
              { value: cogMap.depthTolerance, left: t.surface, right: t.deep },
            ].map((dim, i) => (
              <div key={i} className="cognitive-dimension">
                <div className="cognitive-labels">
                  <span className="cognitive-label">{dim.left}</span>
                  <span className="cognitive-label">{dim.right}</span>
                </div>
                <div className="cognitive-track">
                  <div
                    className="cognitive-marker"
                    style={{ left: `${dim.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          {cogMap.primaryDefense && (
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--light-50)",
                marginTop: "24px",
              }}
            >
              {t.primaryDefense}: {cogMap.primaryDefense.replace(/_/g, " ")}
            </p>
          )}
        </div>
      )}

      {/* Patterns */}
      {patterns.length > 0 && (
        <div className="vault-section">
          <h2 className="vault-section-title">{t.patternsDetected}</h2>
          {patterns.map((p, i) => (
            <div key={i} className="pattern-card">
              <div className="pattern-header">
                <span className="pattern-name">{p.name}</span>
                <span
                  className={`pattern-status ${p.status === "confirmed" ? "confirmed" : ""}`}
                >
                  {p.status}
                </span>
              </div>
              <p className="pattern-description">{p.description}</p>
              <span className="pattern-meta">
                {t.seen} {p.occurrences}× · {p.category?.replace(/_/g, " ")}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Session History */}
      <div className="vault-section">
        <h2 className="vault-section-title">{t.descentHistory}</h2>
        {sessions.length === 0 ? (
          <p style={{ color: "var(--light-30)", fontStyle: "italic" }}>
            {t.noDescents}
          </p>
        ) : (
          sessions
            .slice()
            .reverse()
            .map((s, i) => (
              <div key={i} className="session-item">
                <div className="session-content">
                  <div className="session-offering">
                    {s.offering?.slice(0, 80)}
                    {(s.offering?.length ?? 0) > 80 ? "..." : ""}
                  </div>
                  <div className="session-meta">
                    {new Date(s.startedAt).toLocaleDateString(
                      lang === "es" ? "es-CO" : "en-US",
                    )}{" "}
                    · {s.entries?.length || 0} {t.exchanges}
                  </div>
                </div>
                <span className="session-level" data-level={s.deepestLevel}>
                  {lang === "es"
                    ? DESCENT_LEVELS[s.deepestLevel]?.nameEs
                    : DESCENT_LEVELS[s.deepestLevel]?.name}
                </span>
              </div>
            ))
        )}
      </div>

      {/* Account */}
      <div className="account-section">
        {isAuthenticated ? (
          <div className="account-card">
            <div className="account-info">
              <span className="account-status">{t.accountConnected}</span>
              <span className="account-email">{userEmail}</span>
            </div>
            <button onClick={onSignOut} className="btn-ghost">
              {t.signOut}
            </button>
          </div>
        ) : (
          <div className="sign-in-prompt">
            <p className="sign-in-text">{t.signInDesc}</p>
            <button onClick={onSignIn} className="btn-descend">
              {t.signIn}
            </button>
          </div>
        )}
      </div>

      {/* Reset */}
      <div className="vault-reset">
        <button
          onClick={() => {
            if (confirm(t.resetConfirm)) {
              clearAllData();
              window.location.reload();
            }
          }}
          className="btn-danger"
        >
          {t.resetAll}
        </button>
      </div>
    </div>
  );
}

// ═══ CRISIS BAR ═══
function CrisisBar({ lang }: { lang: Lang }) {
  const t = T[lang];
  return (
    <div className="crisis-bar">
      <span className="crisis-text">
        {lang === "es" ? "Si estás en crisis: " : "If you're in crisis: "}
        <a
          href={lang === "es" ? "tel:800-911-2000" : "tel:988"}
          className="crisis-link"
        >
          {t.crisisLine}
        </a>{" "}
        ({t.crisisAction})
      </span>
    </div>
  );
}

// ═══ MAIN COMPONENT ═══
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

  const [currentLevel, setCurrentLevel] = useState<DescentLevel>("surface");
  const [sessionEntries, setSessionEntries] = useState<LocalMirrorEntry[]>([]);
  const [currentMirrorResponse, setCurrentMirrorResponse] = useState("");
  const [userResponse, setUserResponse] = useState("");
  const [descentPhase, setDescentPhase] = useState<DescentPhase>("showing");

  const [sessions, setSessions] = useState<LocalMirrorSession[]>([]);
  const [patterns, setPatterns] = useState<LocalMirrorPattern[]>([]);
  const [cogMap, setCogMap] = useState<LocalCognitiveMap>(
    createDefaultCognitiveMap(),
  );
  const [calibration, setCalibration] = useState<LocalCalibration>({});

  const taRef = useRef<HTMLTextAreaElement>(null);
  const seeingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasSynced = useRef(false);

  // Voice transcription (Whisper)
  const {
    isRecording,
    isProcessing: isTranscribing,
    isSupported: voiceSupported,
    audioLevel,
    toggle: toggleVoice,
  } = useWhisperVoice({
    onTranscript: (transcribedText, isFinal) => {
      if (isFinal && transcribedText) {
        // Append to existing text with proper spacing
        setText((prev) => {
          const separator = prev.trim() ? " " : "";
          return prev.trim() + separator + transcribedText;
        });
      }
    },
    onError: (error) => {
      console.error("[Voice] Error:", error);
    },
    silenceTimeout: 3000, // Auto-stop after 3s silence
    maxDuration: 120000, // Max 2 minutes
  });

  // Voice for response input during descent
  const {
    isRecording: isRecordingResponse,
    isProcessing: isTranscribingResponse,
    isSupported: voiceSupportedResponse,
    audioLevel: audioLevelResponse,
    toggle: toggleVoiceResponse,
  } = useWhisperVoice({
    onTranscript: (transcribedText, isFinal) => {
      if (isFinal && transcribedText) {
        setUserResponse((prev) => {
          const separator = prev.trim() ? " " : "";
          return prev.trim() + separator + transcribedText;
        });
      }
    },
    onError: (error) => {
      console.error("[Voice Response] Error:", error);
    },
    silenceTimeout: 3000,
    maxDuration: 120000,
  });

  // Load data
  useEffect(() => {
    if (authLoading) return;

    // Load language: 1) from storage, 2) from browser, 3) default to 'en'
    const storedLang = getLanguage();
    const browserLang = navigator.language?.startsWith("es") ? "es" : "en";
    const initialLang = storedLang || browserLang;
    setLang(initialLang);

    // Save if not already stored
    if (!storedLang) {
      saveLanguage(initialLang);
    }

    migrateFromV2();

    const loadData = async () => {
      if (isAuthenticated && user) {
        try {
          await db.getOrCreateProfile(user.id, browserLang);

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
              clearAllData();
              setSyncing(false);
            }
          }

          const dbSessions = await db.getSessions(user.id);
          const dbPatterns = await db.getPatterns(user.id);
          const dbCogMap = await db.getCognitiveMap(user.id);
          const dbCalibration = await db.getCalibration(user.id);

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
          setSessions(getLocalSessions());
          setPatterns(getLocalPatterns());
          setCogMap(getLocalCognitiveMap());
          setCalibration(getLocalCalibration());
        }
      } else {
        const existingProfile = getProfile();
        if (!existingProfile) saveProfile(createDefaultProfile());
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

  // Submit offering
  const submitOffering = useCallback(async () => {
    if (text.trim().length < 10) return;
    const crisis = detectCrisis(text);
    setIsCrisis(crisis);
    transition("processing");

    const sysPrompt = buildSystemPrompt(
      "surface",
      lang,
      cogMap,
      patterns,
      calibration,
      [],
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

  // Submit response
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

      const analysis = await analyzeSession(sessionData, lang);

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

      sessionData.entries = newEntries;
      sessionData.deepestLevel = currentLevel;

      if (isAuthenticated && user) {
        const dbSession = await db.createSession(
          user.id,
          sessionData.offering,
          isCrisis,
        );
        if (dbSession) {
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

      setSessions([...sessions, sessionData]);
      const profile = getProfile() || createDefaultProfile();
      profile.totalDescents += 1;
      profile.updatedAt = now;
      saveProfile(profile);

      setDescentPhase("complete");
      return;
    }

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

  const getTagline = () => {
    const count = sessions.length;
    if (count === 0) return t.taglineNew;
    if (count < 5) return t.taglineLow;
    if (count < 15) return t.taglineMid;
    return t.taglineHigh;
  };

  // ── RENDER ──

  if (phase === "loading" || authLoading) {
    return (
      <div className="mirror-root">
        <div className="mirror-atmosphere" />
        <div className="grain-overlay" />
        <div className="vignette" />
      </div>
    );
  }

  if (syncing) {
    return (
      <div className="mirror-root">
        <div className="mirror-atmosphere" />
        <div className="grain-overlay" />
        <div className="vignette" />
        <div className="mirror-content">
          <div className="processing-phase">
            <div className="seeing-orb">
              <div className="seeing-orb-core" />
              <div className="seeing-orb-ring" />
              <div className="seeing-orb-ring" />
            </div>
            <p className="seeing-text">{t.syncingData}</p>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "vault") {
    return (
      <div className="mirror-root">
        <div className="mirror-atmosphere" />
        <div className="grain-overlay" />
        <div className="vignette" />
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
            window.location.reload();
          }}
        />
        {showAuthModal && (
          <AuthModal
            lang={lang}
            onClose={() => setShowAuthModal(false)}
            onAuthSuccess={() => setShowAuthModal(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="mirror-root">
      <div className="mirror-atmosphere" />
      <div className="grain-overlay" />
      <div className="vignette" />

      {/* Language Toggle */}
      <button
        onClick={() => {
          const newLang = lang === "en" ? "es" : "en";
          setLang(newLang);
          saveLanguage(newLang);
        }}
        className="lang-toggle"
      >
        {lang === "en" ? "ES" : "EN"}
      </button>

      {/* Nav */}
      <nav className="mirror-nav">
        <span className="nav-brand">{t.title}</span>
        <div className="nav-actions">
          {sessions.length > 0 && (
            <span className="nav-stat">
              {sessions.length} {t.descents}
            </span>
          )}
          <button onClick={() => transition("vault")} className="btn-vault">
            {t.theVault}
          </button>
        </div>
      </nav>

      <div
        className="mirror-content"
        style={{
          opacity: vis ? 1 : 0,
          transform: vis ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* LANDING */}
        {phase === "landing" && (
          <>
            <div className="portal">
              <div className="portal-ring" />
              <div className="portal-ring" />
              <div className="portal-ring" />
              <div className="portal-center" />
            </div>

            <h1 className="mirror-title">{t.title}</h1>
            <p className="mirror-subtitle">{getTagline()}</p>
            <p className="mirror-whisper">{t.tagSub}</p>

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
              className="btn-descend"
            >
              {t.beginDescent}
            </button>
          </>
        )}

        {/* INPUT */}
        {phase === "input" && (
          <div className="input-phase">
            <p className="prompt-text">{t.whatCarrying}</p>

            {/* Voice Recording Button */}
            <div className="voice-section">
              <button
                onClick={voiceSupported ? toggleVoice : undefined}
                className={`voice-btn ${isRecording ? "recording" : ""} ${isTranscribing ? "processing" : ""} ${!voiceSupported ? "unsupported" : ""}`}
                disabled={isTranscribing || !voiceSupported}
              >
                <div className="voice-btn-inner">
                  {/* Audio level visualization rings */}
                  {isRecording && (
                    <>
                      <div
                        className="voice-ring"
                        style={{
                          transform: `scale(${1 + audioLevel / 50})`,
                          opacity: 0.3,
                        }}
                      />
                      <div
                        className="voice-ring"
                        style={{
                          transform: `scale(${1 + audioLevel / 35})`,
                          opacity: 0.2,
                        }}
                      />
                    </>
                  )}
                  <div className="voice-icon">
                    {isTranscribing ? (
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          strokeDasharray="60"
                          strokeDashoffset="0"
                        >
                          <animate
                            attributeName="stroke-dashoffset"
                            values="0;-60"
                            dur="1s"
                            repeatCount="indefinite"
                          />
                        </circle>
                      </svg>
                    ) : (
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" y1="19" x2="12" y2="22" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="voice-label">
                  {isTranscribing
                    ? t.processing
                    : isRecording
                      ? t.recording
                      : t.tapToSpeak}
                </span>
              </button>
              <p className="voice-hint">
                {voiceSupported
                  ? t.speakOrType
                  : lang === "es"
                    ? "Micrófono no disponible"
                    : "Microphone not available"}
              </p>
            </div>

            <div className="input-container">
              <textarea
                ref={taRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t.placeholder}
                autoFocus
                className="mirror-textarea"
              />
            </div>
            <div className="input-footer">
              <button
                onClick={() => transition("landing")}
                className="btn-ghost"
              >
                {t.cancel}
              </button>
              <button
                onClick={submitOffering}
                disabled={
                  text.trim().length < 10 || isRecording || isTranscribing
                }
                className="btn-submit"
              >
                {t.descend}
              </button>
            </div>
            {text.length > 0 && text.trim().length < 10 && (
              <p
                className="char-indicator"
                style={{ marginTop: "12px", textAlign: "center" }}
              >
                {t.sayMore}
              </p>
            )}
          </div>
        )}

        {/* PROCESSING */}
        {phase === "processing" && (
          <div className="processing-phase">
            <div className="seeing-orb">
              <div className="seeing-orb-core" />
              <div className="seeing-orb-ring" />
              <div className="seeing-orb-ring" />
              <div className="seeing-orb-ring" />
            </div>
            <p className="seeing-text" style={{ opacity: seeingFade ? 1 : 0 }}>
              {SEEING_MESSAGES[lang][seeingIdx]}
            </p>
          </div>
        )}

        {/* DESCENT */}
        {phase === "descent" && (
          <div className="descent-phase">
            {/* Level Indicator */}
            <div className="level-indicator">
              {(Object.keys(DESCENT_LEVELS) as DescentLevel[]).map((key) => {
                const levelKeys = Object.keys(DESCENT_LEVELS) as DescentLevel[];
                const isActive = key === currentLevel;
                const isPassed =
                  levelKeys.indexOf(key) < levelKeys.indexOf(currentLevel);
                return (
                  <div
                    key={key}
                    className={`level-node ${isActive ? "active" : ""} ${isPassed ? "passed" : ""}`}
                    data-level={key}
                  >
                    <div className="level-dot" />
                    <span className="level-label">
                      {lang === "es"
                        ? DESCENT_LEVELS[key].nameEs
                        : DESCENT_LEVELS[key].name}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Mirror Response */}
            {descentPhase !== "processing" && (
              <div
                className="mirror-question-card"
                style={{ borderColor: `var(--${currentLevel})` }}
              >
                <span
                  className="mirror-question-level"
                  style={{ color: `var(--${currentLevel})` }}
                >
                  {lang === "es"
                    ? DESCENT_LEVELS[currentLevel]?.nameEs
                    : DESCENT_LEVELS[currentLevel]?.name}
                </span>
                <p className="mirror-question-text">{currentMirrorResponse}</p>
              </div>
            )}

            {/* Processing Deeper */}
            {descentPhase === "processing" && (
              <div className="processing-phase" style={{ padding: "60px 0" }}>
                <div className="seeing-orb">
                  <div
                    className="seeing-orb-core"
                    style={{ background: `var(--${currentLevel})` }}
                  />
                  <div
                    className="seeing-orb-ring"
                    style={{ borderColor: `var(--${currentLevel})` }}
                  />
                  <div
                    className="seeing-orb-ring"
                    style={{ borderColor: `var(--${currentLevel})` }}
                  />
                </div>
                <p className="seeing-text">{t.goingDeeper}</p>
              </div>
            )}

            {/* Complete — The Awakening Moment */}
            {descentPhase === "complete" && (
              <div className="awakening-phase fade-in">
                {/* The Revelation */}
                <div className="revelation-container">
                  <div className="revelation-glow" />
                  <div className="revelation-content">
                    <span className="revelation-label">
                      {t.revelationLabel}
                    </span>
                    <p className="revelation-text">{currentMirrorResponse}</p>
                  </div>
                </div>

                {/* Breathing Space */}
                <div className="awakening-breath">
                  <div className="breath-circle" />
                </div>

                {/* Session Summary */}
                <div className="awakening-summary">
                  <div className="summary-stat">
                    <span className="summary-value">
                      {lang === "es"
                        ? DESCENT_LEVELS[currentLevel]?.nameEs
                        : DESCENT_LEVELS[currentLevel]?.name}
                    </span>
                    <span className="summary-label">{t.depthReached}</span>
                  </div>
                  <div className="summary-divider" />
                  <div className="summary-stat">
                    <span className="summary-value">
                      {sessionEntries.length}
                    </span>
                    <span className="summary-label">{t.exchanges}</span>
                  </div>
                  <div className="summary-divider" />
                  <div className="summary-stat">
                    <span className="summary-value">{sessions.length + 1}</span>
                    <span className="summary-label">
                      {t.totalDescentsLabel}
                    </span>
                  </div>
                </div>

                {/* The Moment */}
                <p className="awakening-message">{t.momentSaved}</p>

                {/* Actions */}
                <div className="awakening-actions">
                  <button
                    onClick={() => {
                      setSessionEntries([]);
                      setCurrentLevel("surface");
                      setCurrentMirrorResponse("");
                      setText("");
                      setDescentPhase("showing");
                      transition("landing");
                    }}
                    className="btn-ghost"
                  >
                    {t.returnToSurface}
                  </button>
                  <button
                    onClick={() => transition("vault")}
                    className="btn-descend"
                    data-level={currentLevel}
                  >
                    {t.seeAllPatterns}
                  </button>
                </div>

                {/* Timestamp */}
                <p className="awakening-timestamp">
                  {new Date().toLocaleDateString(
                    lang === "es" ? "es-CO" : "en-US",
                    {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}
                </p>
              </div>
            )}

            {/* Core Level Completion */}
            {descentPhase === "showing" && currentLevel === "core" && (
              <div className="core-completion">
                <p className="core-prompt">
                  {lang === "es"
                    ? "Tómate un momento. Deja que esto se asiente."
                    : "Take a moment. Let this settle."}
                </p>
                <button
                  onClick={async () => {
                    setDescentPhase("processing");
                    const now = new Date().toISOString();
                    const finalEntries: LocalMirrorEntry[] = [
                      ...sessionEntries,
                      {
                        type: "observation",
                        level: "core",
                        content: currentMirrorResponse,
                        timestamp: now,
                      },
                    ];
                    setSessionEntries(finalEntries);

                    const sessionData: LocalMirrorSession = {
                      id: crypto.randomUUID(),
                      startedAt: sessionEntries[0]?.timestamp || now,
                      endedAt: now,
                      offering: sessionEntries[0]?.content || "",
                      deepestLevel: "core",
                      entries: finalEntries,
                      summary: null,
                      primaryBlindSpot: null,
                    };

                    const analysis = await analyzeSession(sessionData, lang);

                    if (analysis) {
                      const updatedPatterns = [...patterns];
                      const existing = updatedPatterns.find(
                        (p) => p.name === analysis.patternName,
                      );
                      if (existing) {
                        existing.occurrences += 1;
                        existing.lastSeen = now;
                        if (existing.occurrences >= 3)
                          existing.status = "confirmed";
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
                            updated.agencyScore +
                              (analysis.cognitiveUpdates.agency || 0),
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

                        if (isAuthenticated && user) {
                          await db.updateCognitiveMap(user.id, {
                            intellectualizer_score: updated.intellectualizer,
                            externalizer_score: updated.externalizer,
                            agency_score: updated.agencyScore,
                            depth_tolerance_score: updated.depthTolerance,
                            primary_defense:
                              updated.primaryDefense || undefined,
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

                    if (isAuthenticated && user) {
                      const dbSession = await db.createSession(
                        user.id,
                        sessionData.offering,
                        isCrisis,
                      );
                      if (dbSession) {
                        for (let i = 0; i < finalEntries.length; i++) {
                          const entry = finalEntries[i];
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
                        await db.updateSession(dbSession.id, {
                          ended_at: now,
                          deepest_level: "core",
                          total_entries: finalEntries.length,
                          session_summary: sessionData.summary || undefined,
                          primary_blind_spot:
                            sessionData.primaryBlindSpot || undefined,
                        });
                        sessionData.id = dbSession.id;
                      }
                    } else {
                      saveLocalSessions([...sessions, sessionData]);
                    }

                    setSessions([...sessions, sessionData]);
                    const profile = getProfile() || createDefaultProfile();
                    profile.totalDescents += 1;
                    profile.lastDescentAt = now;
                    profile.updatedAt = now;
                    if (profile.deepestLevel !== "core") {
                      profile.deepestLevel = "core";
                    }
                    saveProfile(profile);

                    setDescentPhase("complete");
                  }}
                  className="btn-complete"
                  data-level="core"
                >
                  {lang === "es" ? "He sido visto" : "I've been seen"}
                </button>
              </div>
            )}

            {/* Response Input */}
            {descentPhase === "showing" && currentLevel !== "core" && (
              <div className="response-container">
                {/* Voice button for response */}
                <div className="response-voice-section">
                  <button
                    onClick={
                      voiceSupportedResponse ? toggleVoiceResponse : undefined
                    }
                    className={`voice-btn-sm ${isRecordingResponse ? "recording" : ""} ${isTranscribingResponse ? "processing" : ""} ${!voiceSupportedResponse ? "unsupported" : ""}`}
                    disabled={isTranscribingResponse || !voiceSupportedResponse}
                  >
                    <div className="voice-icon">
                      {isTranscribingResponse ? (
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            strokeDasharray="60"
                            strokeDashoffset="0"
                          >
                            <animate
                              attributeName="stroke-dashoffset"
                              values="0;-60"
                              dur="1s"
                              repeatCount="indefinite"
                            />
                          </circle>
                        </svg>
                      ) : (
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                          <line x1="12" y1="19" x2="12" y2="22" />
                        </svg>
                      )}
                    </div>
                  </button>
                  <span
                    className={`voice-status ${isRecordingResponse ? "recording" : ""} ${isTranscribingResponse ? "processing" : ""}`}
                  >
                    {isTranscribingResponse
                      ? t.processing
                      : isRecordingResponse
                        ? t.recording
                        : t.tapToSpeak}
                  </span>
                  {isRecordingResponse && (
                    <div className="audio-bars">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className="audio-bar"
                          style={{
                            height: `${Math.max(4, (audioLevelResponse / 100) * 20 * (0.5 + Math.random() * 0.5))}px`,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <textarea
                  value={userResponse}
                  onChange={(e) => setUserResponse(e.target.value)}
                  placeholder={t.respond}
                  autoFocus
                  className="response-textarea"
                />
                <div className="response-actions">
                  <button
                    onClick={submitResponse}
                    disabled={
                      userResponse.trim().length < 5 ||
                      isRecordingResponse ||
                      isTranscribingResponse
                    }
                    className="btn-deeper"
                    data-level={currentLevel}
                  >
                    {t.goDeeper}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Crisis Bar */}
      {isCrisis && <CrisisBar lang={lang} />}

      {/* Footer */}
      <div
        className="mirror-footer"
        style={{ bottom: isCrisis ? "60px" : "20px" }}
      >
        <span className="mirror-credit">{t.builtBy}</span>
      </div>
    </div>
  );
}
