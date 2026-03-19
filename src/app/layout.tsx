import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Mirror",
  description:
    "Tell me what you're carrying. I won't help you. I'll ask you the one question you're not asking yourself.",
  metadataBase: new URL("https://the-mirror.vercel.app"),
  openGraph: {
    title: "The Mirror",
    description:
      "I won't help you. I'll ask you the one question you're not asking yourself.",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "The Mirror",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Mirror",
    description:
      "I won't help you. I'll ask you the one question you're not asking yourself.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${cormorant.variable} ${dmSans.variable}`}>
      <body className="bg-void text-white antialiased">{children}</body>
    </html>
  );
}
