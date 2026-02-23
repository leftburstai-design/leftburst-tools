import { NextResponse } from "next/server";

import { getAllNotes } from "@/lib/notes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const notes = await getAllNotes();
    return NextResponse.json(notes);
  } catch (error) {
    console.error("Failed to load notes", error);
    return NextResponse.json([], { status: 200 });
  }
}
