import { addDays, minutes, timeFromMinutes } from "./dates";
import { analyzeConflicts, type Conflict } from "./conflict-engine";
import type { EventData, EventInput } from "./types";

export type SchedulingOptions = {
  preferredDate: string;
  windowStart: string;
  windowEnd: string;
  durationMinutes: number;
  venues: string[];
  daysToSearch?: number;
  limit?: number;
};

export type RankedSlot = {
  date: string; startTime: string; endTime: string; venue: string;
  score: number; worstConflict: number; competingEvents: number;
  venueAvailable: boolean; audienceOverlap: "Low" | "Medium" | "High";
  reasons: string[]; conflicts: Conflict[];
};

export function findBestSlots(base: EventInput, events: EventData[], options: SchedulingOptions): RankedSlot[] {
  const from = minutes(options.windowStart), to = minutes(options.windowEnd);
  if (options.durationMinutes < 30 || options.durationMinutes > 240 || from >= to || !options.venues.length) return [];
  const all: RankedSlot[] = [];
  for (let day = 0; day < Math.min(options.daysToSearch ?? 3, 7); day++) {
    const date = addDays(options.preferredDate, day);
    for (let start = from; start + options.durationMinutes <= to; start += 30) {
      for (const venue of options.venues) {
        const candidate = { ...base, date, venue, startTime: timeFromMinutes(start), endTime: timeFromMinutes(start + options.durationMinutes) };
        const conflicts = analyzeConflicts(candidate, events);
        const worstConflict = conflicts[0]?.score ?? 0;
        const average = conflicts.length ? conflicts.reduce((sum, item) => sum + item.score, 0) / conflicts.length : 0;
        const venueAvailable = !conflicts.some((item) => item.kind === "VENUE");
        const audience = conflicts.filter((item) => item.kind === "AUDIENCE");
        const score = Math.min(100, Math.round(0.7 * worstConflict + 0.3 * average + (venueAvailable ? 0 : 15)));
        const audienceOverlap = audience.some((item) => item.score >= 60) ? "High" : audience.some((item) => item.score >= 30) ? "Medium" : "Low";
        const reasons = venueAvailable ? [`${venue} has no listed venue collision`] : [`${venue} has a listed venue collision`];
        reasons.push(audience.length ? `${audience.length} overlapping event${audience.length === 1 ? "" : "s"} competing for an audience` : "No overlapping audience in the demo calendar");
        if (day > 0) reasons.push(`${day} day${day === 1 ? "" : "s"} after preferred date`);
        all.push({ date, startTime: candidate.startTime, endTime: candidate.endTime, venue, score, worstConflict, competingEvents: conflicts.length, venueAvailable, audienceOverlap, reasons, conflicts });
      }
    }
  }
  return all.sort((a, b) => Number(b.venueAvailable) - Number(a.venueAvailable) || a.score - b.score || a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)).slice(0, options.limit ?? 6);
}
