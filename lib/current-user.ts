import { NextResponse } from "next/server";
import { auth, authConfigured } from "@/auth";
import { prisma } from "@/lib/db";

export async function getCurrentUser() {
  if (!authConfigured) return null;
  const session = await auth();
  if (!session?.user?.email) return null;
  return prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, name: true, email: true, image: true, role: true },
  });
}

export async function requireUser() {
  const user = await getCurrentUser();
  return user ? { user, error: null } : { user: null, error: NextResponse.json({ error: "Sign in to use your personal EventMesh account." }, { status: 401 }) };
}

export async function requireOrganizer() {
  const result = await requireUser();
  if (result.error) return result;
  if (result.user?.role !== "ORGANIZER" && result.user?.role !== "ADMIN") {
    return { user: null, error: NextResponse.json({ error: "Organizer access is required." }, { status: 403 }) };
  }
  return result;
}

export function rejectCrossOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const site = request.headers.get("sec-fetch-site");
  const internalOrigin = new URL(request.url);
  const host = request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || internalOrigin.protocol.slice(0, -1);
  const publicOrigin = host ? `${protocol}://${host}` : internalOrigin.origin;
  if ((origin && origin !== internalOrigin.origin && origin !== publicOrigin) || site === "cross-site") {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }
  return null;
}

export async function ensureStudentProfile(user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>) {
  return prisma.studentProfile.upsert({
    where: { userId: user.id },
    update: { name: user.name || user.email || "Student" },
    create: {
      id: user.id, userId: user.id, name: user.name || user.email || "Student",
      interestsJson: "[]", categoryPreferencesJson: "[]", organizerAffinityJson: "[]",
    },
  });
}
