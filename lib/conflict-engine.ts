import { addDays, minutes, timeFromMinutes } from "./dates";
import type { EventData, EventInput } from "./types";

type Candidate = EventInput | EventData;
export type Conflict = {
  eventId: string;
  eventTitle: string;
  eventVenue: string;
  eventTime: string;
  score: number;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  kind: "VENUE" | "AUDIENCE";
  overlapMinutes: number;
  reasons: string[];
};

export function overlapMinutes(a: Candidate, b: Candidate): number {
  if (a.date !== b.date) return 0;
  return Math.max(0, Math.min(minutes(a.endTime), minutes(b.endTime)) - Math.max(minutes(a.startTime), minutes(b.startTime)));
}

function similarity(a: string[], b: string[]): number {
  const left = new Set(a.map((tag) => tag.toLowerCase().trim()));
  const right = new Set(b.map((tag) => tag.toLowerCase().trim()));
  const intersection = [...left].filter((tag) => right.has(tag)).length;
  const union = new Set([...left, ...right]).size;
  return union ? intersection / union : 0;
}

export function analyzeConflict(candidate: Candidate, existing: EventData): Conflict | null {
  if ("id" in candidate && candidate.id === existing.id) return null;
  const overlap = overlapMinutes(candidate, existing);
  if (overlap === 0) return null;
  const duration = Math.max(1, Math.min(minutes(candidate.endTime) - minutes(candidate.startTime), minutes(existing.endTime) - minutes(existing.startTime)));
  const overlapRatio = Math.min(1, overlap / duration);
  const sameVenue = candidate.venue.trim().toLowerCase() === existing.venue.trim().toLowerCase();
  const tagSimilarity = similarity(candidate.tags, existing.tags);
  const sameCategory = candidate.category === existing.category;
  const audienceFactor = Math.min(1, Math.min(candidate.expectedAudience ?? 40, existing.expectedAudience ?? 40) / 100);
  const score = Math.min(100, Math.round(sameVenue
    ? 55 + 25 * overlapRatio + 12 * tagSimilarity + (sameCategory ? 8 : 0)
    : 25 * overlapRatio + 35 * tagSimilarity + (sameCategory ? 20 : 0) + 10 * audienceFactor));
  const sharedTags = candidate.tags.filter((tag) => existing.tags.some((other) => other.toLowerCase() === tag.toLowerCase()));
  const reasons = [`${overlap} minute time overlap`];
  if (sameVenue) reasons.push(`${candidate.venue} is already occupied`);
  if (sharedTags.length) reasons.push(`${sharedTags.length} shared audience ${sharedTags.length === 1 ? "tag" : "tags"}: ${sharedTags.join(", ")}`);
  if (sameCategory) reasons.push(`Both are ${candidate.category.toLowerCase()} events`);
  return {
    eventId: existing.id, eventTitle: existing.title, eventVenue: existing.venue,
    eventTime: `${existing.startTime}–${existing.endTime}`,
    score, severity: score >= 80 ? "CRITICAL" : score >= 60 ? "HIGH" : score >= 30 ? "MEDIUM" : "LOW",
    kind: sameVenue ? "VENUE" : "AUDIENCE", overlapMinutes: overlap, reasons,
  };
}

export function analyzeConflicts(candidate: Candidate, events: EventData[]): Conflict[] {
  return events.map((event) => analyzeConflict(candidate, event)).filter((result): result is Conflict => result !== null).sort((a, b) => b.score - a.score);
}

export type SlotSuggestion = {
  date: string;
  startTime: string;
  endTime: string;
  score: number;
  venueCollision: boolean;
};

export function suggestSlots(candidate: Candidate, events: EventData[], count = 3): SlotSuggestion[] {
  const duration = minutes(candidate.endTime) - minutes(candidate.startTime);
  if (duration <= 0 || duration > 240) return [];
  const slots: (SlotSuggestion & { distance: number })[] = [];
  for (let day = 0; day < 3; day++) {
    const date = addDays(candidate.date, day);
    for (let start = 15 * 60; start + duration <= 22 * 60; start += 30) {
      if (day === 0 && start === minutes(candidate.startTime)) continue;
      const proposed = { ...candidate, date, startTime: timeFromMinutes(start), endTime: timeFromMinutes(start + duration) };
      const conflicts = analyzeConflicts(proposed, events);
      slots.push({ date, startTime: proposed.startTime, endTime: proposed.endTime,
        score: conflicts[0]?.score ?? 0, venueCollision: conflicts.some((conflict) => conflict.kind === "VENUE"),
        distance: day * 1440 + Math.abs(start - minutes(candidate.startTime)) });
    }
  }
  return slots.sort((a, b) => Number(a.venueCollision) - Number(b.venueCollision) || a.score - b.score || a.distance - b.distance).slice(0, count)
    .map((slot) => ({ date: slot.date, startTime: slot.startTime, endTime: slot.endTime, score: slot.score, venueCollision: slot.venueCollision }));
}
