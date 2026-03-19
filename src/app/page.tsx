"use client";

import { useState, useRef, useEffect, useCallback } from "react";

type Phase = "landing" | "input" | "processing" | "question" | "error";

export default function TheMirror() {
  const [phase, setPhase] = useState<Phase>("landing");
  const [inputText, setInputText] = useState("");
  const [question, setQuestion] = useState("");
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(false);
  const [questionVisible, setQuestionVisible] = useState(false);
  const [processingDots, setProcessingDots] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const processingIntervalRef = useRef<number | null>(null);

  // Initial fade in
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Processing dots animation
  useEffect(() => {
    if (phase === "processing") {
      let count = 0;
      processingIntervalRef.current = window.setInterval(() => {
        count = (count + 1) % 4;
        setProcessingDots(".".repeat(count));
      }, 500);
    } else {
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
        processingIntervalRef.current = null;
      }
    }
    return () => {
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
      }
    };
  }, [phase]);

  const transitionTo = useCallback((newPhase: Phase, delay = 600) => {
    setVisible(false);
    setTimeout(() => {
      setPhase(newPhase);
      setTimeout(() => setVisible(true), 50);
    }, delay);
  }, []);

  const handleEnter = () => {
    transitionTo("input");
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 700);
  };

  const handleSubmit = async () => {
    const trimmed = inputText.trim();
    if (trimmed.length < 20) return;

    transitionTo("processing");

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
        setTimeout(() => setQuestionVisible(true), 100);
      }, 800);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Something broke in the reflection. Try again.",
      );
      transitionTo("error");
    }
  };

  const handleReset = () => {
    setQuestionVisible(false);
    setVisible(false);
    setTimeout(() => {
      setPhase("landing");
      setInputText("");
      setQuestion("");
      setError("");
      setTimeout(() => setVisible(true), 50);
    }, 600);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const charCount = inputText.length;
  const canSubmit = inputText.trim().length >= 20;

  return (
    <main className="min-h-screen w-full bg-void flex items-center justify-center relative overflow-hidden">
      {/* Grain overlay */}
      <div className="grain-overlay" />

      {/* Vignette */}
      <div className="vignette" />

      {/* Content */}
      <div
        className={`relative z-10 flex flex-col items-center justify-center px-6 py-10 max-w-2xl w-full text-center phase-transition ${visible ? "phase-visible" : "phase-enter"}`}
      >
        {/* LANDING */}
        {phase === "landing" && (
          <>
            <div className="text-5xl text-white/[0.06] font-display font-light mb-8 tracking-widest">
              ◯
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-light text-white tracking-wider mb-8">
              The Mirror
            </h1>
            <p className="font-body text-base md:text-lg font-light text-white/60 leading-relaxed mb-3">
              Tell me what you&apos;re carrying right now.
            </p>
            <p className="font-body text-sm font-light text-white/35 leading-relaxed mb-12">
              I won&apos;t help you. I&apos;ll ask you the one question
              <br />
              you&apos;re not asking yourself.
            </p>
            <button
              onClick={handleEnter}
              className="bg-transparent border border-white/15 text-white/70 font-display text-base font-normal tracking-[0.15em] px-14 py-4 uppercase transition-all duration-300 hover:border-white/30 hover:text-white/90"
            >
              Enter
            </button>
          </>
        )}

        {/* INPUT */}
        {phase === "input" && (
          <>
            <p className="font-display text-2xl md:text-3xl font-light italic text-white/75 leading-relaxed mb-3">
              What&apos;s the situation, the decision, the thing on your mind?
            </p>
            <p className="font-body text-sm font-light text-white/25 tracking-wide mb-9">
              Don&apos;t filter. Don&apos;t organize. Just say it.
            </p>
            <div className="w-full relative mb-6">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Start typing..."
                maxLength={3000}
                rows={6}
                className="w-full min-h-[160px] bg-white/[0.03] border border-white/[0.08] text-white/85 font-body text-base font-light leading-relaxed p-5 resize-y tracking-wide transition-colors focus:border-white/15"
              />
              {charCount > 0 && (
                <span className="absolute bottom-3 right-4 text-xs text-white/30 font-body">
                  {charCount}/3000
                </span>
              )}
            </div>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`bg-transparent border border-white/20 text-white/70 font-display text-sm font-normal tracking-[0.1em] px-10 py-4 uppercase transition-all duration-400 ${
                canSubmit
                  ? "opacity-100 cursor-pointer hover:border-white/40 hover:text-white"
                  : "opacity-20 cursor-default"
              }`}
            >
              Show me what I can&apos;t see
            </button>
            <p className="font-body text-xs font-light text-white/25 mt-4 h-4">
              {!canSubmit && charCount > 0 ? "Say a little more..." : "\u00A0"}
            </p>
          </>
        )}

        {/* PROCESSING */}
        {phase === "processing" && (
          <div className="flex flex-col items-center gap-8">
            <div className="w-4 h-4 rounded-full bg-white/15 relative">
              <div className="pulse-ring" />
            </div>
            <p className="font-body text-sm font-light text-white/30 tracking-[0.2em] lowercase min-w-[80px]">
              Seeing{processingDots}
            </p>
          </div>
        )}

        {/* QUESTION */}
        {phase === "question" && (
          <div
            className={`flex flex-col items-center phase-transition ${questionVisible ? "phase-visible" : "phase-enter"}`}
            style={{ transition: "opacity 1.5s ease" }}
          >
            <div className="max-w-xl relative px-5">
              <div className="font-display text-[120px] font-light text-white/[0.04] leading-none -mb-10 select-none">
                &ldquo;
              </div>
              <p className="font-display text-2xl md:text-4xl font-light italic text-white/90 leading-relaxed tracking-wide">
                {question}
              </p>
            </div>
            <div className="mt-16 flex items-center gap-6">
              <button
                onClick={handleReset}
                className="bg-transparent border border-white/10 text-white/35 font-body text-xs font-normal tracking-[0.1em] px-7 py-3 uppercase transition-all duration-300 hover:border-white/25 hover:text-white/60"
              >
                Start over
              </button>
            </div>
            <p className="font-body text-[11px] font-light text-white/10 mt-12 tracking-[0.15em] uppercase">
              The Mirror — by MachineMind
            </p>
          </div>
        )}

        {/* ERROR */}
        {phase === "error" && (
          <>
            <p className="font-body text-sm font-light text-red-300/60 mb-6">
              {error}
            </p>
            <button
              onClick={handleReset}
              className="bg-transparent border border-white/10 text-white/35 font-body text-xs font-normal tracking-[0.1em] px-7 py-3 uppercase transition-all duration-300 hover:border-white/25 hover:text-white/60"
            >
              Try again
            </button>
          </>
        )}
      </div>
    </main>
  );
}
