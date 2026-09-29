import { NextResponse } from "next/server";
import { extractEvent, ExtractionUnavailableError } from "@/lib/ai/event-extractor";
import { serverLog } from "@/lib/server-log";
import { validPosterBytes } from "@/lib/image-validation";
import { limitedFormData, limitedJson, RequestTooLargeError } from "@/lib/request-limits";
import { rejectCrossOrigin, requireOrganizer } from "@/lib/current-user";

export const runtime = "nodejs";
export async function POST(request: Request) {
  const { error } = await requireOrganizer();
  if (error) return error;
  const crossOrigin = rejectCrossOrigin(request);
  if (crossOrigin) return crossOrigin;
  try {
    if (request.headers.get("content-type")?.includes("application/json")) {
      serverLog("extraction_attempt", { source: "text" });
      const body = await limitedJson(request) as { text?: unknown };
      if (typeof body?.text !== "string" || body.text.trim().length < 15 || body.text.length > 5000) return NextResponse.json({ error: "Paste an announcement between 15 and 5,000 characters." }, { status: 400 });
      return NextResponse.json(await extractEvent({ sourceType: "text", content: body.text }));
    }
    if (!request.headers.get("content-type")?.startsWith("multipart/form-data")) return NextResponse.json({ error: "Use JSON for announcements or multipart form data for posters." }, { status: 415 });
    const body = await limitedFormData(request);
    const file = body.get("poster");
    serverLog("extraction_attempt", { source: "poster" });
    if (!(file instanceof File)) return NextResponse.json({ error: "Choose a poster image." }, { status: 400 });
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) return NextResponse.json({ error: "Use a PNG, JPEG, or WebP poster." }, { status: 400 });
    if (file.size === 0 || file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Poster must be a nonempty image under 5 MB." }, { status: 400 });
    if (!(await validPosterBytes(Buffer.from(await file.arrayBuffer()), file.type))) return NextResponse.json({ error: "The poster is damaged or its content does not match its file type." }, { status: 400 });
    return NextResponse.json(await extractEvent({ sourceType: "image", content: file }));
  } catch (error) {
    if (error instanceof RequestTooLargeError) return NextResponse.json({ error: "Request is too large. Posters must be under 5 MB." }, { status: 413 });
    if (error instanceof SyntaxError || error instanceof TypeError) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    serverLog("extraction_failure", { reason: error instanceof ExtractionUnavailableError ? "unavailable" : "invalid_or_internal" });
    if (error instanceof ExtractionUnavailableError) return NextResponse.json({ error: error.message }, { status: 503 });
    return NextResponse.json({ error: "Extraction failed. Enter details manually." }, { status: 500 });
  }
}
