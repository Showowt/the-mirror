import type { Metadata, Viewport } from "next";
import { Playfair_Display, Outfit } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500"],
  variable: "--font-body",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#050505",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  title: "The Mirror — See What You Can't See",
  description:
    "Tell me what you're carrying. I won't help you. I'll ask you the one question you're not asking yourself. A sacred space for self-reflection.",
  metadataBase: new URL("https://www.beginyourdescent.com"),
  keywords: [
    "self-reflection",
    "AI mirror",
    "blind spots",
    "self-awareness",
    "introspection",
    "personal growth",
    "consciousness",
    "MachineMind",
  ],
  authors: [{ name: "MachineMind", url: "https://machinemind.io" }],
  creator: "MachineMind",
  publisher: "MachineMind",
  robots: "index, follow",
  openGraph: {
    title: "The Mirror — See What You Can't See",
    description:
      "I won't help you. I'll ask you the one question you're not asking yourself.",
    type: "website",
    siteName: "The Mirror",
    locale: "en_US",
    url: "https://www.beginyourdescent.com",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "The Mirror — An AI that sees your blind spots. Dark interface with concentric circles representing psychological descent.",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Mirror — See What You Can't See",
    description:
      "I won't help you. I'll ask you the one question you're not asking yourself.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "The Mirror — An AI that sees your blind spots",
      },
    ],
    creator: "@showowt",
    site: "@machinemind",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: [{ url: "/icon-192.png" }],
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${outfit.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* PWA & App Icons */}
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link rel="mask-icon" href="/icon.svg" color="#050505" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="The Mirror" />
        <meta name="application-name" content="The Mirror" />
        <meta name="msapplication-TileColor" content="#050505" />
        <meta name="msapplication-TileImage" content="/icon-192.png" />
        {/* Telegram & Messaging Apps */}
        <meta
          property="og:image:secure_url"
          content="https://www.beginyourdescent.com/og-image.png"
        />
        <meta name="telegram:channel" content="@themirrorai" />
        {/* WhatsApp Preview */}
        <meta property="og:image:type" content="image/png" />
      </head>
      <body className="bg-[#050505] text-white antialiased selection:bg-white/10">
        {children}
      </body>
    </html>
  );
}
