import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getEventPreferences } from "@/lib/event-store";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const { eventId, preference } = await request.json();
    if (typeof eventId !== "string" || !["INTERESTED", "SAVED", "MUST_ATTEND"].includes(preference)) return NextResponse.json({ error: "Invalid preference" }, { status: 400 });
    if (!await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } })) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    await prisma.savedEvent.upsert({ where: { studentId_eventId: { studentId: "demo-student", eventId } }, update: { preference }, create: { studentId: "demo-student", eventId, preference } });
    return NextResponse.json({ preferences: await getEventPreferences() });
  } catch { return NextResponse.json({ error: "Could not update event priority" }, { status: 500 }); }
}
