import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getSource, SOURCE_STATUSES, updateSource } from "@/lib/inbox-store";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  try {
    const source = await getSource((await params).id);
    return source ? NextResponse.json(source) : NextResponse.json({ error: "Source not found." }, { status: 404 });
  } catch { return NextResponse.json({ error: "Could not load source." }, { status: 500 }); }
}

export async function PATCH(request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const body = await request.json();
    if (!SOURCE_STATUSES.includes(body.status) || body.status === "NEW" || body.status === "PUBLISHED") return NextResponse.json({ error: "Invalid review state." }, { status: 400 });
    const source = await getSource(id);
    if (!source) return NextResponse.json({ error: "Source not found." }, { status: 404 });
    if (source.status === "PUBLISHED") return NextResponse.json({ error: "Published sources cannot return to review." }, { status: 409 });
    const updated = await updateSource(id, body.status);
    return NextResponse.json({ id: updated.id, status: updated.status });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return NextResponse.json({ error: "Source not found." }, { status: 404 });
    return NextResponse.json({ error: "Could not update source." }, { status: 500 });
  }
}
