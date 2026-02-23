import Link from "next/link";

import { getAllNotes } from "@/lib/notes";

export const dynamic = "force-dynamic";

function formatDate(value?: string): string {
  if (!value) return "N/A";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function HomePage() {
  const notes = await getAllNotes();
  const dailyNotes = notes.filter((note) => note.type === "daily");
  const totalWordCount = notes.reduce((sum, note) => sum + note.wordCount, 0);
  const lastUpdated = notes[0]?.lastModified;
  const recentDaily = dailyNotes.slice(0, 5);

  const stats = [
    { label: "Total Notes", value: String(notes.length) },
    { label: "Last Updated", value: formatDate(lastUpdated) },
    { label: "Total Words", value: totalWordCount.toLocaleString("en-US") },
  ];

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-white/10 bg-[linear-gradient(135deg,rgba(255,51,51,0.12),rgba(255,255,255,0.03))] p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">Dashboard</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">🎬 LeftBurst Second Brain</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-300 sm:text-base">
          Review memory files, daily notes, and creator context in one place. Built for quick recall before scripting, filming, or planning.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-white/10 bg-[var(--card)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">{stat.label}</p>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-white">{stat.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-white/10 bg-[var(--card)] p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">Recent Daily Notes</h2>
            <Link href="/notes" className="text-sm text-[var(--accent)] hover:text-[#ff6666]">
              Browse all notes
            </Link>
          </div>

          {recentDaily.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-zinc-400">
              No daily memory files found in `/Users/noahpark/.openclaw/workspace/memory/`.
            </p>
          ) : (
            <ul className="space-y-3">
              {recentDaily.map((note) => (
                <li key={note.id}>
                  <Link
                    href={`/notes/${note.id}`}
                    className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3 transition hover:border-[var(--accent)]/40 hover:bg-white/5"
                  >
                    <div>
                      <p className="font-medium text-white">{note.title}</p>
                      <p className="mt-1 text-xs text-zinc-400">{formatDate(note.lastModified)}</p>
                    </div>
                    <span className="text-xs text-zinc-500">{note.wordCount.toLocaleString()} words</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-[var(--card)] p-5">
          <h2 className="text-lg font-semibold text-white">Quick Links</h2>
          <div className="mt-4 grid gap-3">
            <Link href="/notes" className="rounded-xl border border-white/10 bg-black/20 p-4 transition hover:border-[var(--accent)]/40 hover:bg-white/5">
              <p className="font-medium text-white">Notes Browser</p>
              <p className="mt-1 text-sm text-zinc-400">Search across memory, config, and daily markdown files.</p>
            </Link>
            <Link href="/api/notes" className="rounded-xl border border-white/10 bg-black/20 p-4 transition hover:border-[var(--accent)]/40 hover:bg-white/5">
              <p className="font-medium text-white">Notes API JSON</p>
              <p className="mt-1 text-sm text-zinc-400">Raw note payload for integrations and debugging.</p>
            </Link>
            <a
              href="file:///Users/noahpark/.openclaw/workspace"
              className="rounded-xl border border-white/10 bg-black/20 p-4 transition hover:border-[var(--accent)]/40 hover:bg-white/5"
            >
              <p className="font-medium text-white">Open Memory Workspace</p>
              <p className="mt-1 text-sm text-zinc-400">Jump to the local folder containing source markdown files.</p>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
