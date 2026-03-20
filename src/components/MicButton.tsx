"use client";

// ═══════════════════════════════════════════════════════════════
// THE MIRROR v2.1 — MICROPHONE BUTTON
// Visual feedback for voice recognition state
// ═══════════════════════════════════════════════════════════════

interface MicButtonProps {
  listening: boolean;
  supported: boolean;
  onToggle: () => void;
  label: string;
  listenLabel: string;
}

export function MicButton({
  listening,
  supported,
  onToggle,
  label,
  listenLabel,
}: MicButtonProps) {
  if (!supported) return null;

  return (
    <button
      onClick={onToggle}
      className={`mic-button ${listening ? "mic-listening" : ""}`}
      aria-label={listening ? listenLabel : label}
      type="button"
    >
      <div className="mic-icon-wrap">
        {listening && <div className="mic-pulse" />}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      </div>
      <span className="mic-label">{listening ? listenLabel : label}</span>
    </button>
  );
}
