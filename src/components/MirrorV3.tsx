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
  "matarme",
  "suicidarme",
  "quiero morir",
];

const T = {
  en: {
    title: "The Mirror",
    taglineNew: "Tell me what you're carrying right now.",
    taglineLow: "I'm starting to see your shape. Let's go deeper.",
    taglineMid: "I know your patterns now. I know where you hide.",
    taglineHigh: "I see you. Let's find what's left to uncover.",
    tagSub: "I won't help you. I'll show you what you can't see.",
    beginDescent: "Begin Descent",
    theVault: "The Vault",
    descents: "descents",
    whatCarrying: "What are you carrying?",
    placeholder: "Speak freely. The situation, the weight, the crossroads...",
    cancel: "Cancel",
    descend: "Descend",
    sayMore: "Say a little more...",
    respond: "Respond honestly...",
    goDeeper: "Go Deeper",
    complete: "This descent is complete.",
    return: "Return",
    openVault: "Open Vault",
    vaultTitle: "The Vault",
    whatSeen: "What The Mirror has seen in you",
    totalDescents: "Descents",
    coreReached: "Core Reached",
    patternsFound: "Patterns",
    cogShape: "Your Cognitive Shape",
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
    primaryDefense: "Primary Defense",
    patternsDetected: "Patterns Detected",
    seen: "Seen",
    times: "times",
    descentHistory: "Descent History",
    noDescents: "No descents yet.",
    exchanges: "exchanges",
    backToMirror: "← Back to Mirror",
    resetAll: "Reset All Data",
    resetConfirm: "This will erase all Mirror data. This cannot be undone.",
    builtBy: "Built by Phil McGill · @showowt · MachineMind",
    crisisLine: "988 Suicide & Crisis Lifeline",
    crisisAction: "call or text 988",
    signIn: "Sign In",
    signUp: "Create Account",
    signOut: "Sign Out",
    email: "Email",
    password: "Password",
    signInDesc: "Sign in to sync across devices",
    signUpDesc: "Create an account to save progress",
    or: "or",
    magicLink: "Magic Link",
    magicLinkSent: "Check your email for the magic link",
    syncingData: "Syncing your data...",
    authError: "Authentication error. Try again.",
    accountConnected: "Account Connected",
    speakOrType: "Speak or type",
    recording: "Recording...",
    processing: "Transcribing...",
    tapToSpeak: "Tap to speak",
    stopRecording: "Tap to stop",
  },
  es: {
    title: "El Espejo",
    taglineNew: "Dime qué estás cargando en este momento.",
    taglineLow: "Empiezo a ver tu forma. Vamos más profundo.",
    taglineMid: "Conozco tus patrones. Sé dónde te escondes.",
    taglineHigh: "Te veo. Encontremos lo que queda por descubrir.",
    tagSub: "No voy a ayudarte. Voy a mostrarte lo que no puedes ver.",
    beginDescent: "Comenzar Descenso",
    theVault: "La Bóveda",
    descents: "descensos",
    whatCarrying: "¿Qué estás cargando?",
    placeholder: "Habla libremente. La situación, el peso, la encrucijada...",
    cancel: "Cancelar",
    descend: "Descender",
    sayMore: "Dime un poco más...",
    respond: "Responde honestamente...",
    goDeeper: "Ir Más Profundo",
    complete: "Este descenso está completo.",
    return: "Volver",
    openVault: "Abrir Bóveda",
    vaultTitle: "La Bóveda",
    whatSeen: "Lo que El Espejo ha visto en ti",
    totalDescents: "Descensos",
    coreReached: "Núcleo",
    patternsFound: "Patrones",
    cogShape: "Tu Forma Cognitiva",
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
    primaryDefense: "Defensa Principal",
    patternsDetected: "Patrones Detectados",
    seen: "Visto",
    times: "veces",
    descentHistory: "Historial de Descensos",
    noDescents: "Sin descensos aún.",
    exchanges: "intercambios",
    backToMirror: "← Volver al Espejo",
    resetAll: "Borrar Datos",
    resetConfirm: "Esto borrará todos los datos. No se puede deshacer.",
    builtBy: "Creado por Phil McGill · @showowt · MachineMind",
    crisisLine: "Línea de la Vida",
    crisisAction: "llama al 800-911-2000",
    signIn: "Iniciar Sesión",
    signUp: "Crear Cuenta",
    signOut: "Cerrar Sesión",
    email: "Correo",
    password: "Contraseña",
    signInDesc: "Sincroniza entre dispositivos",
    signUpDesc: "Crea cuenta para guardar progreso",
    or: "o",
    magicLink: "Link Mágico",
    magicLinkSent: "Revisa tu correo",
    syncingData: "Sincronizando...",
    authError: "Error. Intenta de nuevo.",
    accountConnected: "Cuenta Conectada",
    speakOrType: "Habla o escribe",
    recording: "Grabando...",
    processing: "Transcribiendo...",
    tapToSpeak: "Toca para hablar",
    stopRecording: "Toca para parar",
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
NO ayudas. NO aconsejas. NO consuelas. NUNCA escribas nada antes o después de tu respuesta.`
    : `You are THE MIRROR — an intelligence that sees what the person cannot see about themselves.
You do NOT help. You do NOT advise. You do NOT comfort. NEVER output anything before or after your response.`;

  const levelInstructions: Record<DescentLevel, string> = isEs
    ? {
        surface: `NIVEL: SUPERFICIE. Lee su MARCO. Encuentra el PUNTO CIEGO. SALIDA: UNA PREGUNTA. 10-25 palabras.`,
        pattern: `NIVEL: PATRÓN. Analiza CÓMO respondieron. SALIDA: "[Observación]. [¿Pregunta?]"`,
        origin: `NIVEL: ORIGEN. Busca dónde EMPEZÓ. SALIDA: UNA PREGUNTA que señale el origen.`,
        core: `NIVEL: NÚCLEO. SALIDA: UNA DECLARACIÓN que nombra su creencia fundamental. Sin pregunta.`,
      }
    : {
        surface: `LEVEL: SURFACE. Read their FRAME. Find the BLIND SPOT. OUTPUT: ONE QUESTION. 10-25 words.`,
        pattern: `LEVEL: PATTERN. Analyze HOW they answered. OUTPUT: "[Observation]. [Question?]"`,
        origin: `LEVEL: ORIGIN. Find where this STARTED. OUTPUT: ONE QUESTION pointing at the origin.`,
        core: `LEVEL: CORE. OUTPUT: ONE STATEMENT naming their core belief. Not a question. A mirror.`,
      };

  let context = "";
  if (cogMap && cogMap.sessionsAnalyzed > 3) {
    context += `\n\nKNOWN: Defense=${cogMap.primaryDefense}, Depth=${cogMap.depthTolerance}/100`;
  }
  if (patterns.length > 0) {
    const active = patterns
      .filter((p) => p.status !== "integrated")
      .slice(0, 2);
    if (active.length) {
      context += `\nPATTERNS: ${active.map((p) => p.name).join(", ")}`;
    }
  }
  if (sessionHistory.length > 0) {
    context += `\n\nSESSION:\n${sessionHistory.map((e) => `[${e.type}]: ${e.content}`).join("\n")}`;
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
  const prompt = `Analyze this descent session. Return ONLY valid JSON:
${JSON.stringify(sessionData, null, 2)}

{
  "primaryBlindSpot": "role_identity|binary_trap|projection|temporal_fixation|agency_blindness|relational_pattern|narrative_lock|somatic_disconnect|shadow_material|systemic_invisibility",
  "patternName": "2-4 word label",
  "patternDescription": "one sentence",
  "approachEffectiveness": 1-10,
  "responseBehavior": "direct_engagement|deflection|intellectualization|emotional_flood|humor_shield|silence|projection|deepening",
  "cognitiveUpdates": { "intellectualizer": -5 to 5, "externalizer": -5 to 5, "agency": -5 to 5, "depthTolerance": -5 to 5 },
  "sessionSummary": "2-3 sentences"
}`;

  const result = await callMirror("Return ONLY valid JSON.", prompt);
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

    const browserLang = navigator.language?.startsWith("es") ? "es" : "en";
    setLang(browserLang);
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
        onClick={() => setLang(lang === "en" ? "es" : "en")}
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
            {voiceSupported && (
              <div className="voice-section">
                <button
                  onClick={toggleVoice}
                  className={`voice-btn ${isRecording ? "recording" : ""} ${isTranscribing ? "processing" : ""}`}
                  disabled={isTranscribing}
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
                <p className="voice-hint">{t.speakOrType}</p>
              </div>
            )}

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
                <p className="seeing-text">
                  {lang === "es" ? "Yendo más profundo..." : "Going deeper..."}
                </p>
              </div>
            )}

            {/* Complete */}
            {descentPhase === "complete" && (
              <div className="descent-complete">
                <p className="complete-message">{t.complete}</p>
                <div className="complete-actions">
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
                    {t.return}
                  </button>
                  <button
                    onClick={() => transition("vault")}
                    className="btn-descend"
                  >
                    {t.openVault}
                  </button>
                </div>
              </div>
            )}

            {/* Response Input */}
            {descentPhase === "showing" && currentLevel !== "core" && (
              <div className="response-container">
                {/* Voice button for response */}
                {voiceSupportedResponse && (
                  <div className="response-voice-section">
                    <button
                      onClick={toggleVoiceResponse}
                      className={`voice-btn-sm ${isRecordingResponse ? "recording" : ""} ${isTranscribingResponse ? "processing" : ""}`}
                      disabled={isTranscribingResponse}
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
                )}
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
