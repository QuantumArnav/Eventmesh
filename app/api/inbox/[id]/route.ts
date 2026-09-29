import { NextResponse } from "next/server";
import { getSource, SOURCE_STATUSES, updateSource, type SourceStatus } from "@/lib/inbox-store";
import { limitedJson, RequestTooLargeError } from "@/lib/request-limits";
import { rejectCrossOrigin, requireOrganizer } from "@/lib/current-user";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  const { error } = await requireOrganizer();
  if (error) return error;
  try {
    const source = await getSource((await params).id);
    return source ? NextResponse.json(source) : NextResponse.json({ error: "Source not found." }, { status: 404 });
  } catch { return NextResponse.json({ error: "Could not load source." }, { status: 500 }); }
}

export async function PATCH(request: Request, { params }: Context) {
  const { error } = await requireOrganizer();
  if (error) return error;
  const crossOrigin = rejectCrossOrigin(request);
  if (crossOrigin) return crossOrigin;
  try {
    const { id } = await params;
    const body = await limitedJson(request, 1024) as { status?: unknown } | null;
    if (!body || !SOURCE_STATUSES.includes(body.status as typeof SOURCE_STATUSES[number]) || body.status === "NEW" || body.status === "PUBLISHED") return NextResponse.json({ error: "Invalid review state." }, { status: 400 });
    const status = body.status as SourceStatus;
    const source = await getSource(id);
    if (!source) return NextResponse.json({ error: "Source not found." }, { status: 404 });
    if (source.status === "PUBLISHED") return NextResponse.json({ error: "Published sources cannot return to review." }, { status: 409 });
    if (!(await updateSource(id, status))) return NextResponse.json({ error: "This source was published while you were reviewing it." }, { status: 409 });
    return NextResponse.json({ id, status });
  } catch (error) {
    if (error instanceof RequestTooLargeError) return NextResponse.json({ error: "Review request is too large." }, { status: 413 });
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Invalid review request." }, { status: 400 });
    return NextResponse.json({ error: "Could not update source." }, { status: 500 });
  }
}
