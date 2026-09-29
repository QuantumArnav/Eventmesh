import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getEventPreferences } from "@/lib/event-store";
import { limitedJson, RequestTooLargeError } from "@/lib/request-limits";
import { ensureStudentProfile, rejectCrossOrigin, requireUser } from "@/lib/current-user";

export const runtime = "nodejs";
export async function POST(request: Request) {
  const { user, error } = await requireUser();
  if (error) return error;
  const crossOrigin = rejectCrossOrigin(request);
  if (crossOrigin) return crossOrigin;
  try {
    const body = await limitedJson(request, 1024) as { eventId?: unknown; preference?: unknown } | null;
    const eventId = body?.eventId;
    const preference = body?.preference;
    if (typeof eventId !== "string" || typeof preference !== "string" || !["INTERESTED", "SAVED", "MUST_ATTEND"].includes(preference)) return NextResponse.json({ error: "Invalid preference" }, { status: 400 });
    if (!await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } })) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    await ensureStudentProfile(user!);
    await prisma.savedEvent.upsert({ where: { studentId_eventId: { studentId: user!.id, eventId } }, update: { preference }, create: { studentId: user!.id, eventId, preference } });
    return NextResponse.json({ preferences: await getEventPreferences(user!.id) });
  } catch (error) {
    if (error instanceof RequestTooLargeError) return NextResponse.json({ error: "Priority request is too large." }, { status: 413 });
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Invalid priority request." }, { status: 400 });
    return NextResponse.json({ error: "Could not update event priority" }, { status: 500 });
  }
}
