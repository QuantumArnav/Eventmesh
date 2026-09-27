import { NextResponse } from "next/server";
import { getEventPreferences, getStudent } from "@/lib/event-store";

export const runtime = "nodejs";
export async function GET() {
  try {
    const [student, preferences] = await Promise.all([getStudent(), getEventPreferences()]);
    return NextResponse.json({ student, preferences, savedEventIds: Object.keys(preferences) });
  } catch { return NextResponse.json({ error: "Could not load demo profile. Run the seed command." }, { status: 500 }); }
}
