import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LeftBurst Second Brain",
  description: "Personal knowledge base for LeftBurst notes, memories, and AI conversations.",
};

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/notes", label: "Notes Browser" },
  { href: "/api/notes", label: "Notes API" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} bg-[var(--bg)] text-white antialiased`}>
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,51,51,0.16),_transparent_45%),var(--bg)]">
          <div className="mx-auto grid min-h-screen w-full max-w-[1600px] grid-cols-1 lg:grid-cols-[280px_1fr]">
            <aside className="border-b border-white/10 bg-[var(--sidebar)] p-5 lg:border-r lg:border-b-0">
              <div className="sticky top-5 space-y-8">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
                  <p className="text-xs uppercase tracking-[0.22em] text-zinc-400">Creator Studio</p>
                  <h1 className="mt-2 flex items-center gap-2 text-xl font-semibold tracking-tight text-white">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent)]/15 text-lg text-[var(--accent)]">
                      🎬
                    </span>
                    LeftBurst
                  </h1>
                  <p className="mt-2 text-sm text-zinc-400">Second Brain for memory review, notes, and AI conversation context.</p>
                </div>

                <nav aria-label="Primary navigation" className="space-y-2">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="group flex items-center justify-between rounded-xl border border-transparent bg-white/0 px-3 py-2 text-sm text-zinc-300 transition hover:border-white/10 hover:bg-white/5 hover:text-white"
                    >
                      <span>{item.label}</span>
                      <span className="text-xs text-zinc-500 transition group-hover:text-[var(--accent)]">↗</span>
                    </Link>
                  ))}
                </nav>

                <div className="rounded-2xl border border-white/10 bg-[#111] p-4 text-sm text-zinc-400">
                  <p className="font-medium text-white">Memory Sources</p>
                  <p className="mt-2 leading-6">Reads `MEMORY.md`, `USER.md`, `SOUL.md`, `IDENTITY.md`, and daily notes from the OpenClaw workspace.</p>
                </div>
              </div>
            </aside>

            <main className="p-5 sm:p-8 lg:p-10">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
