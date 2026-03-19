"use client";

import { useState, useRef, useEffect, useCallback } from "react";

type Phase = "landing" | "input" | "processing" | "question" | "error";

const SEEING_MESSAGES = [
  "Reading between your words",
  "Finding the shape of your perspective",
  "Looking for what you can't see",
  "Locating the blind spot",
];

export default function TheMirror() {
  const [phase, setPhase] = useState<Phase>("landing");
  const [text, setText] = useState("");
  const [question, setQuestion] = useState("");
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(false);
  const [questionVisible, setQuestionVisible] = useState(false);
  const [seeingIndex, setSeeingIndex] = useState(0);
  const [seeingFade, setSeeingFade] = useState(true);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const seeingTimerRef = useRef<number | null>(null);

  // Initial fade in
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(timer);
  }, []);

  // Cycling "seeing" messages during processing
  useEffect(() => {
    if (phase !== "processing") {
      if (seeingTimerRef.current) {
        clearInterval(seeingTimerRef.current);
        seeingTimerRef.current = null;
      }
      return;
    }

    seeingTimerRef.current = window.setInterval(() => {
      setSeeingFade(false);
      setTimeout(() => {
        setSeeingIndex((i) => (i + 1) % SEEING_MESSAGES.length);
        setSeeingFade(true);
      }, 400);
    }, 2800);

    return () => {
      if (seeingTimerRef.current) {
        clearInterval(seeingTimerRef.current);
      }
    };
  }, [phase]);

  const transitionTo = useCallback((newPhase: Phase, delay = 500) => {
    setVisible(false);
    setTimeout(() => {
      setPhase(newPhase);
      setTimeout(() => setVisible(true), 60);
      if (newPhase === "input") {
        setTimeout(() => textareaRef.current?.focus(), 350);
      }
    }, delay);
  }, []);

  const handleSubmit = useCallback(async () => {
    const trimmed = text.trim();
    if (trimmed.length < 20) return;

    transitionTo("processing", 500);

    try {
      const response = await fetch("/api/mirror", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ situation: trimmed }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      setQuestion(data.question);
      setVisible(false);
      setTimeout(() => {
        setPhase("question");
        setTimeout(() => setQuestionVisible(true), 120);
      }, 700);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "The reflection broke. Try again.",
      );
      transitionTo("error", 400);
    }
  }, [text, transitionTo]);

  const handleReset = useCallback(() => {
    setQuestionVisible(false);
    setTimeout(() => {
      setText("");
      setQuestion("");
      setError("");
      setSeeingIndex(0);
      transitionTo("landing", 400);
    }, 500);
  }, [transitionTo]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSubmit = text.trim().length >= 20;

  return (
    <main className="min-h-screen w-full bg-[#060606] flex items-center justify-center relative overflow-hidden font-body">
      {/* Grain overlay */}
      <div className="grain-overlay" />

      {/* Vignette */}
      <div className="vignette" />

      {/* Center glow */}
      <div className="center-glow" />

      {/* LANDING */}
      {phase === "landing" && (
        <div
          className="relative z-10 flex flex-col items-center justify-center text-center px-7 py-10 max-w-[620px] w-full"
          style={{
            opacity: visible ? 1 : 0,
            transition: "opacity 1s ease",
          }}
        >
          {/* Spinning ring with breathing dot */}
          <div className="w-16 h-16 rounded-full border border-white/[0.06] flex items-center justify-center mb-9 animate-spin-slow">
            <div className="w-1.5 h-1.5 rounded-full bg-white/25 animate-breathe" />
          </div>

          <h1 className="font-display text-[clamp(48px,10vw,80px)] font-light text-white tracking-[0.04em] leading-none mb-6">
            The Mirror
          </h1>

          <div className="w-10 h-px bg-white/[0.12] mb-7" />

          <p className="font-body text-[17px] font-extralight text-white/55 leading-relaxed tracking-[0.015em] mb-2.5">
            Tell me what you&apos;re carrying right now.
          </p>

          <p className="font-body text-[13.5px] font-extralight text-white/[0.28] leading-loose mb-12">
            I won&apos;t help you. I&apos;ll ask you the one question
            <br />
            you&apos;re not asking yourself.
          </p>

          <button
            onClick={() => transitionTo("input")}
            className="bg-transparent border border-white/[0.12] text-white/60 font-body text-[13px] font-light tracking-[0.18em] uppercase px-14 py-4"
          >
            I&apos;m ready
          </button>
        </div>
      )}

      {/* INPUT */}
      {phase === "input" && (
        <div
          className="relative z-10 flex flex-col items-center justify-center text-center px-7 py-10 max-w-[620px] w-full"
          style={{
            opacity: visible ? 1 : 0,
            transition: "opacity 0.8s ease",
          }}
        >
          <p className="font-display text-[clamp(20px,4vw,26px)] font-light italic text-white/70 leading-relaxed mb-2.5">
            What&apos;s the situation, the decision, the thing weighing on you?
          </p>

          <p className="font-body text-[13px] font-extralight text-white/[0.22] tracking-[0.01em] mb-8">
            Don&apos;t organize it. Don&apos;t make it make sense. Just say it.
          </p>

          <div className="w-full relative mb-7">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Start typing..."
              maxLength={3000}
              rows={7}
              className="w-full min-h-[180px] bg-white/[0.02] border border-white/[0.06] rounded-[3px] text-white/85 font-body text-[15px] font-extralight leading-loose p-[22px] resize-y tracking-[0.005em] transition-colors duration-500 focus:border-white/[0.12]"
            />
            {text.length > 0 && (
              <span className="absolute bottom-2.5 right-3.5 text-[11px] font-light text-white/15 font-body">
                {text.length}/3000
              </span>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="bg-transparent border border-white/15 text-white/65 font-display text-sm font-normal italic tracking-[0.06em] px-11 py-4"
            style={{
              opacity: canSubmit ? 1 : 0.15,
              cursor: canSubmit ? "pointer" : "default",
            }}
          >
            Show me what I can&apos;t see
          </button>

          {text.length > 0 && text.trim().length < 20 && (
            <p className="font-body text-xs font-extralight text-white/20 mt-3.5">
              Say a little more...
            </p>
          )}
        </div>
      )}

      {/* PROCESSING */}
      {phase === "processing" && (
        <div
          className="relative z-10 flex flex-col items-center justify-center text-center px-7 py-10"
          style={{
            opacity: visible ? 1 : 0,
            transition: "opacity 0.7s ease",
          }}
        >
          {/* Pulsing orb */}
          <div className="relative w-5 h-5 mb-10">
            <div className="absolute inset-0 rounded-full bg-white/20 animate-breathe-slow" />
            <div className="absolute top-1/2 left-1/2 w-5 h-5 -mt-2.5 -ml-2.5 rounded-full border border-white/[0.08] animate-pulse1" />
            <div className="absolute top-1/2 left-1/2 w-5 h-5 -mt-2.5 -ml-2.5 rounded-full border border-white/[0.05] animate-pulse2" />
          </div>

          <p
            className="font-body text-[13px] font-extralight text-white/25 tracking-[0.12em] lowercase"
            style={{
              opacity: seeingFade ? 1 : 0,
              transition: "opacity 0.4s ease",
            }}
          >
            {SEEING_MESSAGES[seeingIndex]}
          </p>
        </div>
      )}

      {/* QUESTION */}
      {phase === "question" && (
        <div
          className="relative z-10 flex flex-col items-center justify-center text-center px-7 py-10 question-reveal"
          style={{
            opacity: questionVisible ? 1 : 0,
          }}
        >
          <div className="max-w-[540px] relative px-4">
            <span className="font-display text-[140px] font-light text-white/[0.03] leading-none block -mb-[50px] select-none">
              &ldquo;
            </span>
            <p className="font-display text-[clamp(22px,5vw,34px)] font-light italic text-white/[0.92] leading-relaxed tracking-[0.005em]">
              {question}
            </p>
          </div>

          <div className="mt-[60px] flex items-center gap-5">
            <button
              onClick={handleReset}
              className="bg-transparent border border-white/[0.08] text-white/30 font-body text-[11px] font-light tracking-[0.14em] uppercase px-8 py-2.5"
            >
              Start over
            </button>
          </div>

          <p className="font-body text-[10px] font-extralight text-white/10 mt-[52px] tracking-[0.2em] uppercase">
            The Mirror&ensp;&mdash;&ensp;MachineMind
          </p>
        </div>
      )}

      {/* ERROR */}
      {phase === "error" && (
        <div
          className="relative z-10 flex flex-col items-center justify-center text-center px-7 py-10"
          style={{
            opacity: visible ? 1 : 0,
            transition: "opacity 0.7s ease",
          }}
        >
          <p className="font-body text-sm font-extralight text-red-200/50 mb-6">
            {error}
          </p>
          <button
            onClick={handleReset}
            className="bg-transparent border border-white/[0.08] text-white/30 font-body text-[11px] font-light tracking-[0.14em] uppercase px-8 py-2.5"
          >
            Try again
          </button>
        </div>
      )}
    </main>
  );
}
