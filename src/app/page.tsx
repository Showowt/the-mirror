"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { detectCrisis } from "@/lib/prompts";
import { T, detectLang, formatDate } from "@/lib/i18n";
import { useVoice } from "@/lib/useVoice";
import { MicButton } from "@/components/MicButton";
import type { Phase, MirrorCard, Vault, Lang } from "@/lib/types";

/* ═══════════════════════════════════════════════════════════════
   THE MIRROR v2.1 — THE DESCENT — VOICE + BILINGUAL

   Speak what you're carrying. The Mirror listens.
   AI that doesn't help you — it shows you yourself.

   by MachineMind | @showowt | Phil McGill
   ═══════════════════════════════════════════════════════════════ */

// ═══ API Helper ═══
async function callMirror(
  level: string,
  content: string,
  lang: Lang,
): Promise<{ result: unknown; type: string } | null> {
  try {
    const res = await fetch("/api/mirror", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level, content, lang }),
    });
    if (!res.ok) throw new Error("API error");
    return await res.json();
  } catch {
    return null;
  }
}

// ═══ Storage Helpers ═══
function loadVault(): Vault {
  if (typeof window === "undefined") return { cards: [] };
  try {
    const stored = localStorage.getItem("mirror-vault-v3");
    return stored ? JSON.parse(stored) : { cards: [] };
  } catch {
    return { cards: [] };
  }
}

