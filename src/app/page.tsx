"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { detectCrisis } from "@/lib/prompts";
import type { Phase, MirrorCard, Vault } from "@/lib/types";

/* ═══════════════════════════════════════════════════════════════
   THE MIRROR v2 — THE DESCENT

   A sacred space for self-reflection.
   AI that doesn't help you — it shows you yourself.

   by MachineMind | @showowt | Phil McGill
   ═══════════════════════════════════════════════════════════════ */

const PHRASES: Record<string, string[]> = {
  l1: [
    "Reading between your words",
    "Finding the shape of your perspective",
    "Locating the blind spot",
  ],
  l2: [
    "Reading your answer",
    "Tracing the pattern underneath",
    "Seeing what the words reveal",
  ],
  l3: [
    "Going deeper",
    "Finding what created the blind spot",
    "Reaching the foundation",
  ],
  card: [
    "Crystallizing the descent",
    "Forging your Mirror Card",
    "Capturing what was seen",
  ],
};

// ═══ API Helper ═══
async function callMirror(
  level: string,
  content: string,
): Promise<{ result: unknown; type: string } | null> {
  try {
    const res = await fetch("/api/mirror", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level, content }),
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
    const stored = localStorage.getItem("mirror-vault");
    return stored ? JSON.parse(stored) : { cards: [] };
  } catch {
    return { cards: [] };
  }
}

