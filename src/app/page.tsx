"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { detectCrisis } from "@/lib/prompts";
import type { Phase, MirrorCard, Vault } from "@/lib/types";

// ═══════════════════════════════════════════════════════════════
// THE MIRROR v2 — THE DESCENT
// by MachineMind | @showowt | Phil McGill
//
// 4 levels. Mirror Cards. The Vault. Crisis safety.
// AI that doesn't help you — it shows you yourself.
// ═══════════════════════════════════════════════════════════════

const PHRASES = {
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

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
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
  const [procPhrases, setProcPhrases] = useState<string[]>([]);
  const [pIdx, setPIdx] = useState(0);
  const [pFade, setPFade] = useState(true);
  const pTimer = useRef<number | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const taRef2 = useRef<HTMLTextAreaElement>(null);

  // ═══ Load vault on mount ═══
  useEffect(() => {
    setVault(loadVault());
    setTimeout(() => setVis(true), 80);
  }, []);

  // ═══ Cycle processing phrases ═══
  useEffect(() => {
    if (!phase.startsWith("proc")) {
      if (pTimer.current) clearInterval(pTimer.current);
      return;
    }
    pTimer.current = window.setInterval(() => {
      setPFade(false);
      setTimeout(() => {
        setPIdx((i) => (i + 1) % procPhrases.length);
        setPFade(true);
      }, 400);
    }, 2600);
    return () => {
      if (pTimer.current) clearInterval(pTimer.current);
    };
  }, [phase, procPhrases.length]);

  // ═══ Transition helper ═══
  const goTo = useCallback((next: Phase, d = 500) => {
    setVis(false);
    setTimeout(() => {
      setPhase(next);
      setTimeout(() => setVis(true), 60);
    }, d);
  }, []);

  // ═══ Start a new descent ═══
  const startDescent = () => {
    setText("");
    setAnswerText("");
    setQuestion1("");
    setObservation("");
    setQuestion2("");
    setMirrorCard(null);
    setIsCrisis(false);
    goTo("input");
    setTimeout(() => taRef.current?.focus(), 600);
  };

  // ═══ LEVEL 1: Get the first question ═══
  const submitSituation = useCallback(async () => {
    if (text.trim().length < 20) return;
    const crisis = detectCrisis(text);
    setIsCrisis(crisis);
    setProcPhrases(PHRASES.l1);
    setPIdx(0);
    setPFade(true);
    goTo("proc-l1");

    const response = await callMirror("l1", text.trim());
    if (!response || !response.result) {
      goTo("input", 400);
      return;
    }
    setQuestion1(response.result as string);
    goTo("question", 700);
  }, [text, goTo]);

  // ═══ LEVEL 2: User answered, get observation ═══
  const submitAnswer = useCallback(async () => {
    if (answerText.trim().length < 10) return;
    setProcPhrases(PHRASES.l2);
    setPIdx(0);
    setPFade(true);
    goTo("proc-l2");

    const content = `SITUATION: ${text.trim()}\n\nQUESTION ASKED: ${question1}\n\nTHEIR ANSWER: ${answerText.trim()}`;
    const response = await callMirror("l2", content);
    if (!response || !response.result) {
      goTo("answer-input", 400);
      return;
    }
    setObservation(response.result as string);
    goTo("observation", 700);
  }, [answerText, text, question1, goTo]);

  // ═══ LEVEL 3: Deeper question ═══
  const goDeeperQuestion = useCallback(async () => {
    setProcPhrases(PHRASES.l3);
    setPIdx(0);
    setPFade(true);
    goTo("proc-l3");

    const content = `SITUATION: ${text.trim()}\n\nFIRST QUESTION: ${question1}\n\nTHEIR ANSWER: ${answerText.trim()}\n\nOBSERVATION: ${observation}`;
    const response = await callMirror("l3", content);
    if (!response || !response.result) {
      goTo("observation", 400);
      return;
    }
    setQuestion2(response.result as string);
    goTo("deeper", 700);
  }, [text, question1, answerText, observation, goTo]);

  // ═══ LEVEL 4: Generate mirror card ═══
  const generateCard = useCallback(async () => {
    setProcPhrases(PHRASES.card);
    setPIdx(0);
    setPFade(true);
    goTo("proc-card");

    const content = `SITUATION: ${text.trim()}\n\nQUESTION 1: ${question1}\n\nANSWER: ${answerText.trim()}\n\nOBSERVATION: ${observation}\n\nQUESTION 2: ${question2}`;
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
        pattern_name: cardData.pattern_name || "Uncharted",
        core_question: cardData.core_question || question2 || question1,
        pattern_revealed: cardData.pattern_revealed || "Pattern still forming.",
        still_unseen:
          cardData.still_unseen ||
          "The descent revealed something that needs more time to surface.",
        situation_preview: text.trim().slice(0, 120),
        question1,
        question2,
      };
    } else {
      // Fallback card
      card = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        pattern_name: "Uncharted",
        core_question: question2 || question1,
        pattern_revealed: observation || "Pattern still forming.",
        still_unseen:
          "The descent revealed something that needs more time to surface.",
        situation_preview: text.trim().slice(0, 120),
        question1,
        question2,
      };
    }

    setMirrorCard(card);

    // Save to vault
    const newVault = { ...vault, cards: [...vault.cards, card] };
    setVault(newVault);
    saveVault(newVault);

    goTo("card", 700);
  }, [text, question1, answerText, observation, question2, vault, goTo]);

  // ═══ Reset vault ═══
  const resetVault = () => {
    const v = { cards: [] };
    setVault(v);
    saveVault(v);
  };

  // ═══ Group cards by pattern ═══
  const patternGroups: Record<string, MirrorCard[]> = {};
  vault.cards.forEach((c) => {
    const p = c.pattern_name || "Uncharted";
    if (!patternGroups[p]) patternGroups[p] = [];
    patternGroups[p].push(c);
  });

  const onKey =
    (fn: () => void) => (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        fn();
      }
    };

  const ok1 = text.trim().length >= 20;
  const ok2 = answerText.trim().length >= 10;

  // ═══ Crisis Banner Component ═══
  const CrisisBanner = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white/[0.03] border-t border-white/[0.06] px-5 py-3 text-[13px] font-light text-white/45 text-center z-[100] backdrop-blur-md">
      <span className="text-red-300/50 mr-2 text-[8px] align-middle">●</span>
      <span>
        If you&apos;re in crisis:{" "}
        <strong>988 Suicide &amp; Crisis Lifeline</strong> — call or text{" "}
        <strong>988</strong>
      </span>
    </div>
  );

  // ═══ Processing Component ═══
  const Processing = () => (
    <div
      className="relative z-10 flex flex-col items-center justify-center text-center p-8 max-w-[640px] w-full"
      style={{ opacity: vis ? 1 : 0, transition: "opacity 0.7s ease" }}
    >
      <div className="relative w-[18px] h-[18px] mb-9">
        <div className="absolute inset-0 rounded-full bg-white/[0.18] animate-breathe-slow" />
        <div className="absolute top-1/2 left-1/2 w-[18px] h-[18px] -mt-[9px] -ml-[9px] rounded-full border border-white/[0.08] animate-pulse1" />
        <div className="absolute top-1/2 left-1/2 w-[18px] h-[18px] -mt-[9px] -ml-[9px] rounded-full border border-white/[0.05] animate-pulse2" />
      </div>
      <p
        className="text-[13px] font-extralight text-white/[0.22] tracking-[0.1em] lowercase"
        style={{ opacity: pFade ? 1 : 0, transition: "opacity 0.4s ease" }}
      >
        {procPhrases[pIdx % procPhrases.length]}
      </p>
    </div>
  );

  // ═══ Descent Level Indicator ═══
  const DescentLevel = ({ level }: { level: number }) => (
    <div className="flex items-center gap-1.5 mb-7">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full transition-colors duration-500"
          style={{
            background:
              i <= level ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.08)",
          }}
        />
      ))}
      <span className="text-[10px] font-light text-white/15 tracking-[0.12em] uppercase ml-2">
        Descent level {level}
      </span>
    </div>
  );

  return (
    <main className="min-h-screen w-full bg-[#060606] flex items-center justify-center relative overflow-hidden font-body">
      {/* Grain */}
      <div className="grain-overlay" />
      {/* Vignette */}
      <div className="vignette" />
      {/* Center glow */}
      <div className="center-glow" />

      {/* ═══ LANDING ═══ */}
      {phase === "landing" && (
        <div
          className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-8 max-w-[640px] w-full"
          style={{ opacity: vis ? 1 : 0, transition: "opacity 1s ease" }}
        >
          <div className="w-14 h-14 rounded-full border border-white/[0.06] flex items-center justify-center mb-8 animate-spin-slow">
            <div className="w-[5px] h-[5px] rounded-full bg-white/25 animate-breathe" />
          </div>
          <h1 className="font-display text-[clamp(44px,10vw,76px)] font-light text-white tracking-[0.04em] leading-none mb-5">
            The Mirror
          </h1>
          <div className="w-9 h-px bg-white/10 mb-6" />
          <p className="text-base font-extralight text-white/50 leading-relaxed mb-2">
            Tell me what you&apos;re carrying right now.
          </p>
          <p className="text-[13px] font-extralight text-white/25 leading-loose mb-10">
            I won&apos;t help you. I&apos;ll show you what you can&apos;t see.
          </p>
          <div className="flex flex-col gap-3.5 items-center">
            <button
              onClick={startDescent}
              className="bg-transparent border border-white/[0.12] text-white/60 font-body text-[13px] font-light tracking-[0.16em] uppercase px-14 py-3.5"
            >
              Begin a descent
            </button>
            {vault.cards.length > 0 && (
              <button
                onClick={() => goTo("vault")}
                className="bg-transparent border-none text-white/20 font-body text-xs font-extralight tracking-[0.1em] uppercase px-5 py-2"
              >
                The Vault · {vault.cards.length} card
                {vault.cards.length !== 1 ? "s" : ""}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ═══ INPUT ═══ */}
      {phase === "input" && (
        <div
          className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-8 max-w-[640px] w-full"
          style={{ opacity: vis ? 1 : 0, transition: "opacity 0.8s ease" }}
        >
          <DescentLevel level={1} />
          <p className="font-display text-[clamp(19px,4vw,25px)] font-light italic text-white/65 leading-relaxed mb-2">
            What&apos;s the situation, the decision, the thing weighing on you?
          </p>
          <p className="text-[13px] font-extralight text-white/20 mb-7">
            Don&apos;t organize it. Don&apos;t make it make sense. Just say it.
          </p>
          <div className="w-full relative mb-6">
            <textarea
              ref={taRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKey(submitSituation)}
              placeholder="Start typing..."
              maxLength={3000}
              rows={7}
              className="w-full min-h-[160px] bg-white/[0.02] border border-white/[0.06] rounded-[3px] text-white/85 font-body text-[15px] font-extralight leading-loose p-5 resize-y transition-colors focus:border-white/[0.12]"
            />
            {text.length > 0 && (
              <span className="absolute bottom-2 right-3 text-[11px] font-light text-white/[0.12]">
                {text.length}/3000
              </span>
            )}
          </div>
          <button
            onClick={submitSituation}
            disabled={!ok1}
            className="bg-transparent border border-white/15 text-white/60 font-display text-sm font-normal italic tracking-[0.05em] px-10 py-3.5"
            style={{ opacity: ok1 ? 1 : 0.15 }}
          >
            Show me what I can&apos;t see
          </button>
          {text.length > 0 && text.trim().length < 20 && (
            <p className="text-xs font-extralight text-white/[0.18] mt-3">
              Say a little more...
            </p>
          )}
        </div>
      )}

      {/* ═══ PROCESSING (any level) ═══ */}
      {phase.startsWith("proc") && <Processing />}

      {/* ═══ LEVEL 1: THE QUESTION ═══ */}
      {phase === "question" && (
        <div
          className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-8 max-w-[640px] w-full"
          style={{
            opacity: vis ? 1 : 0,
            transition: "opacity 1.8s cubic-bezier(0.25,0.1,0.25,1)",
          }}
        >
          <DescentLevel level={1} />
          {isCrisis && <CrisisBanner />}
          <div className="max-w-[520px] relative px-3 mb-4">
            <span className="font-display text-[120px] font-light text-white/[0.03] leading-none block -mb-11 select-none">
              &ldquo;
            </span>
            <p className="font-display text-[clamp(21px,4.5vw,32px)] font-light italic text-white/90 leading-relaxed">
              {question1}
            </p>
          </div>
          <div className="flex flex-col gap-2.5 items-center mt-9">
            <button
              onClick={() => {
                goTo("answer-input");
                setTimeout(() => taRef2.current?.focus(), 600);
              }}
              className="bg-transparent border border-white/[0.12] text-white/50 font-body text-xs font-light tracking-[0.14em] uppercase px-9 py-3"
            >
              Answer this question
            </button>
            <button
              onClick={() => {
                setAnswerText("");
                generateCard();
              }}
              className="bg-transparent border-none text-white/[0.18] font-body text-[11px] font-extralight tracking-[0.1em] uppercase px-5 py-2"
            >
              That&apos;s enough
            </button>
          </div>
          <p className="text-[10px] font-extralight text-white/[0.08] mt-9 tracking-[0.18em] uppercase">
            Level 1 — The Question
          </p>
        </div>
      )}

      {/* ═══ LEVEL 2 INPUT: ANSWER ═══ */}
      {phase === "answer-input" && (
        <div
          className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-8 max-w-[640px] w-full"
          style={{ opacity: vis ? 1 : 0, transition: "opacity 0.8s ease" }}
        >
          <DescentLevel level={2} />
          {isCrisis && <CrisisBanner />}
          <p className="text-[11px] font-light text-white/20 tracking-[0.1em] uppercase mb-3">
            The question was:
          </p>
          <p className="font-display text-[clamp(17px,3vw,22px)] font-light italic text-white/50 leading-relaxed max-w-[480px] mb-5">
            {question1}
          </p>
          <div className="w-6 h-px bg-white/[0.08] mb-5" />
          <p className="text-[13px] font-extralight text-white/[0.22] mb-6">
            Answer it. Don&apos;t explain your situation more. Answer the
            question.
          </p>
          <div className="w-full relative mb-6">
            <textarea
              ref={taRef2}
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              onKeyDown={onKey(submitAnswer)}
              placeholder="Your answer..."
              maxLength={2000}
              rows={5}
              className="w-full min-h-[140px] bg-white/[0.02] border border-white/[0.06] rounded-[3px] text-white/85 font-body text-[15px] font-extralight leading-loose p-5 resize-y transition-colors focus:border-white/[0.12]"
            />
          </div>
          <button
            onClick={submitAnswer}
            disabled={!ok2}
            className="bg-transparent border border-white/15 text-white/60 font-display text-sm font-normal italic tracking-[0.05em] px-10 py-3.5"
            style={{ opacity: ok2 ? 1 : 0.15 }}
          >
            Go deeper
          </button>
        </div>
      )}

      {/* ═══ LEVEL 2: THE OBSERVATION ═══ */}
      {phase === "observation" && (
        <div
          className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-8 max-w-[640px] w-full"
          style={{ opacity: vis ? 1 : 0, transition: "opacity 1.5s ease" }}
        >
          <DescentLevel level={2} />
          {isCrisis && <CrisisBanner />}
          <p className="text-[10px] font-light text-white/20 tracking-[0.15em] uppercase mb-5">
            The Mirror sees:
          </p>
          <p className="font-body text-lg font-extralight text-white/75 leading-relaxed max-w-[500px] mb-10">
            {observation}
          </p>
          <button
            onClick={goDeeperQuestion}
            className="bg-transparent border border-white/[0.12] text-white/50 font-body text-xs font-light tracking-[0.14em] uppercase px-9 py-3"
          >
            Go deeper
          </button>
          <p className="text-[10px] font-extralight text-white/[0.08] mt-9 tracking-[0.18em] uppercase">
            Level 2 — The Observation
          </p>
        </div>
      )}

      {/* ═══ LEVEL 3: THE DEEPER QUESTION ═══ */}
      {phase === "deeper" && (
        <div
          className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-8 max-w-[640px] w-full"
          style={{
            opacity: vis ? 1 : 0,
            transition: "opacity 1.8s cubic-bezier(0.25,0.1,0.25,1)",
          }}
        >
          <DescentLevel level={3} />
          {isCrisis && <CrisisBanner />}
          <div className="max-w-[520px] relative px-3 mb-4">
            <span className="font-display text-[120px] font-light text-white/[0.03] leading-none block -mb-11 select-none">
              &ldquo;
            </span>
            <p className="font-display text-[clamp(21px,4.5vw,32px)] font-light italic text-white/90 leading-relaxed">
              {question2}
            </p>
          </div>
          <button
            onClick={generateCard}
            className="bg-transparent border border-white/[0.12] text-white/50 font-body text-xs font-light tracking-[0.14em] uppercase px-9 py-3 mt-9"
          >
            Complete the descent
          </button>
          <p className="text-[10px] font-extralight text-white/[0.08] mt-9 tracking-[0.18em] uppercase">
            Level 3 — The Deeper Question
          </p>
        </div>
      )}

      {/* ═══ LEVEL 4: THE MIRROR CARD ═══ */}
      {phase === "card" && mirrorCard && (
        <div
          className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-8 max-w-[640px] w-full"
          style={{ opacity: vis ? 1 : 0, transition: "opacity 1.5s ease" }}
        >
          <DescentLevel level={4} />
          {isCrisis && <CrisisBanner />}
          <div className="w-full max-w-[440px] border border-white/[0.06] rounded p-7 bg-white/[0.015] mb-5">
            <div className="flex items-center gap-2.5 mb-5">
              <span className="text-sm text-white/[0.12]">◯</span>
              <span className="text-[10px] font-normal text-white/20 tracking-[0.2em] uppercase">
                MIRROR CARD
              </span>
            </div>
            <h2 className="font-display text-[28px] font-light text-white/85 mb-4 text-left">
              {mirrorCard.pattern_name}
            </h2>
            <div className="w-full h-px bg-white/[0.06] mb-5" />
            <div className="mb-4 text-left">
              <span className="text-[9px] font-normal text-white/20 tracking-[0.15em] uppercase block mb-1.5">
                The question that cut deepest
              </span>
              <p className="font-display text-base font-light italic text-white/70 leading-relaxed">
                {mirrorCard.core_question}
              </p>
            </div>
            <div className="mb-4 text-left">
              <span className="text-[9px] font-normal text-white/20 tracking-[0.15em] uppercase block mb-1.5">
                The pattern revealed
              </span>
              <p className="text-sm font-extralight text-white/55 leading-relaxed">
                {mirrorCard.pattern_revealed}
              </p>
            </div>
            <div className="mb-4 text-left">
              <span className="text-[9px] font-normal text-white/20 tracking-[0.15em] uppercase block mb-1.5">
                What you might still not see
              </span>
              <p className="text-sm font-light text-white/65 leading-relaxed italic">
                {mirrorCard.still_unseen}
              </p>
            </div>
            <div className="flex justify-end mt-4">
              <span className="text-[10px] font-light text-white/15 tracking-[0.05em]">
                {new Date(mirrorCard.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
          <div className="flex gap-3.5 items-center mt-3">
            <button
              onClick={startDescent}
              className="bg-transparent border border-white/[0.12] text-white/50 font-body text-xs font-light tracking-[0.14em] uppercase px-9 py-3"
            >
              New descent
            </button>
            {vault.cards.length > 0 && (
              <button
                onClick={() => goTo("vault")}
                className="bg-transparent border-none text-white/20 font-body text-xs font-extralight tracking-[0.1em] uppercase px-5 py-2"
              >
                Open the Vault
              </button>
            )}
          </div>
          <p className="text-[10px] font-extralight text-white/[0.08] mt-9 tracking-[0.18em] uppercase">
            The Mirror — MachineMind
          </p>
        </div>
      )}

      {/* ═══ THE VAULT ═══ */}
      {phase === "vault" && (
        <div
          className="relative z-10 flex flex-col items-center text-center px-6 py-16 max-w-[720px] w-full min-h-screen justify-start"
          style={{ opacity: vis ? 1 : 0, transition: "opacity 0.8s ease" }}
        >
          <h1 className="font-display text-[clamp(36px,8vw,56px)] font-light text-white tracking-[0.04em] mb-3">
            The Vault
          </h1>
          <p className="text-[13px] font-extralight text-white/25 tracking-[0.05em] mb-6">
            {vault.cards.length} descent{vault.cards.length !== 1 ? "s" : ""} ·{" "}
            {Object.keys(patternGroups).length} pattern
            {Object.keys(patternGroups).length !== 1 ? "s" : ""} identified
          </p>
          <div className="w-9 h-px bg-white/10 mb-8" />

          {vault.cards.length === 0 ? (
            <p className="text-sm font-extralight text-white/20 italic mt-10">
              No descents yet. Your pattern map builds with each one.
            </p>
          ) : (
            <div className="w-full flex flex-col gap-8 mt-2">
              {Object.entries(patternGroups).map(([pattern, cards]) => (
                <div key={pattern} className="w-full text-left">
                  <div className="flex justify-between items-baseline mb-3 border-b border-white/[0.06] pb-2">
                    <span className="font-display text-[22px] font-light text-white/70">
                      {pattern}
                    </span>
                    <span className="text-[11px] font-light text-white/15 tracking-[0.08em]">
                      {cards.length} card{cards.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {cards
                    .slice()
                    .reverse()
                    .map((c) => (
                      <div
                        key={c.id}
                        className="py-4 border-b border-white/[0.03]"
                      >
                        <p className="font-display text-[15px] font-light italic text-white/60 leading-relaxed mb-1.5">
                          {c.core_question}
                        </p>
                        <p className="text-[13px] font-extralight text-white/35 leading-relaxed mb-1">
                          {c.pattern_revealed}
                        </p>
                        <p className="text-xs font-light text-white/45 leading-relaxed italic mb-1.5">
                          {c.still_unseen}
                        </p>
                        <span className="text-[10px] font-light text-white/[0.12]">
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

          <div className="flex gap-3.5 items-center mt-10 flex-wrap justify-center">
            <button
              onClick={startDescent}
              className="bg-transparent border border-white/[0.12] text-white/50 font-body text-xs font-light tracking-[0.14em] uppercase px-9 py-3"
            >
              New descent
            </button>
            <button
              onClick={() => goTo("landing")}
              className="bg-transparent border-none text-white/[0.18] font-body text-[11px] font-extralight tracking-[0.1em] uppercase px-5 py-2"
            >
              Back
            </button>
            {vault.cards.length > 0 && (
              <button
                onClick={resetVault}
                className="bg-transparent border-none text-red-300/30 font-body text-[11px] font-extralight tracking-[0.1em] uppercase px-5 py-2"
              >
                Clear vault
              </button>
            )}
          </div>
          <p className="text-[10px] font-extralight text-white/[0.08] mt-10 tracking-[0.18em] uppercase">
            The Mirror — MachineMind — @showowt
          </p>
        </div>
      )}
    </main>
  );
}
