import { NextResponse } from "next/server";
import { getEventPreferences, getStudent } from "@/lib/event-store";
import { ensureStudentProfile, rejectCrossOrigin, requireUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import { limitedJson, RequestTooLargeError } from "@/lib/request-limits";
import { INTERESTS } from "@/lib/interests";

export const runtime = "nodejs";
export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;
  try {
    await ensureStudentProfile(user!);
    const [student, preferences] = await Promise.all([getStudent(user!.id), getEventPreferences(user!.id)]);
    return NextResponse.json({ account: user, student, preferences, savedEventIds: Object.keys(preferences) });
  } catch { return NextResponse.json({ error: "Could not load your profile." }, { status: 500 }); }
}

export async function PATCH(request: Request) {
  const { user, error } = await requireUser();
  if (error) return error;
  const crossOrigin = rejectCrossOrigin(request);
  if (crossOrigin) return crossOrigin;
  try {
    const body = await limitedJson(request, 2048) as { interests?: unknown } | null;
    if (!Array.isArray(body?.interests) || body.interests.length > INTERESTS.length || body.interests.some((value) => typeof value !== "string" || !INTERESTS.includes(value as typeof INTERESTS[number]))) {
      return NextResponse.json({ error: "Choose interests from the list." }, { status: 400 });
    }
    await ensureStudentProfile(user!);
    await prisma.studentProfile.update({ where: { userId: user!.id }, data: { interestsJson: JSON.stringify([...new Set(body.interests)]) } });
    return NextResponse.json({ student: await getStudent(user!.id) });
  } catch (cause) {
    if (cause instanceof RequestTooLargeError) return NextResponse.json({ error: "Profile request is too large." }, { status: 413 });
    if (cause instanceof SyntaxError) return NextResponse.json({ error: "Invalid profile request." }, { status: 400 });
    return NextResponse.json({ error: "Could not update interests." }, { status: 500 });
  }
}
