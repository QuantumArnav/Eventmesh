import { NextResponse } from "next/server";
import { getSavedEventIds, getStudent } from "@/lib/event-store";

export const runtime = "nodejs";
export async function GET() {
  try {
    const [student, savedEventIds] = await Promise.all([getStudent(), getSavedEventIds()]);
    return NextResponse.json({ student, savedEventIds });
  } catch { return NextResponse.json({ error: "Could not load demo profile. Run the seed command." }, { status: 500 }); }
}
