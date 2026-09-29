import { NextResponse } from "next/server";
import { interpretSearch } from "@/lib/ai/search-interpreter";
import { todayInIsth } from "@/lib/dates";
import { getEventPreferences, getStudent, listEvents } from "@/lib/event-store";
import { smartSearch } from "@/lib/smart-search";
import { limitedJson, RequestTooLargeError } from "@/lib/request-limits";
import { getCurrentUser } from "@/lib/current-user";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body: unknown = await limitedJson(request, 1024);
    const text = typeof body === "object" && body !== null && "text" in body ? body.text : null;
    if (typeof text !== "string" || text.trim().length < 2 || text.length > 200) {
      return NextResponse.json({ error: "Enter a search phrase between 2 and 200 characters." }, { status: 400 });
    }
    const { query, method } = await interpretSearch(text.trim(), todayInIsth());
    const user = await getCurrentUser();
    if (query.avoidScheduleConflicts && !user) return NextResponse.json({ error: "Sign in to search around your saved schedule." }, { status: 401 });
    const [events, student, preferences] = await Promise.all([
      listEvents(), user ? getStudent(user.id).catch(() => null) : null,
      user ? getEventPreferences(user.id) : {},
    ]);
    return NextResponse.json({ query, method, results: smartSearch(query, events, student, Object.keys(preferences)).slice(0, 20) });
  } catch (error) {
    if (error instanceof RequestTooLargeError) return NextResponse.json({ error: "Search request is too large." }, { status: 413 });
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Invalid search request." }, { status: 400 });
    return NextResponse.json({ error: "Smart Search is temporarily unavailable. Use the standard event filters below." }, { status: 503 });
  }
}
