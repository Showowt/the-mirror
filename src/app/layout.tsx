import type { Metadata } from "next";
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
  weight: ["200", "300", "400"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Mirror",
  description:
    "Tell me what you're carrying. I won't help you. I'll ask you the one question you're not asking yourself.",
  metadataBase: new URL("https://the-mirror-eight.vercel.app"),
  openGraph: {
    title: "The Mirror",
    description:
      "I won't help you. I'll ask you the one question you're not asking yourself.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Mirror",
    description:
      "I won't help you. I'll ask you the one question you're not asking yourself.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${outfit.variable}`}>
      <body className="bg-[#060606] text-white antialiased">{children}</body>
    </html>
  );
}
