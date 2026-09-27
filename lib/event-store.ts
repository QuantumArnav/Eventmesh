import { prisma } from "./db";
import type { EventData, EventInput, StudentData, Category } from "./types";
import type { Preference } from "./schedule-optimizer";
import { createHash } from "node:crypto";

export class SourceAlreadyPublishedError extends Error {}

type DatabaseEvent = Awaited<ReturnType<typeof prisma.event.findFirst>>;

export function toEvent(row: NonNullable<DatabaseEvent>): EventData {
  return {
    id: row.id, title: row.title, organizer: row.organizer, description: row.description,
    date: row.date, startTime: row.startTime, endTime: row.endTime, venue: row.venue,
    category: row.category as Category, tags: JSON.parse(row.tagsJson) as string[],
    registrationDeadline: row.registrationDeadline, expectedAudience: row.expectedAudience,
    popularity: row.popularity, isDemo: row.isDemo, createdAt: row.createdAt.toISOString(),
  };
}

export async function listEvents(): Promise<EventData[]> {
  const rows = await prisma.event.findMany({ orderBy: [{ date: "asc" }, { startTime: "asc" }] });
  return rows.map(toEvent);
}

export async function getEvent(id: string): Promise<EventData | null> {
  const row = await prisma.event.findUnique({ where: { id } });
  return row ? toEvent(row) : null;
}

export async function findExactEvent(input: EventInput): Promise<EventData | null> {
  const row = await prisma.event.findFirst({ where: { title: input.title, organizer: input.organizer, date: input.date, startTime: input.startTime, endTime: input.endTime, venue: input.venue } });
  return row ? toEvent(row) : null;
}

export async function createEvent(input: EventInput, sourceId?: string): Promise<EventData> {
  const knownVenue = await prisma.venue.findFirst({ where: { name: { equals: input.venue } } });
  const submissionKey = createHash("sha256").update(JSON.stringify([input.title, input.organizer, input.date, input.startTime, input.endTime, input.venue])).digest("hex");
  const row = await prisma.$transaction(async (tx) => {
    const created = await tx.event.create({ data: {
      title: input.title, organizer: input.organizer, description: input.description,
      date: input.date, startTime: input.startTime, endTime: input.endTime,
      venue: input.venue, venueId: knownVenue?.id, submissionKey, category: input.category, tagsJson: JSON.stringify(input.tags),
      registrationDeadline: input.registrationDeadline, expectedAudience: input.expectedAudience,
    } });
    if (sourceId) {
      const updated = await tx.eventSource.updateMany({ where: { id: sourceId, status: { not: "PUBLISHED" } }, data: { status: "PUBLISHED", publishedEventId: created.id } });
      if (updated.count !== 1) throw new SourceAlreadyPublishedError("Source already published");
    }
    return created;
  });
  return toEvent(row);
}

export async function getStudent(): Promise<StudentData> {
  const student = await prisma.studentProfile.findUniqueOrThrow({ where: { id: "demo-student" } });
  return { id: student.id, name: student.name, interests: JSON.parse(student.interestsJson),
    categoryPreferences: JSON.parse(student.categoryPreferencesJson), organizerAffinity: JSON.parse(student.organizerAffinityJson) };
}

export async function getSavedEventIds(): Promise<string[]> {
  const rows = await prisma.savedEvent.findMany({ where: { studentId: "demo-student" } });
  return rows.map((row) => row.eventId);
}

export async function getEventPreferences(): Promise<Record<string, Preference>> {
  const rows = await prisma.savedEvent.findMany({ where: { studentId: "demo-student" }, select: { eventId: true, preference: true } });
  return Object.fromEntries(rows.map((row) => [row.eventId, row.preference as Preference]));
}