function saveVault(vault: Vault): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("mirror-vault-v3", JSON.stringify(vault));
  } catch (e) {
    console.error("Storage error:", e);
  }
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function MirrorV2() {
  const [lang, setLang] = useState<Lang>("en");
  const [phase, setPhase] = useState<Phase>("landing");
  const [vis, setVis] = useState(false);
  const [text, setText] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [isCrisis, setIsCrisis] = useState(false);

  // Voice interim transcription
  const [interim, setInterim] = useState("");
  const [interimAnswer, setInterimAnswer] = useState("");

  // Descent state
  const [question1, setQuestion1] = useState("");
  const [observation, setObservation] = useState("");
  const [question2, setQuestion2] = useState("");
  const [mirrorCard, setMirrorCard] = useState<MirrorCard | null>(null);

  // Vault
  const [vault, setVault] = useState<Vault>({ cards: [] });

  // Processing
  const [procLevel, setProcLevel] = useState<string>("l1");
  const [pIdx, setPIdx] = useState(0);
  const [pFade, setPFade] = useState(true);
  const pTimer = useRef<number | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const taRef2 = useRef<HTMLTextAreaElement>(null);

  // Get current translations
  const t = T[lang];

  // Processing phrases from translations
  const PHRASES: Record<string, string[]> = {
    l1: t.procL1,
    l2: t.procL2,
    l3: t.procL3,
    card: t.procCard,
  };

  // ═══ Voice Recognition Hooks ═══
  // Voice for main situation input
  const voice1 = useVoice(
    lang,
    useCallback(
      (final: string) => setText((prev) => (prev + " " + final).trim()),
      [],
    ),
    useCallback((im: string) => setInterim(im), []),
  );

  // Voice for answer input
  const voice2 = useVoice(
    lang,
    useCallback(
      (final: string) => setAnswerText((prev) => (prev + " " + final).trim()),
      [],
    ),
    useCallback((im: string) => setInterimAnswer(im), []),
  );

  // ═══ Load vault and detect language on mount ═══
  useEffect(() => {
    setLang(detectLang());
    setVault(loadVault());
    const timer = setTimeout(() => setVis(true), 150);
    return () => clearTimeout(timer);
  }, []);

  // ═══ Cycle processing phrases ═══
  useEffect(() => {
    if (!phase.startsWith("proc")) {
      if (pTimer.current) clearInterval(pTimer.current);
      return;
    }
    const phrases = PHRASES[procLevel] || PHRASES.l1;
    pTimer.current = window.setInterval(() => {
      setPFade(false);
      setTimeout(() => {
        setPIdx((i) => (i + 1) % phrases.length);
        setPFade(true);
      }, 500);
    }, 3000);
    return () => {
      if (pTimer.current) clearInterval(pTimer.current);
    };
  }, [phase, procLevel, PHRASES]);

  // ═══ Transition helper ═══
  const goTo = useCallback(
    (next: Phase, d = 600) => {
      // Stop any active voice recognition when transitioning
      voice1.stop();
      voice2.stop();
      setInterim("");
      setInterimAnswer("");
      setVis(false);
      setTimeout(() => {
        setPhase(next);
        setTimeout(() => setVis(true), 100);
      }, d);
    },
    [voice1, voice2],
  );

  // ═══ Language toggle ═══
  const toggleLang = useCallback(() => {
    setLang((l) => (l === "en" ? "es" : "en"));
  }, []);

  // ═══ Start a new descent ═══
  const startDescent = useCallback(() => {
    setText("");
    setAnswerText("");
    setQuestion1("");
    setObservation("");
    setQuestion2("");
    setMirrorCard(null);
    setIsCrisis(false);
    setInterim("");
    setInterimAnswer("");
    goTo("input");
    setTimeout(() => taRef.current?.focus(), 800);
  }, [goTo]);

  // ═══ LEVEL 1: Get the first question ═══
  const submitSituation = useCallback(async () => {
    if (text.trim().length < 20) return;
    voice1.stop();
    const crisis = detectCrisis(text);
    setIsCrisis(crisis);
    setProcLevel("l1");
    setPIdx(0);
    setPFade(true);
    goTo("proc-l1");

    const response = await callMirror("l1", text.trim(), lang);
    if (!response || !response.result) {
      goTo("input", 500);
      return;
    }
    setQuestion1(response.result as string);
    goTo("question", 800);
  }, [text, goTo, lang, voice1]);

  // ═══ LEVEL 2: User answered, get observation ═══
  const submitAnswer = useCallback(async () => {
    if (answerText.trim().length < 10) return;
    voice2.stop();
    setProcLevel("l2");
    setPIdx(0);
    setPFade(true);
    goTo("proc-l2");

    const situationLabel = lang === "es" ? "SITUACIÓN" : "SITUATION";
    const questionLabel = lang === "es" ? "PREGUNTA HECHA" : "QUESTION ASKED";
    const answerLabel = lang === "es" ? "SU RESPUESTA" : "THEIR ANSWER";

    const content = `${situationLabel}: ${text.trim()}\n\n${questionLabel}: ${question1}\n\n${answerLabel}: ${answerText.trim()}`;
    const response = await callMirror("l2", content, lang);
    if (!response || !response.result) {
      goTo("answer-input", 500);
      return;
    }
    setObservation(response.result as string);
    goTo("observation", 800);
  }, [answerText, text, question1, goTo, lang, voice2]);

  // ═══ LEVEL 3: Deeper question ═══
  const goDeeperQuestion = useCallback(async () => {
    setProcLevel("l3");
    setPIdx(0);
    setPFade(true);
    goTo("proc-l3");

    const situationLabel = lang === "es" ? "SITUACIÓN" : "SITUATION";
    const firstQuestionLabel =
      lang === "es" ? "PRIMERA PREGUNTA" : "FIRST QUESTION";
    const answerLabel = lang === "es" ? "SU RESPUESTA" : "THEIR ANSWER";
    const observationLabel = lang === "es" ? "OBSERVACIÓN" : "OBSERVATION";

    const content = `${situationLabel}: ${text.trim()}\n\n${firstQuestionLabel}: ${question1}\n\n${answerLabel}: ${answerText.trim()}\n\n${observationLabel}: ${observation}`;
    const response = await callMirror("l3", content, lang);
    if (!response || !response.result) {
      goTo("observation", 500);
      return;
    }
    setQuestion2(response.result as string);
    goTo("deeper", 800);
  }, [text, question1, answerText, observation, goTo, lang]);

  // ═══ LEVEL 4: Generate mirror card ═══
  const generateCard = useCallback(async () => {
    setProcLevel("card");
    setPIdx(0);
    setPFade(true);
    goTo("proc-card");

    const situationLabel = lang === "es" ? "SITUACIÓN" : "SITUATION";
    const q1Label = lang === "es" ? "PREGUNTA 1" : "QUESTION 1";
    const answerLabel = lang === "es" ? "RESPUESTA" : "ANSWER";
    const obsLabel = lang === "es" ? "OBSERVACIÓN" : "OBSERVATION";
    const q2Label = lang === "es" ? "PREGUNTA 2" : "QUESTION 2";
    const noAnswerText =
      lang === "es"
        ? "[Usuario eligió no responder]"
        : "[User chose not to answer]";
    const skippedText = lang === "es" ? "[Saltado]" : "[Skipped]";
    const notReachedText = lang === "es" ? "[No alcanzado]" : "[Not reached]";

    const content = `${situationLabel}: ${text.trim()}\n\n${q1Label}: ${question1}\n\n${answerLabel}: ${answerText.trim() || noAnswerText}\n\n${obsLabel}: ${observation || skippedText}\n\n${q2Label}: ${question2 || notReachedText}`;
    const response = await callMirror("card", content, lang);

    let card: MirrorCard;

    if (response?.type === "card" && response.result) {
      const cardData = response.result as {
        pattern_name: string;
        core_question: string;
        pattern_revealed: string;
        still_unseen: string;
      };
      card = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        pattern_name:
          cardData.pattern_name ||
          (lang === "es" ? "Territorio Inexplorado" : "Uncharted Territory"),
        core_question: cardData.core_question || question2 || question1,
        pattern_revealed:
          cardData.pattern_revealed ||
          (lang === "es"
            ? "Un patrón se está formando."
            : "A pattern is forming."),
        still_unseen:
          cardData.still_unseen ||
          (lang === "es"
            ? "Algo bajo la superficie espera ser visto."
            : "Something beneath the surface waits to be seen."),
        situation_preview: text.trim().slice(0, 140),
        question1,
        question2: question2 || "",
        lang,
      };
    } else {
      card = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        pattern_name:
          lang === "es" ? "Territorio Inexplorado" : "Uncharted Territory",
        core_question: question2 || question1,
        pattern_revealed:
          observation ||
          (lang === "es"
            ? "Un patrón se está formando."
            : "A pattern is forming."),
        still_unseen:
          lang === "es"
            ? "Algo bajo la superficie espera ser visto."
            : "Something beneath the surface waits to be seen.",
        situation_preview: text.trim().slice(0, 140),
        question1,
        question2: question2 || "",
        lang,
      };
    }

    setMirrorCard(card);

    const newVault = { ...vault, cards: [...vault.cards, card] };
    setVault(newVault);
    saveVault(newVault);

    goTo("card", 900);
  }, [text, question1, answerText, observation, question2, vault, goTo, lang]);

  // ═══ Reset vault ═══
  const resetVault = useCallback(() => {
    const confirmMsg =
      lang === "es"
        ? "¿Limpiar todas las Cartas del Espejo de la Bóveda? Esto no se puede deshacer."
        : "Clear all Mirror Cards from the Vault? This cannot be undone.";
    if (!confirm(confirmMsg)) return;
    const v = { cards: [] as MirrorCard[] };
    setVault(v);
    saveVault(v);
  }, [lang]);

  // ═══ Group cards by pattern ═══
  const patternGroups: Record<string, MirrorCard[]> = {};
  vault.cards.forEach((c) => {
    const p = c.pattern_name || (lang === "es" ? "Inexplorado" : "Uncharted");
    if (!patternGroups[p]) patternGroups[p] = [];
    patternGroups[p].push(c);
  });

  const handleKeyDown = useCallback(
    (fn: () => void) => (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        fn();
      }
    },
    [],
  );

  const canSubmitSituation = text.trim().length >= 20;
  const canSubmitAnswer = answerText.trim().length >= 10;

  /* ═══════════════════════════════════════════════════════════════
     SUB-COMPONENTS
     ═══════════════════════════════════════════════════════════════ */

  // Language Toggle
  const LangToggle = () => (
    <button
      onClick={toggleLang}
      className="lang-toggle"
      aria-label={lang === "en" ? "Switch to Spanish" : "Cambiar a Inglés"}
    >
      {lang === "en" ? "ES" : "EN"}
    </button>
  );

  // Crisis Banner
  const CrisisBanner = () => (
    <div className="crisis-banner">
      <span className="crisis-dot" />
      <span>
        {t.crisisText} <strong className="text-white/70">{t.crisisLine}</strong>{" "}
        — {t.crisisAction}
      </span>
    </div>
  );

  // Descent Level Indicator
  const DescentLevel = ({ level }: { level: number }) => (
    <div className="level-indicator mb-8">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`level-dot ${i <= level ? "level-dot-active" : "level-dot-inactive"}`}
        />
      ))}
      <span className="text-micro text-white/15 ml-3">
        {t.levelLabel} {level}
      </span>
    </div>
  );

  // Processing Screen
  const Processing = () => {
    const phrases = PHRASES[procLevel] || PHRASES.l1;
    return (
      <div
        className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-12 w-full min-h-[60vh]"
        style={{
          opacity: vis ? 1 : 0,
          transition: "opacity 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)",
        }}
      >
        {/* Pulsing orb */}
        <div className="relative w-5 h-5 mb-12">
          <div className="absolute inset-0 rounded-full bg-white/20 animate-breathe-slow" />
          <div className="absolute top-1/2 left-1/2 w-5 h-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 animate-pulse1" />
          <div className="absolute top-1/2 left-1/2 w-5 h-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5 animate-pulse2" />
        </div>
        <p
          className="text-small text-white/25 tracking-[0.12em] lowercase transition-opacity duration-500"
          style={{ opacity: pFade ? 1 : 0 }}
        >
          {phrases[pIdx % phrases.length]}
        </p>
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */
  return (
    <main className="min-h-screen min-h-[100dvh] w-full bg-[#050505] flex items-center justify-center relative overflow-hidden font-body">
      {/* Atmospheric layers */}
      <div className="grain-overlay" />
      <div className="vignette" />
      <div className="center-glow" />

      {/* Language Toggle */}
      <LangToggle />

      {/* ═══ LANDING ═══ */}
      {phase === "landing" && (
        <div
          className="relative z-10 flex flex-col items-center justify-center text-center px-8 py-12 max-w-[640px] w-full"
          style={{
            opacity: vis ? 1 : 0,
            transition: "opacity 1.2s cubic-bezier(0.25, 0.1, 0.25, 1)",
          }}
        >
          {/* Spinning ring with breathing dot */}
          <div className="w-16 h-16 rounded-full border border-white/[0.05] flex items-center justify-center mb-10 animate-spin-slow">
            <div className="w-1.5 h-1.5 rounded-full bg-white/30 animate-breathe" />
          </div>

          <h1 className="text-title text-white mb-6">{t.title}</h1>

          <div className="divider mb-8" />

          <p className="text-body text-white/50 mb-3 max-w-[400px]">
            {t.tagline}
          </p>
          <p className="text-small text-white/25 mb-12 max-w-[380px]">
            {t.tagSub}
          </p>

          <div className="flex flex-col items-center gap-4">
            <button onClick={startDescent} className="btn-primary">
              {t.beginDescent}
            </button>
            {vault.cards.length > 0 && (
              <button onClick={() => goTo("vault")} className="btn-ghost">
                {t.theVault} · {vault.cards.length}{" "}
                {vault.cards.length !== 1 ? t.cards : t.card}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ═══ INPUT ═══ */}
      {phase === "input" && (
        <div
          className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-12 max-w-[640px] w-full"
          style={{
            opacity: vis ? 1 : 0,
            transition: "opacity 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)",
          }}
        >
          <DescentLevel level={1} />

          <p className="text-question text-white/65 mb-3 max-w-[500px]">
            {t.promptL1}
          </p>
          <p className="text-small text-white/20 mb-8">{t.promptL1Sub}</p>

          <div className="w-full relative mb-6">
            <textarea
              ref={taRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown(submitSituation)}
              placeholder={t.placeholder}
              maxLength={3000}
              rows={7}
              className="textarea-mirror"
            />
            {text.length > 0 && (
              <span className="absolute bottom-3 right-4 text-micro text-white/10">
                {text.length}/3000
              </span>
            )}
          </div>

          {/* Interim transcription */}
          {interim && <p className="interim-text mb-4">{interim}</p>}

          {/* Input actions: Mic + Submit */}
          <div className="input-actions">
            <MicButton
              listening={voice1.listening}
              supported={voice1.supported}
              onToggle={voice1.toggle}
              label={t.micTap}
              listenLabel={t.micListening}
            />
            <button
              onClick={submitSituation}
              disabled={!canSubmitSituation}
              className="btn-submit"
              style={{
                opacity: canSubmitSituation ? 1 : 0.2,
                cursor: canSubmitSituation ? "pointer" : "default",
              }}
            >
              {t.submitBtn}
            </button>
          </div>

          {text.length > 0 && !canSubmitSituation && (
            <p className="text-micro text-white/20 mt-4">{t.sayMore}</p>
          )}
        </div>
      )}

      {/* ═══ PROCESSING ═══ */}
      {phase.startsWith("proc") && <Processing />}

      {/* ═══ LEVEL 1: THE QUESTION ═══ */}
      {phase === "question" && (
        <div
          className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-12 max-w-[640px] w-full"
          style={{
            opacity: vis ? 1 : 0,
            transition: "opacity 2s cubic-bezier(0.25, 0.1, 0.25, 1)",
          }}
        >
          <DescentLevel level={1} />
          {isCrisis && <CrisisBanner />}

          <div className="max-w-[540px] relative mb-8">
            <span className="quote-mark block mb-[-60px]">&ldquo;</span>
            <p className="text-question text-white/90">{question1}</p>
          </div>

          <div className="flex flex-col items-center gap-3 mt-8">
            <button
              onClick={() => {
                goTo("answer-input");
                setTimeout(() => taRef2.current?.focus(), 800);
              }}
              className="btn-secondary"
            >
              {t.answerThis}
            </button>
            <button
              onClick={() => {
                setAnswerText("");
                generateCard();
              }}
              className="btn-ghost"
            >
              {t.thatsEnough}
            </button>
          </div>

          <p className="text-micro text-white/8 mt-12">{t.level1}</p>
        </div>
      )}

      {/* ═══ LEVEL 2 INPUT ═══ */}
      {phase === "answer-input" && (
        <div
          className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-12 max-w-[640px] w-full"
          style={{
            opacity: vis ? 1 : 0,
            transition: "opacity 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)",
          }}
        >
          <DescentLevel level={2} />
          {isCrisis && <CrisisBanner />}

          <p className="text-label text-white/20 mb-4">{t.questionWas}</p>
          <p className="text-question text-white/50 text-[clamp(17px,3vw,22px)] max-w-[480px] mb-6">
            {question1}
          </p>

          <div className="divider mb-6" />

          <p className="text-small text-white/25 mb-8">{t.answerIt}</p>

          <div className="w-full relative mb-6">
            <textarea
              ref={taRef2}
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              onKeyDown={handleKeyDown(submitAnswer)}
              placeholder={t.answerPlaceholder}
              maxLength={2000}
              rows={5}
              className="textarea-mirror min-h-[140px]"
            />
          </div>

          {/* Interim transcription */}
          {interimAnswer && (
            <p className="interim-text mb-4">{interimAnswer}</p>
          )}

          {/* Input actions: Mic + Submit */}
          <div className="input-actions">
            <MicButton
              listening={voice2.listening}
              supported={voice2.supported}
              onToggle={voice2.toggle}
              label={t.micTap}
              listenLabel={t.micListening}
            />
            <button
              onClick={submitAnswer}
              disabled={!canSubmitAnswer}
              className="btn-submit"
              style={{
                opacity: canSubmitAnswer ? 1 : 0.2,
                cursor: canSubmitAnswer ? "pointer" : "default",
              }}
            >
              {t.goDeeper}
            </button>
          </div>
        </div>
      )}

      {/* ═══ LEVEL 2: OBSERVATION ═══ */}
      {phase === "observation" && (
        <div
          className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-12 max-w-[640px] w-full"
          style={{
            opacity: vis ? 1 : 0,
            transition: "opacity 1.5s cubic-bezier(0.25, 0.1, 0.25, 1)",
          }}
        >
          <DescentLevel level={2} />
          {isCrisis && <CrisisBanner />}

          <p className="text-label text-white/20 mb-6">{t.mirrorSees}</p>
          <p className="text-observation text-white/75 max-w-[500px] mb-12">
            {observation}
          </p>

          <button onClick={goDeeperQuestion} className="btn-secondary">
            {t.goDeeper}
          </button>

          <p className="text-micro text-white/8 mt-12">{t.level2}</p>
        </div>
      )}

      {/* ═══ LEVEL 3: DEEPER QUESTION ═══ */}
      {phase === "deeper" && (
        <div
          className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-12 max-w-[640px] w-full"
          style={{
            opacity: vis ? 1 : 0,
            transition: "opacity 2s cubic-bezier(0.25, 0.1, 0.25, 1)",
          }}
        >
          <DescentLevel level={3} />
          {isCrisis && <CrisisBanner />}

          <div className="max-w-[540px] relative mb-8">
            <span className="quote-mark block mb-[-60px]">&ldquo;</span>
            <p className="text-question text-white/90">{question2}</p>
          </div>

          <button onClick={generateCard} className="btn-secondary mt-8">
            {t.completeDescent}
          </button>

          <p className="text-micro text-white/8 mt-12">{t.level3}</p>
        </div>
      )}

      {/* ═══ LEVEL 4: MIRROR CARD ═══ */}
      {phase === "card" && mirrorCard && (
        <div
          className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-12 max-w-[640px] w-full"
          style={{
            opacity: vis ? 1 : 0,
            transition: "opacity 1.5s cubic-bezier(0.25, 0.1, 0.25, 1)",
          }}
        >
          <DescentLevel level={4} />
          {isCrisis && <CrisisBanner />}

          <div className="mirror-card card-reveal">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-white/10 text-sm">◯</span>
              <span className="text-label text-white/20">{t.mirrorCard}</span>
            </div>

            <h2 className="font-display text-[28px] font-light text-white/90 text-left mb-5">
              {mirrorCard.pattern_name}
            </h2>

            <div className="divider-full mb-6" />

            <div className="text-left mb-5">
              <span className="text-label text-white/20 block mb-2">
                {t.cutDeepest}
              </span>
              <p className="font-display text-[16px] font-light italic text-white/70 leading-relaxed">
                {mirrorCard.core_question}
              </p>
            </div>

            <div className="text-left mb-5">
              <span className="text-label text-white/20 block mb-2">
                {t.patternRevealed}
              </span>
              <p className="text-body text-white/55">
                {mirrorCard.pattern_revealed}
              </p>
            </div>

            <div className="text-left mb-4">
              <span className="text-label text-white/20 block mb-2">
                {t.stillUnseen}
              </span>
              <p className="text-body text-white/65 italic">
                {mirrorCard.still_unseen}
              </p>
            </div>

            <div className="flex justify-end mt-6">
              <span className="text-micro text-white/15">
                {formatDate(mirrorCard.date, lang, "long")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-8">
            <button onClick={startDescent} className="btn-secondary">
              {t.newDescent}
            </button>
            {vault.cards.length > 0 && (
              <button onClick={() => goTo("vault")} className="btn-ghost">
                {t.openVault}
              </button>
            )}
          </div>

          <p className="text-micro text-white/8 mt-12">{t.credit}</p>
        </div>
      )}

      {/* ═══ THE VAULT ═══ */}
      {phase === "vault" && (
        <div
          className="relative z-10 flex flex-col items-center px-6 py-16 max-w-[720px] w-full min-h-screen"
          style={{
            opacity: vis ? 1 : 0,
            transition: "opacity 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)",
          }}
        >
          <h1 className="font-display text-[clamp(40px,10vw,64px)] font-light text-white tracking-[0.04em] mb-4">
            {t.vaultTitle}
          </h1>
          <p className="text-small text-white/25 tracking-wide mb-8">
            {vault.cards.length}{" "}
            {vault.cards.length !== 1 ? t.descents : t.descent} ·{" "}
            {Object.keys(patternGroups).length}{" "}
            {Object.keys(patternGroups).length !== 1 ? t.patterns : t.pattern}{" "}
            {t.identified}
          </p>

          <div className="divider mb-10" />

          {vault.cards.length === 0 ? (
            <p className="text-body text-white/20 italic mt-8">
              {t.noDescents}
            </p>
          ) : (
            <div className="w-full flex flex-col gap-10">
              {Object.entries(patternGroups).map(([pattern, cards]) => (
                <div key={pattern} className="w-full text-left">
                  <div className="flex justify-between items-baseline mb-4 pb-3 border-b border-white/5">
                    <span className="font-display text-[24px] font-light text-white/75">
                      {pattern}
                    </span>
                    <span className="text-micro text-white/15">
                      {cards.length} {cards.length !== 1 ? t.cards : t.card}
                    </span>
                  </div>
                  {cards
                    .slice()
                    .reverse()
                    .map((c) => (
                      <div
                        key={c.id}
                        className="py-5 border-b border-white/[0.03]"
                      >
                        <p className="font-display text-[15px] font-light italic text-white/60 leading-relaxed mb-2">
                          {c.core_question}
                        </p>
                        <p className="text-small text-white/35 leading-relaxed mb-1">
                          {c.pattern_revealed}
                        </p>
                        <p className="text-small text-white/45 italic leading-relaxed mb-2">
                          {c.still_unseen}
                        </p>
                        <span className="text-micro text-white/10">
                          {formatDate(c.date, c.lang || lang, "short")}
                        </span>
                      </div>
                    ))}
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap justify-center items-center gap-4 mt-12">
            <button onClick={startDescent} className="btn-secondary">
              {t.newDescent}
            </button>
            <button onClick={() => goTo("landing")} className="btn-ghost">
              {t.back}
            </button>
            {vault.cards.length > 0 && (
              <button
                onClick={resetVault}
                className="btn-ghost text-red-300/30 hover:text-red-300/50"
              >
                {t.clearVault}
              </button>
            )}
          </div>

          <p className="text-micro text-white/8 mt-12">{t.vaultCredit}</p>
        </div>
      )}
    </main>
  );
}
