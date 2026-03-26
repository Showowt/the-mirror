import Link from "next/link";

export default function NotFound() {
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
          fontSize: "clamp(3rem, 8vw, 6rem)",
          fontWeight: 300,
          marginBottom: "16px",
          letterSpacing: "0.1em",
          color: "rgba(255, 255, 255, 0.3)",
        }}
      >
        404
      </h1>
      <h2
        style={{
          fontSize: "clamp(1.5rem, 4vw, 2rem)",
          fontWeight: 300,
          marginBottom: "24px",
          letterSpacing: "0.05em",
        }}
      >
        This path doesn&apos;t exist
      </h2>
      <p
        style={{
          fontSize: "1rem",
          color: "rgba(255, 255, 255, 0.5)",
          marginBottom: "32px",
          maxWidth: "400px",
          lineHeight: 1.6,
        }}
      >
        The reflection you&apos;re looking for isn&apos;t here. Perhaps it was
        never meant to be found.
      </p>
      <Link
        href="/"
        style={{
          padding: "14px 32px",
          fontSize: "0.9rem",
          fontWeight: 500,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          background: "transparent",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          color: "rgba(255, 255, 255, 0.9)",
          textDecoration: "none",
          transition: "all 0.3s ease",
        }}
      >
        Return to The Mirror
      </Link>
    </div>
  );
}