function saveVault(vault: Vault): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("mirror-vault", JSON.stringify(vault));
  } catch (e) {
    console.error("Storage error:", e);
  }
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function MirrorV2() {
  const [phase, setPhase] = useState<Phase>("landing");
  const [vis, setVis] = useState(false);
  const [text, setText] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [isCrisis, setIsCrisis] = useState(false);

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

  // ═══ Load vault on mount ═══
  useEffect(() => {
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
  }, [phase, procLevel]);

  // ═══ Transition helper ═══
  const goTo = useCallback((next: Phase, d = 600) => {
    setVis(false);
    setTimeout(() => {
      setPhase(next);
      setTimeout(() => setVis(true), 100);
    }, d);
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
    goTo("input");
    setTimeout(() => taRef.current?.focus(), 800);
  }, [goTo]);

  // ═══ LEVEL 1: Get the first question ═══
  const submitSituation = useCallback(async () => {
    if (text.trim().length < 20) return;
    const crisis = detectCrisis(text);
    setIsCrisis(crisis);
    setProcLevel("l1");
    setPIdx(0);
    setPFade(true);
    goTo("proc-l1");

    const response = await callMirror("l1", text.trim());
    if (!response || !response.result) {
      goTo("input", 500);
      return;
    }
    setQuestion1(response.result as string);
    goTo("question", 800);
  }, [text, goTo]);

  // ═══ LEVEL 2: User answered, get observation ═══
  const submitAnswer = useCallback(async () => {
    if (answerText.trim().length < 10) return;
    setProcLevel("l2");
    setPIdx(0);
    setPFade(true);
    goTo("proc-l2");

    const content = `SITUATION: ${text.trim()}\n\nQUESTION ASKED: ${question1}\n\nTHEIR ANSWER: ${answerText.trim()}`;
    const response = await callMirror("l2", content);
    if (!response || !response.result) {
      goTo("answer-input", 500);
      return;
    }
    setObservation(response.result as string);
    goTo("observation", 800);
  }, [answerText, text, question1, goTo]);

  // ═══ LEVEL 3: Deeper question ═══
  const goDeeperQuestion = useCallback(async () => {
    setProcLevel("l3");
    setPIdx(0);
    setPFade(true);
    goTo("proc-l3");

    const content = `SITUATION: ${text.trim()}\n\nFIRST QUESTION: ${question1}\n\nTHEIR ANSWER: ${answerText.trim()}\n\nOBSERVATION: ${observation}`;
    const response = await callMirror("l3", content);
    if (!response || !response.result) {
      goTo("observation", 500);
      return;
    }
    setQuestion2(response.result as string);
    goTo("deeper", 800);
  }, [text, question1, answerText, observation, goTo]);

  // ═══ LEVEL 4: Generate mirror card ═══
  const generateCard = useCallback(async () => {
    setProcLevel("card");
    setPIdx(0);
    setPFade(true);
    goTo("proc-card");

    const content = `SITUATION: ${text.trim()}\n\nQUESTION 1: ${question1}\n\nANSWER: ${answerText.trim() || "[User chose not to answer]"}\n\nOBSERVATION: ${observation || "[Skipped]"}\n\nQUESTION 2: ${question2 || "[Not reached]"}`;
    const response = await callMirror("card", content);

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
        pattern_name: cardData.pattern_name || "Uncharted Territory",
        core_question: cardData.core_question || question2 || question1,
        pattern_revealed: cardData.pattern_revealed || "A pattern is forming.",
        still_unseen:
          cardData.still_unseen ||
          "Something beneath the surface waits to be seen.",
        situation_preview: text.trim().slice(0, 140),
        question1,
        question2: question2 || "",
      };
    } else {
      card = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        pattern_name: "Uncharted Territory",
        core_question: question2 || question1,
        pattern_revealed: observation || "A pattern is forming.",
        still_unseen: "Something beneath the surface waits to be seen.",
        situation_preview: text.trim().slice(0, 140),
        question1,
        question2: question2 || "",
      };
    }

    setMirrorCard(card);

    const newVault = { ...vault, cards: [...vault.cards, card] };
    setVault(newVault);
    saveVault(newVault);

    goTo("card", 900);
  }, [text, question1, answerText, observation, question2, vault, goTo]);

  // ═══ Reset vault ═══
  const resetVault = useCallback(() => {
    if (
      !confirm("Clear all Mirror Cards from the Vault? This cannot be undone.")
    )
      return;
    const v = { cards: [] as MirrorCard[] };
    setVault(v);
    saveVault(v);
  }, []);

  // ═══ Group cards by pattern ═══
  const patternGroups: Record<string, MirrorCard[]> = {};
  vault.cards.forEach((c) => {
    const p = c.pattern_name || "Uncharted";
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

  // Crisis Banner
  const CrisisBanner = () => (
    <div className="crisis-banner">
      <span className="crisis-dot" />
      <span>
        If you&apos;re in crisis:{" "}
        <strong className="text-white/70">
          988 Suicide &amp; Crisis Lifeline
        </strong>{" "}
        — call or text <strong className="text-white/70">988</strong>
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
      <span className="text-micro text-white/15 ml-3">Level {level}</span>
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

          <h1 className="text-title text-white mb-6">The Mirror</h1>

          <div className="divider mb-8" />

          <p className="text-body text-white/50 mb-3 max-w-[400px]">
            Tell me what you&apos;re carrying right now.
          </p>
          <p className="text-small text-white/25 mb-12 max-w-[380px]">
            I won&apos;t help you. I&apos;ll show you what you can&apos;t see.
          </p>

          <div className="flex flex-col items-center gap-4">
            <button onClick={startDescent} className="btn-primary">
              Begin a descent
            </button>
            {vault.cards.length > 0 && (
              <button onClick={() => goTo("vault")} className="btn-ghost">
                The Vault · {vault.cards.length}
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
            What&apos;s the situation, the decision, the thing weighing on you?
          </p>
          <p className="text-small text-white/20 mb-8">
            Don&apos;t organize it. Don&apos;t make it make sense. Just say it.
          </p>

          <div className="w-full relative mb-6">
            <textarea
              ref={taRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown(submitSituation)}
              placeholder="Start typing..."
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

          <button
            onClick={submitSituation}
            disabled={!canSubmitSituation}
            className="btn-submit"
            style={{
              opacity: canSubmitSituation ? 1 : 0.2,
              cursor: canSubmitSituation ? "pointer" : "default",
            }}
          >
            Show me what I can&apos;t see
          </button>

          {text.length > 0 && !canSubmitSituation && (
            <p className="text-micro text-white/20 mt-4">
              Say a little more...
            </p>
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
              Answer this question
            </button>
            <button
              onClick={() => {
                setAnswerText("");
                generateCard();
              }}
              className="btn-ghost"
            >
              That&apos;s enough
            </button>
          </div>

          <p className="text-micro text-white/8 mt-12">
            Level 1 — The Question
          </p>
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

          <p className="text-label text-white/20 mb-4">The question was:</p>
          <p className="text-question text-white/50 text-[clamp(17px,3vw,22px)] max-w-[480px] mb-6">
            {question1}
          </p>

          <div className="divider mb-6" />

          <p className="text-small text-white/25 mb-8">
            Answer it. Don&apos;t explain your situation more. Answer the
            question.
          </p>

          <div className="w-full relative mb-6">
            <textarea
              ref={taRef2}
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              onKeyDown={handleKeyDown(submitAnswer)}
              placeholder="Your answer..."
              maxLength={2000}
              rows={5}
              className="textarea-mirror min-h-[140px]"
            />
          </div>

          <button
            onClick={submitAnswer}
            disabled={!canSubmitAnswer}
            className="btn-submit"
            style={{
              opacity: canSubmitAnswer ? 1 : 0.2,
              cursor: canSubmitAnswer ? "pointer" : "default",
            }}
          >
            Go deeper
          </button>
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

          <p className="text-label text-white/20 mb-6">The Mirror sees:</p>
          <p className="text-observation text-white/75 max-w-[500px] mb-12">
            {observation}
          </p>

          <button onClick={goDeeperQuestion} className="btn-secondary">
            Go deeper
          </button>

          <p className="text-micro text-white/8 mt-12">
            Level 2 — The Observation
          </p>
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
            Complete the descent
          </button>

          <p className="text-micro text-white/8 mt-12">
            Level 3 — The Deeper Question
          </p>
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
              <span className="text-label text-white/20">MIRROR CARD</span>
            </div>

            <h2 className="font-display text-[28px] font-light text-white/90 text-left mb-5">
              {mirrorCard.pattern_name}
            </h2>

            <div className="divider-full mb-6" />

            <div className="text-left mb-5">
              <span className="text-label text-white/20 block mb-2">
                The question that cut deepest
              </span>
              <p className="font-display text-[16px] font-light italic text-white/70 leading-relaxed">
                {mirrorCard.core_question}
              </p>
            </div>

            <div className="text-left mb-5">
              <span className="text-label text-white/20 block mb-2">
                The pattern revealed
              </span>
              <p className="text-body text-white/55">
                {mirrorCard.pattern_revealed}
              </p>
            </div>

            <div className="text-left mb-4">
              <span className="text-label text-white/20 block mb-2">
                What you might still not see
              </span>
              <p className="text-body text-white/65 italic">
                {mirrorCard.still_unseen}
              </p>
            </div>

            <div className="flex justify-end mt-6">
              <span className="text-micro text-white/15">
                {new Date(mirrorCard.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-8">
            <button onClick={startDescent} className="btn-secondary">
              New descent
            </button>
            {vault.cards.length > 0 && (
              <button onClick={() => goTo("vault")} className="btn-ghost">
                Open the Vault
              </button>
            )}
          </div>

          <p className="text-micro text-white/8 mt-12">
            The Mirror — MachineMind
          </p>
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
            The Vault
          </h1>
          <p className="text-small text-white/25 tracking-wide mb-8">
            {vault.cards.length} descent{vault.cards.length !== 1 ? "s" : ""} ·{" "}
            {Object.keys(patternGroups).length} pattern
            {Object.keys(patternGroups).length !== 1 ? "s" : ""} identified
          </p>

          <div className="divider mb-10" />

          {vault.cards.length === 0 ? (
            <p className="text-body text-white/20 italic mt-8">
              No descents yet. Your pattern map builds with each one.
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
                      {cards.length} card{cards.length !== 1 ? "s" : ""}
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
                          {new Date(c.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    ))}
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap justify-center items-center gap-4 mt-12">
            <button onClick={startDescent} className="btn-secondary">
              New descent
            </button>
            <button onClick={() => goTo("landing")} className="btn-ghost">
              Back
            </button>
            {vault.cards.length > 0 && (
              <button
                onClick={resetVault}
                className="btn-ghost text-red-300/30 hover:text-red-300/50"
              >
                Clear vault
              </button>
            )}
          </div>

          <p className="text-micro text-white/8 mt-12">
            The Mirror — MachineMind — @showowt
          </p>
        </div>
      )}
    </main>
  );
}
