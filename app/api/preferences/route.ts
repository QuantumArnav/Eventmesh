import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getEventPreferences } from "@/lib/event-store";
import { limitedJson, RequestTooLargeError } from "@/lib/request-limits";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const body = await limitedJson(request, 1024) as { eventId?: unknown; preference?: unknown } | null;
    const eventId = body?.eventId;
    const preference = body?.preference;
    if (typeof eventId !== "string" || typeof preference !== "string" || !["INTERESTED", "SAVED", "MUST_ATTEND"].includes(preference)) return NextResponse.json({ error: "Invalid preference" }, { status: 400 });
    if (!await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } })) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    await prisma.savedEvent.upsert({ where: { studentId_eventId: { studentId: "demo-student", eventId } }, update: { preference }, create: { studentId: "demo-student", eventId, preference } });
    return NextResponse.json({ preferences: await getEventPreferences() });
  } catch (error) {
    if (error instanceof RequestTooLargeError) return NextResponse.json({ error: "Priority request is too large." }, { status: 413 });
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Invalid priority request." }, { status: 400 });
    return NextResponse.json({ error: "Could not update event priority" }, { status: 500 });
  }
}
