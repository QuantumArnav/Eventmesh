import { NextResponse } from "next/server";
import { listVenues } from "@/lib/venue-store";

export const runtime = "nodejs";
export async function GET() {
  try { return NextResponse.json(await listVenues()); }
  catch { return NextResponse.json({ error: "Could not load demo venues." }, { status: 500 }); }
}
