import { NextResponse } from "next/server";
import { analyzeConflicts } from "@/lib/conflict-engine";
import { createEvent, findExactEvent, listEvents, SourceAlreadyPublishedError } from "@/lib/event-store";
import { eventInputSchema } from "@/lib/validation";
import { serverLog } from "@/lib/server-log";
import { Prisma } from "@prisma/client";
import { getSource } from "@/lib/inbox-store";
import { limitedJson, RequestTooLargeError } from "@/lib/request-limits";

export const runtime = "nodejs";

export async function GET() {
  try { return NextResponse.json(await listEvents()); }
  catch { return NextResponse.json({ error: "Could not load events. Check database setup." }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const body = await limitedJson(request, 16 * 1024) as { event?: unknown; sourceId?: unknown; confirmConflicts?: unknown } | null;
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid event request." }, { status: 400 });
    const parsed = eventInputSchema.safeParse(body.event);
    if (!parsed.success) return NextResponse.json({ error: "Please correct the event details.", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
    const sourceId = typeof body.sourceId === "string" && body.sourceId.length < 100 ? body.sourceId : undefined;
    if (body.sourceId !== undefined && !sourceId) return NextResponse.json({ error: "Invalid source reference." }, { status: 400 });
    if (sourceId) {
      const source = await getSource(sourceId);
      if (!source) return NextResponse.json({ error: "Source not found." }, { status: 404 });
      if (source.status === "PUBLISHED") return NextResponse.json({ error: "This source was already published.", existingId: source.publishedEventId }, { status: 409 });
    }
    const existing = await findExactEvent(parsed.data);
    if (existing) return NextResponse.json({ error: "This exact event is already listed.", existingId: existing.id }, { status: 409 });
    const conflicts = analyzeConflicts(parsed.data, await listEvents());
    serverLog("conflict_evaluation", { candidateDate: parsed.data.date, conflicts: conflicts.length });
    if (conflicts.some((item) => item.score >= 60) && body.confirmConflicts !== true) {
      return NextResponse.json({ error: "Review and confirm the detected conflicts before publishing.", conflicts }, { status: 409 });
    }
    const created = await createEvent(parsed.data, sourceId);
    serverLog("event_created", { eventId: created.id, category: created.category });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof RequestTooLargeError) return NextResponse.json({ error: "Event request is too large." }, { status: 413 });
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Invalid event request." }, { status: 400 });
    if (error instanceof SourceAlreadyPublishedError) return NextResponse.json({ error: "This source was already published." }, { status: 409 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return NextResponse.json({ error: "This exact event is already listed." }, { status: 409 });
    return NextResponse.json({ error: "Could not publish event. Please try again." }, { status: 500 });
  }
}
