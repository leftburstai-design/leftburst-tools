import { promises as fs } from "node:fs";
import path from "node:path";

export type NoteType = "memory" | "daily" | "config";

export type NoteRecord = {
  id: string;
  title: string;
  content: string;
  path: string;
  lastModified: string;
  wordCount: number;
  type: NoteType;
};

const ROOT_MEMORY_DIR = "/Users/noahpark/.openclaw/workspace";
const DAILY_MEMORY_DIR = path.join(ROOT_MEMORY_DIR, "memory");

const FILE_SOURCES: Array<{ filePath: string; type: NoteType }> = [
  { filePath: path.join(ROOT_MEMORY_DIR, "MEMORY.md"), type: "memory" },
  { filePath: path.join(ROOT_MEMORY_DIR, "USER.md"), type: "config" },
  { filePath: path.join(ROOT_MEMORY_DIR, "SOUL.md"), type: "config" },
  { filePath: path.join(ROOT_MEMORY_DIR, "IDENTITY.md"), type: "config" },
];

function extractTitle(content: string, filePath: string): string {
  const heading = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => /^#{1,6}\s+/.test(line));

  if (heading) {
    return heading.replace(/^#{1,6}\s+/, "").trim();
  }

  return path.basename(filePath, path.extname(filePath));
}

function countWords(content: string): number {
  const words = content.trim().match(/\S+/g);
  return words ? words.length : 0;
}

function encodeNoteId(filePath: string): string {
  return Buffer.from(filePath, "utf8").toString("base64url");
}

export function decodeNoteId(id: string): string {
  try {
    return Buffer.from(id, "base64url").toString("utf8");
  } catch {
    return "";
  }
}

async function loadMarkdownFile(filePath: string, type: NoteType): Promise<NoteRecord | null> {
  try {
    const [content, stats] = await Promise.all([
      fs.readFile(filePath, "utf8"),
      fs.stat(filePath),
    ]);

    return {
      id: encodeNoteId(filePath),
      title: extractTitle(content, filePath),
      content,
      path: filePath,
      lastModified: stats.mtime.toISOString(),
      wordCount: countWords(content),
      type,
    };
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT" || code === "ENOTDIR") {
      return null;
    }
    throw error;
  }
}

async function loadDailyNotes(): Promise<NoteRecord[]> {
  let entries: string[] = [];

  try {
    entries = await fs.readdir(DAILY_MEMORY_DIR);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT" || code === "ENOTDIR") {
      return [];
    }
    throw error;
  }

  const markdownFiles = entries
    .filter((entry) => entry.toLowerCase().endsWith(".md"))
    .map((entry) => path.join(DAILY_MEMORY_DIR, entry));

  const loaded = await Promise.all(markdownFiles.map((filePath) => loadMarkdownFile(filePath, "daily")));
  return loaded.filter((note): note is NoteRecord => note !== null);
}

export async function getAllNotes(): Promise<NoteRecord[]> {
  const [rootNotes, dailyNotes] = await Promise.all([
    Promise.all(FILE_SOURCES.map(({ filePath, type }) => loadMarkdownFile(filePath, type))),
    loadDailyNotes(),
  ]);

  return [...rootNotes.filter((note): note is NoteRecord => note !== null), ...dailyNotes].sort(
    (a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime(),
  );
}

export async function getNoteById(id: string): Promise<NoteRecord | null> {
  if (!id) return null;

  const decodedPath = decodeNoteId(id);
  if (!decodedPath) return null;

  const target = [...FILE_SOURCES.map((source) => source.filePath)];
  const isRootFile = target.includes(decodedPath);
  const isDailyFile = decodedPath.startsWith(`${DAILY_MEMORY_DIR}${path.sep}`) && decodedPath.endsWith(".md");

  if (!isRootFile && !isDailyFile) {
    return null;
  }

  const type: NoteType = isRootFile
    ? FILE_SOURCES.find((source) => source.filePath === decodedPath)?.type ?? "config"
    : "daily";

  return loadMarkdownFile(decodedPath, type);
}
