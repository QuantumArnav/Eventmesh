import { NextResponse } from "next/server";
import { createSource, listSources } from "@/lib/inbox-store";
import { extractEvent, ExtractionUnavailableError } from "@/lib/ai/event-extractor";
import { serverLog } from "@/lib/server-log";
import { validPosterBytes } from "@/lib/image-validation";

export const runtime = "nodejs";

export async function GET() {
  try { return NextResponse.json(await listSources()); }
  catch { return NextResponse.json({ error: "Could not load source inbox." }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    if (request.headers.get("content-type")?.includes("application/json")) {
      const body = await request.json();
      if (typeof body.text !== "string" || body.text.trim().length < 15 || body.text.length > 5000) return NextResponse.json({ error: "Announcement must be 15–5,000 characters." }, { status: 400 });
      const text = body.text.trim();
      const extracted = await extractEvent({ sourceType: "text", content: text });
      const source = await createSource({ sourceType: "TEXT", label: text.slice(0, 75).replace(/\s+/g, " "), sourceData: text, extractedJson: JSON.stringify(extracted), status: "NEEDS_REVIEW" });
      serverLog("source_staged", { source: "text", sourceId: source.id });
      return NextResponse.json(source, { status: 201 });
    }
    const body = await request.formData();
    const file = body.get("poster");
    if (!(file instanceof File) || !["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size === 0 || file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Choose a PNG, JPEG, or WebP poster under 5 MB." }, { status: 400 });
    const bytes = Buffer.from(await file.arrayBuffer());
    if (!validPosterBytes(bytes, file.type)) return NextResponse.json({ error: "The image content does not match its file type." }, { status: 400 });
    let extractedJson: string | null = null;
    let status: "NEW" | "NEEDS_REVIEW" = "NEW";
    try { extractedJson = JSON.stringify(await extractEvent({ sourceType: "image", content: file })); status = "NEEDS_REVIEW"; }
    catch (error) { if (!(error instanceof ExtractionUnavailableError)) throw error; }
    const source = await createSource({ sourceType: "POSTER", label: file.name.slice(0, 100), sourceData: `data:${file.type};base64,${bytes.toString("base64")}`, extractedJson, status });
    serverLog("source_staged", { source: "poster", sourceId: source.id, extracted: !!extractedJson });
    return NextResponse.json(source, { status: 201 });
  } catch { return NextResponse.json({ error: "Could not stage this source. Please try again." }, { status: 500 }); }
}
