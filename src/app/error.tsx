"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Mirror] Error:", error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#030304",
        color: "rgba(255, 255, 255, 0.9)",
        fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
        padding: "20px",
        textAlign: "center",
      }}
    >
      <h1
        style={{
          fontSize: "clamp(2rem, 5vw, 3rem)",
          fontWeight: 300,
          marginBottom: "24px",
          letterSpacing: "0.1em",
        }}
      >
        Something broke
      </h1>
      <p
        style={{
          fontSize: "1rem",
          color: "rgba(255, 255, 255, 0.5)",
          marginBottom: "32px",
          maxWidth: "400px",
          lineHeight: 1.6,
        }}
      >
        The Mirror encountered an unexpected reflection. This moment has been
        logged.
      </p>
      <button
        onClick={reset}
        style={{
          padding: "14px 32px",
          fontSize: "0.9rem",
          fontWeight: 500,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          background: "transparent",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          color: "rgba(255, 255, 255, 0.9)",
          cursor: "pointer",
          transition: "all 0.3s ease",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.4)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
        }}
      >
        Try Again
      </button>
    </div>
  );
}
