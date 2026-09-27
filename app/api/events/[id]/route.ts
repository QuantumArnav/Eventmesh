import { NextResponse } from "next/server";
import { getEvent } from "@/lib/event-store";

export const runtime = "nodejs";
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const event = await getEvent(id);
    return event ? NextResponse.json(event) : NextResponse.json({ error: "Event not found" }, { status: 404 });
  } catch { return NextResponse.json({ error: "Could not load event" }, { status: 500 }); }
}
