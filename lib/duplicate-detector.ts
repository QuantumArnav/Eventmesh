import type { EventData, EventInput } from "./types";

export type DuplicateMatch = { event: EventData; score: number; reasons: string[] };

function tokens(value: string): Set<string> {
  return new Set(value.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((word) => word.length > 1 && !["the", "and", "2026", "iith"].includes(word)));
}

function jaccard(left: Set<string>, right: Set<string>): number {
  const union = new Set([...left, ...right]).size;
  return union ? [...left].filter((word) => right.has(word)).length / union : 0;
}

function normalized(value: string): string { return value.toLowerCase().replace(/[^a-z0-9]/g, ""); }

function editSimilarity(left: string, right: string): number {
  const a = normalized(left), b = normalized(right);
  if (!a || !b) return 0;
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0]; row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const before = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = before;
    }
  }
  return Math.max(0, 1 - row[b.length] / Math.max(a.length, b.length));
}

function dayDistance(a: string, b: string): number {
  return Math.abs(Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86_400_000;
}

function timeDistance(a: string, b: string): number {
  const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
  return Math.abs(minutes(a) - minutes(b));
}

export function detectDuplicates(candidate: EventInput, events: EventData[], threshold = 70): DuplicateMatch[] {
  return events.flatMap((event) => {
    const days = dayDistance(candidate.date, event.date);
    const title = Math.max(jaccard(tokens(candidate.title), tokens(event.title)), editSimilarity(candidate.title, event.title));
    const organizer = editSimilarity(candidate.organizer, event.organizer);
    const venue = editSimilarity(candidate.venue, event.venue);
    const tags = jaccard(new Set(candidate.tags.map((tag) => tag.toLowerCase())), new Set(event.tags.map((tag) => tag.toLowerCase())));
    const time = Math.max(0, 1 - timeDistance(candidate.startTime, event.startTime) / 180);
    const raw = 32 * title + 18 * organizer + 22 * (days === 0 ? 1 : days === 1 ? 0.3 : 0) + 10 * time + 10 * venue + 8 * tags;
    const score = Math.round(raw * (days > 2 ? 0.35 : days === 1 ? 0.75 : 1));
    if (score < threshold || title < 0.45) return [];
    const reasons = [title >= 0.7 ? "Similar event title" : "Related event title"];
    if (organizer >= 0.85) reasons.push("Same organizer");
    if (days === 0) reasons.push("Same date");
    if (time >= 0.75) reasons.push("Similar start time");
    if (venue >= 0.9) reasons.push("Same venue");
    if (tags > 0) reasons.push("Shared audience tags");
    return [{ event, score, reasons }];
  }).sort((a, b) => b.score - a.score);
}
