import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSavedEventIds } from "@/lib/event-store";
import { limitedJson, RequestTooLargeError } from "@/lib/request-limits";
import { ensureStudentProfile, rejectCrossOrigin, requireUser } from "@/lib/current-user";

export const runtime = "nodejs";
export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;
  try { return NextResponse.json({ savedEventIds: await getSavedEventIds(user!.id) }); }
  catch { return NextResponse.json({ error: "Could not load schedule" }, { status: 500 }); }
}

export async function POST(request: Request) {
  const { user, error } = await requireUser();
  if (error) return error;
  const crossOrigin = rejectCrossOrigin(request);
  if (crossOrigin) return crossOrigin;
  try {
    const eventId = (await limitedJson(request, 1024) as { eventId?: unknown } | null)?.eventId;
    if (typeof eventId !== "string") return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } });
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    await ensureStudentProfile(user!);
    await prisma.savedEvent.upsert({ where: { studentId_eventId: { studentId: user!.id, eventId } }, update: {}, create: { studentId: user!.id, eventId } });
    return NextResponse.json({ savedEventIds: await getSavedEventIds(user!.id) });
  } catch (error) {
    if (error instanceof RequestTooLargeError) return NextResponse.json({ error: "Schedule request is too large." }, { status: 413 });
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Invalid schedule request." }, { status: 400 });
    return NextResponse.json({ error: "Could not save event" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { user, error } = await requireUser();
  if (error) return error;
  const crossOrigin = rejectCrossOrigin(request);
  if (crossOrigin) return crossOrigin;
  try {
    const eventId = (await limitedJson(request, 1024) as { eventId?: unknown } | null)?.eventId;
    if (typeof eventId !== "string") return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    await prisma.savedEvent.deleteMany({ where: { studentId: user!.id, eventId } });
    return NextResponse.json({ savedEventIds: await getSavedEventIds(user!.id) });
  } catch (error) {
    if (error instanceof RequestTooLargeError) return NextResponse.json({ error: "Schedule request is too large." }, { status: 413 });
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Invalid schedule request." }, { status: 400 });
    return NextResponse.json({ error: "Could not remove event" }, { status: 500 });
  }
}
