import { NextResponse } from "next/server";
import { analyzeConflicts } from "@/lib/conflict-engine";
import { createEvent, listEvents } from "@/lib/event-store";
import { eventInputSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET() {
  try { return NextResponse.json(await listEvents()); }
  catch { return NextResponse.json({ error: "Could not load events. Check database setup." }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = eventInputSchema.safeParse(body.event);
    if (!parsed.success) return NextResponse.json({ error: "Please correct the event details.", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
    const conflicts = analyzeConflicts(parsed.data, await listEvents());
    if (conflicts.some((item) => item.score >= 60) && body.confirmConflicts !== true) {
      return NextResponse.json({ error: "Review and confirm the detected conflicts before publishing.", conflicts }, { status: 409 });
    }
    return NextResponse.json(await createEvent(parsed.data), { status: 201 });
  } catch { return NextResponse.json({ error: "Could not publish event. Please try again." }, { status: 500 }); }
}
