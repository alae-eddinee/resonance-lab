import type { Metadata } from "next";
import { Barlow, Source_Sans_3 } from "next/font/google";
import { AppShell } from "@/components/layout/AppShell";
import "./globals.css";

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Resonance Lab — Live Audio & Cymatics Explorer",
    template: "%s — Resonance Lab",
  },
  description:
    "See how sound frequencies interact with virtual vibrating plates in real time. Measure audio, explore simulated plates, and compare observations from real footage.",
  openGraph: {
    title: "Resonance Lab — Live Audio & Cymatics Explorer",
    description:
      "See how sound frequencies interact with virtual vibrating plates in real time.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${barlow.variable} ${sourceSans.variable} h-full antialiased`}>
      <body className="min-h-full">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
