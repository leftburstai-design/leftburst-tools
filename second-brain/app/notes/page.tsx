"use client";

import Fuse from "fuse.js";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { NoteRecord } from "@/lib/notes";

type LoadState = "loading" | "ready" | "error";

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function badgeClasses(type: NoteRecord["type"]): string {
  if (type === "daily") return "border-blue-400/20 bg-blue-400/10 text-blue-200";
  if (type === "memory") return "border-[var(--accent)]/30 bg-[var(--accent)]/10 text-[#ff9f9f]";
  return "border-zinc-500/20 bg-zinc-500/10 text-zinc-300";
}

export default function NotesPage() {
  const [notes, setNotes] = useState<NoteRecord[]>([]);
  const [query, setQuery] = useState("");
  const [state, setState] = useState<LoadState>("loading");

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await fetch("/api/notes", { cache: "no-store" });
        if (!response.ok) throw new Error(`Failed: ${response.status}`);
        const data = (await response.json()) as NoteRecord[];
        if (!active) return;
        setNotes(Array.isArray(data) ? data : []);
        setState("ready");
      } catch (error) {
        console.error("Failed to fetch notes", error);
        if (!active) return;
        setState("error");
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  const fuse = useMemo(
    () =>
      new Fuse(notes, {
        keys: ["title", "content", "path", "type"],
        includeScore: true,
        threshold: 0.35,
        ignoreLocation: true,
        minMatchCharLength: 2,
      }),
    [notes],
  );

  const visibleNotes = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return notes;
    return fuse.search(trimmed).map((result) => result.item);
  }, [fuse, notes, query]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-[var(--card)] p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Notes Browser</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Search Memory & Notes</h1>
        <p className="mt-2 text-sm text-zinc-400">Fuzzy search across all markdown content using Fuse.js.</p>
        <div className="mt-4">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search titles, content, paths..."
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[var(--card)] p-3 sm:p-4">
        <div className="mb-3 flex items-center justify-between px-2">
          <p className="text-sm text-zinc-400">
            {state === "ready" ? `${visibleNotes.length} result${visibleNotes.length === 1 ? "" : "s"}` : "Loading notes..."}
          </p>
          {query.trim() ? <p className="text-xs text-zinc-500">Query: {query}</p> : null}
        </div>

        {state === "loading" ? (
          <p className="rounded-xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-zinc-400">Loading notes…</p>
        ) : state === "error" ? (
          <p className="rounded-xl border border-dashed border-[var(--accent)]/30 bg-[var(--accent)]/5 p-4 text-sm text-zinc-300">
            Could not load notes from `/api/notes`. Check filesystem paths and server logs.
          </p>
        ) : visibleNotes.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-zinc-400">
            No notes matched your search.
          </p>
        ) : (
          <ul className="space-y-2">
            {visibleNotes.map((note) => (
              <li key={note.id}>
                <Link
                  href={`/notes/${note.id}`}
                  className="block rounded-xl border border-white/10 bg-black/20 p-4 transition hover:border-[var(--accent)]/40 hover:bg-white/5"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold tracking-tight text-white">{note.title}</h2>
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium uppercase tracking-wide ${badgeClasses(note.type)}`}>
                      {note.type}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-400">{note.content.replace(/\s+/g, " ").trim() || "(Empty note)"}</p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                    <span>{note.wordCount.toLocaleString()} words</span>
                    <span>{formatDate(note.lastModified)}</span>
                    <span className="truncate">{note.path}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
