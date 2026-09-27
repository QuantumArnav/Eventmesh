import { prisma } from "./db";

export const SOURCE_STATUSES = ["NEW", "NEEDS_REVIEW", "DUPLICATE", "CONFLICT_FOUND", "READY_TO_PUBLISH", "PUBLISHED"] as const;
export type SourceStatus = (typeof SOURCE_STATUSES)[number];

export async function listSources() {
  return prisma.eventSource.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, sourceType: true, label: true, status: true, publishedEventId: true, createdAt: true } });
}

export async function getSource(id: string) {
  return prisma.eventSource.findUnique({ where: { id } });
}

export async function createSource(source: { sourceType: "TEXT" | "POSTER"; label: string; sourceData: string; extractedJson?: string | null; status: SourceStatus }) {
  return prisma.eventSource.create({ data: source, select: { id: true, status: true } });
}

export async function updateSource(id: string, status: SourceStatus, publishedEventId?: string) {
  return prisma.eventSource.update({ where: { id }, data: { status, publishedEventId: publishedEventId ?? undefined } });
}
