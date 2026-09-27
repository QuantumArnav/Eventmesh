import { z } from "zod";
import { addDays, minutes } from "./dates";
import { recommend } from "./recommendation-engine";
import type { EventData, StudentData } from "./types";

export const smartQuerySchema = z.object({
  categories: z.array(z.string()).max(6),
  tags: z.array(z.string()).max(12),
  dateFrom: z.iso.date().nullable(),
  dateTo: z.iso.date().nullable(),
  afterTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable(),
  beforeTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable(),
  maxDuration: z.number().int().min(15).max(1440).nullable(),
  avoidScheduleConflicts: z.boolean(),
  freeText: z.string().max(200),
});
export type SmartQuery = z.infer<typeof smartQuerySchema>;
export type SmartResult = { event: EventData; score: number; reasons: string[] };

function parseClock(hour: string, minute: string | undefined, meridian: string): string {
  let h = Number(hour) % 12;
  if (meridian.toLowerCase() === "pm") h += 12;
  return `${String(h).padStart(2, "0")}:${minute ?? "00"}`;
}

export function parseSmartQuery(text: string, today: string): SmartQuery {
  const lower = text.toLowerCase();
  const tomorrow = /\btomorrow\b/.test(lower);
  const thisWeekend = /\b(this )?weekend\b/.test(lower);
  const todayOnly = /\btoday\b|\btonight\b/.test(lower);
  let dateFrom: string | null = null, dateTo: string | null = null;
  if (tomorrow) dateFrom = dateTo = addDays(today, 1);
  else if (todayOnly) dateFrom = dateTo = today;
  else if (thisWeekend) {
    const weekday = new Date(`${today}T00:00:00Z`).getUTCDay();
    dateFrom = addDays(today, (6 - weekday + 7) % 7);
    dateTo = addDays(dateFrom, 1);
  }
  const categories = ["sports", "technical", "workshop", "cultural", "talk", "community"].filter((value) => lower.includes(value)).map((value) => value[0].toUpperCase() + value.slice(1));
  const tags = ["AI", "Programming", "Robotics", "Music", "Football", "Design", "Startups", "Astronomy", "Cybersecurity", "Machine Learning"].filter((value) => lower.includes(value.toLowerCase()));
  const after = lower.match(/\b(?:after|from)\s+(\d{1,2})(?::([0-5]\d))?\s*(am|pm)\b/);
  const before = lower.match(/\b(?:before|to|until)\s+(\d{1,2})(?::([0-5]\d))?\s*(am|pm)\b/);
  const hours = lower.match(/\b(\d+)\s+hours?\s+free\b|\b(\d+)\s+hours?\b/);
  const maxDuration = hours ? Number(hours[1] ?? hours[2]) * 60 : null;
  let afterTime = after ? parseClock(after[1], after[2], after[3]) : null;
  let beforeTime = before ? parseClock(before[1], before[2], before[3]) : null;
  if (/\btonight\b/.test(lower) && !afterTime) afterTime = "18:00";
  if (/\btonight\b/.test(lower) && !beforeTime) beforeTime = "22:00";
  if (/\bbefore dinner\b/.test(lower) && !beforeTime) beforeTime = "19:00";
  if (!dateFrom && /\b(?:i am|i'm) free (?:from|between)\b/.test(lower)) dateFrom = dateTo = today;
  if (maxDuration !== null && (maxDuration < 15 || maxDuration > 1440)) return parseSmartQuery(text.replace(/\d+\s+hours?\s*(free)?/i, ""), today);
  const constrained = categories.length || tags.length || dateFrom || afterTime || beforeTime || maxDuration;
  return smartQuerySchema.parse({ categories, tags, dateFrom, dateTo, afterTime, beforeTime, maxDuration,
    avoidScheduleConflicts: /don'?t clash|no conflicts?|avoid conflicts?|free (?:from|between)/.test(lower),
    freeText: constrained ? "" : text.trim().slice(0, 200) });
}

export function smartSearch(query: SmartQuery, events: EventData[], student: StudentData | null, savedIds: string[]): SmartResult[] {
  const saved = events.filter((event) => savedIds.includes(event.id));
  return events.filter((event) => {
    if (query.categories.length && !query.categories.some((category) => category.toLowerCase() === event.category.toLowerCase())) return false;
    if (query.tags.length && !query.tags.some((tag) => event.tags.some((eventTag) => eventTag.toLowerCase().includes(tag.toLowerCase())) || event.title.toLowerCase().includes(tag.toLowerCase()))) return false;
    if (query.dateFrom && event.date < query.dateFrom) return false;
    if (query.dateTo && event.date > query.dateTo) return false;
    if (query.afterTime && event.startTime < query.afterTime) return false;
    if (query.beforeTime && event.endTime > query.beforeTime) return false;
    if (query.maxDuration && minutes(event.endTime) - minutes(event.startTime) > query.maxDuration) return false;
    if (query.freeText && ![event.title, event.organizer, event.category, event.venue, ...event.tags].some((value) => value.toLowerCase().includes(query.freeText.toLowerCase()))) return false;
    if (query.avoidScheduleConflicts && saved.some((item) => item.id !== event.id && item.date === event.date && minutes(item.startTime) < minutes(event.endTime) && minutes(item.endTime) > minutes(event.startTime))) return false;
    return true;
  }).map((event) => {
    const relevance = student ? recommend(event, student) : { score: 50, reasons: ["Matches your search"] };
    const duration = minutes(event.endTime) - minutes(event.startTime);
    const fitBonus = query.maxDuration ? Math.round(10 * duration / query.maxDuration) : 0;
    return { event, score: Math.min(100, relevance.score + fitBonus), reasons: [...relevance.reasons, query.avoidScheduleConflicts ? "No clash with your saved events" : "Fits your search constraints"] };
  }).sort((a, b) => b.score - a.score || a.event.date.localeCompare(b.event.date) || a.event.startTime.localeCompare(b.event.startTime));
}
