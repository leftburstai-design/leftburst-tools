import Link from "next/link";
import { notFound } from "next/navigation";

import { markdownToHtml } from "@/lib/markdown";
import { getNoteById } from "@/lib/notes";

export const dynamic = "force-dynamic";

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

type NotePageProps = {
  params: Promise<{ id: string }>;
};

export default async function NotePage({ params }: NotePageProps) {
  const { id } = await params;
  const note = await getNoteById(id);

  if (!note) {
    notFound();
  }

  const html = markdownToHtml(note.content);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/notes"
          className="inline-flex items-center rounded-xl border border-white/10 bg-[var(--card)] px-4 py-2 text-sm text-zinc-200 transition hover:border-[var(--accent)]/40 hover:text-white"
        >
          ← Back
        </Link>
        <a
          href={`file://${note.path}`}
          title={note.path}
          className="inline-flex items-center rounded-xl border border-[var(--accent)]/25 bg-[var(--accent)]/8 px-4 py-2 text-sm text-[#ffb3b3] transition hover:border-[var(--accent)]/50 hover:text-white"
        >
          Edit ({note.path})
        </a>
      </div>

      <header className="rounded-2xl border border-white/10 bg-[var(--card)] p-6">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{note.title}</h1>
          <span className="rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-xs uppercase tracking-widest text-zinc-400">
            {note.type}
          </span>
        </div>
        <div className="mt-4 grid gap-3 text-sm text-zinc-400 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Path</p>
            <p className="mt-1 break-all text-zinc-300">{note.path}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Last Modified</p>
            <p className="mt-1 text-zinc-300">{formatDate(note.lastModified)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Word Count</p>
            <p className="mt-1 text-zinc-300">{note.wordCount.toLocaleString("en-US")}</p>
          </div>
        </div>
      </header>

      <article className="rounded-2xl border border-white/10 bg-[var(--card)] p-6">
        <div className="markdown-body" dangerouslySetInnerHTML={{ __html: html || "<p>(Empty note)</p>" }} />
      </article>
    </div>
  );
}
