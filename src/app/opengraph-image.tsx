import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt =
  "The Mirror - I won't help you. I'll ask you the one question you're not asking yourself.";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#060606",
        position: "relative",
      }}
    >
      {/* Vignette overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,0.7) 100%)",
        }}
      />

      {/* Center glow */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "800px",
          height: "800px",
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)",
        }}
      />

      {/* Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
        }}
      >
        {/* Ring with dot */}
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "rgba(255,255,255,0.3)",
            }}
          />
        </div>

        {/* Title */}
        <h1
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "84px",
            fontWeight: 300,
            color: "#ffffff",
            letterSpacing: "0.04em",
            margin: 0,
            marginBottom: "28px",
          }}
        >
          The Mirror
        </h1>

        {/* Divider */}
        <div
          style={{
            width: "60px",
            height: "1px",
            backgroundColor: "rgba(255,255,255,0.15)",
            marginBottom: "32px",
          }}
        />

        {/* Tagline */}
        <p
          style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: "24px",
            fontWeight: 300,
            color: "rgba(255,255,255,0.55)",
            margin: 0,
            marginBottom: "12px",
            letterSpacing: "0.02em",
          }}
        >
          I won&apos;t help you.
        </p>
        <p
          style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: "24px",
            fontWeight: 300,
            color: "rgba(255,255,255,0.55)",
            margin: 0,
            letterSpacing: "0.02em",
          }}
        >
          I&apos;ll ask you the one question you&apos;re not asking yourself.
        </p>
      </div>

      {/* Bottom credit */}
      <p
        style={{
          position: "absolute",
          bottom: "40px",
          fontFamily: "system-ui, sans-serif",
          fontSize: "14px",
          fontWeight: 300,
          color: "rgba(255,255,255,0.15)",
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          margin: 0,
        }}
      >
        MachineMind
      </p>
    </div>,
    {
      ...size,
    },
  );
}
