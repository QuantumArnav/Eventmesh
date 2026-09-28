import { analyzeConflict, analyzeConflicts } from "./conflict-engine";
import { addDays } from "./dates";
import { assessReadiness } from "./event-readiness";
import { measureEventPressure } from "./event-pressure";
import type { EventData } from "./types";

export function getOrganizerIntelligence(events: EventData[], today: string) {
  const upcoming = events.filter((event) => event.date >= today);
  const eventsThisWeek = upcoming.filter((event) => event.date <= addDays(today, 6));
  const conflictScores = new Map(upcoming.map((event) => [event.id, analyzeConflicts(event, upcoming)[0]?.score ?? 0]));
  const activeConflicts = upcoming.filter((event) => (conflictScores.get(event.id) ?? 0) >= 60);
  const organizerCount = new Set(upcoming.map((event) => event.organizer)).size;
  const categories = [...new Set(upcoming.map((event) => event.category))];
  const categoryCounts = categories.map((category) => ({ category, count: upcoming.filter((event) => event.category === category).length })).sort((a, b) => b.count - a.count);
  const venueCounts = [...new Set(upcoming.map((event) => event.venue))].map((venue) => ({ venue, count: upcoming.filter((event) => event.venue === venue).length })).sort((a, b) => b.count - a.count).slice(0, 6);
  const readiness = upcoming.length ? Math.round(upcoming.reduce((sum, event) => sum + assessReadiness(event).score, 0) / upcoming.length) : 0;
  const nextDates = Array.from({ length: 7 }, (_, index) => addDays(today, index));
  const pressure = nextDates.map((date) => ({ date, cells: [16, 17, 18, 19, 20, 21].map((hour) => measureEventPressure(date, hour, upcoming)) }));
  const quietHours = pressure.flatMap((day) => day.cells).filter((cell) => cell.score <= 25).length;
  const peakHours = [16, 17, 18, 19, 20, 21].map((hour) => {
    const cells = pressure.map((day) => day.cells.find((cell) => cell.hour === hour)!);
    return { hour, count: cells.reduce((sum, cell) => sum + cell.events.length, 0), audience: cells.reduce((sum, cell) => sum + cell.totalAudience, 0) };
  }).sort((a, b) => b.count - a.count || b.audience - a.audience || a.hour - b.hour).slice(0, 3);
  const audiencePairs = upcoming.flatMap((left, i) => upcoming.slice(i + 1).flatMap((right) => {
    const conflict = analyzeConflict(left, right);
    return conflict?.kind === "AUDIENCE" && conflict.score >= 25 ? [{ left, right, conflict }] : [];
  })).sort((a, b) => b.conflict.score - a.conflict.score).slice(0, 3);

  return { upcoming, eventsThisWeek, conflictScores, activeConflicts, organizerCount, categoryCounts, venueCounts, readiness, pressure, quietHours, peakHours, audiencePairs };
}
