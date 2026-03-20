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
  metadataBase: new URL("https://the-mirror-eight.vercel.app"),
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
    title: "The Mirror",
    description:
      "I won't help you. I'll ask you the one question you're not asking yourself.",
    type: "website",
    siteName: "The Mirror",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "The Mirror — I won't help you. I'll ask you the one question you're not asking yourself.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Mirror",
    description:
      "I won't help you. I'll ask you the one question you're not asking yourself.",
    images: ["/og-image.png"],
    creator: "@showowt",
  },
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "any" }],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
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
      </head>
      <body className="bg-[#050505] text-white antialiased selection:bg-white/10">
        {children}
      </body>
    </html>
  );
}
