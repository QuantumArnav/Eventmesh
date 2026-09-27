import { NextResponse } from "next/server";
import { analyzeConflicts, suggestSlots } from "@/lib/conflict-engine";
import { detectDuplicates } from "@/lib/duplicate-detector";
import { listEvents } from "@/lib/event-store";
import { eventInputSchema } from "@/lib/validation";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const parsed = eventInputSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Complete valid event details before checking conflicts.", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
    const events = await listEvents();
    return NextResponse.json({ duplicates: detectDuplicates(parsed.data, events).slice(0, 3), conflicts: analyzeConflicts(parsed.data, events), suggestions: suggestSlots(parsed.data, events) });
  } catch { return NextResponse.json({ error: "Could not analyze conflicts" }, { status: 500 }); }
}
