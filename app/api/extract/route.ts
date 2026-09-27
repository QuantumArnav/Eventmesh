import { NextResponse } from "next/server";
import { extractEventFromPoster, ExtractionUnavailableError } from "@/lib/ai/event-extractor";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const body = await request.formData();
    const file = body.get("poster");
    if (!(file instanceof File)) return NextResponse.json({ error: "Choose a poster image." }, { status: 400 });
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) return NextResponse.json({ error: "Use a PNG, JPEG, or WebP poster." }, { status: 400 });
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Poster must be under 5 MB." }, { status: 400 });
    return NextResponse.json({ extracted: await extractEventFromPoster(file) });
  } catch (error) {
    if (error instanceof ExtractionUnavailableError) return NextResponse.json({ error: error.message }, { status: 503 });
    return NextResponse.json({ error: "Poster extraction failed. Enter details manually." }, { status: 500 });
  }
}
