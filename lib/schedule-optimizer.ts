import { minutes } from "./dates";
import { recommend } from "./recommendation-engine";
import type { EventData, StudentData } from "./types";

export type Preference = "INTERESTED" | "SAVED" | "MUST_ATTEND";
export type PlanInput = { event: EventData; preference: Preference };
export type PlannedEvent = { event: EventData; preference: Preference; utility: number; reason: string };
export type OptimizedPlan = { selected: PlannedEvent[]; skipped: (PlannedEvent & { conflictsWith: string[] })[]; totalUtility: number };

function absoluteMinute(date: string, time: string): number { return Date.parse(`${date}T00:00:00Z`) / 60000 + minutes(time); }

export function optimizeSchedule(inputs: PlanInput[], student: StudentData): OptimizedPlan {
  if (!inputs.length) return { selected: [], skipped: [], totalUtility: 0 };
  const ordered = inputs.map(({ event, preference }) => {
    const relevance = recommend(event, student);
    const boost = preference === "MUST_ATTEND" ? 80 : preference === "SAVED" ? 20 : 0;
    return { event, preference, utility: relevance.score + boost + 1, reason: `${preference === "MUST_ATTEND" ? "Must Attend priority; " : preference === "SAVED" ? "Saved priority; " : ""}${relevance.score}/100 relevance${relevance.reasons[0] ? ` · ${relevance.reasons[0]}` : ""}` };
  }).sort((a, b) => absoluteMinute(a.event.date, a.event.endTime) - absoluteMinute(b.event.date, b.event.endTime));
  const previous = ordered.map((item, i) => {
    const start = absoluteMinute(item.event.date, item.event.startTime);
    let low = 0, high = i - 1, answer = -1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (absoluteMinute(ordered[mid].event.date, ordered[mid].event.endTime) <= start) { answer = mid; low = mid + 1; }
      else high = mid - 1;
    }
    return answer;
  });
  const best = Array<number>(ordered.length + 1).fill(0);
  for (let i = 1; i <= ordered.length; i++) best[i] = Math.max(best[i - 1], ordered[i - 1].utility + best[previous[i - 1] + 1]);
  const chosen = new Set<string>();
  for (let i = ordered.length; i > 0;) {
    const include = ordered[i - 1].utility + best[previous[i - 1] + 1];
    if (include > best[i - 1]) { chosen.add(ordered[i - 1].event.id); i = previous[i - 1] + 1; }
    else i--;
  }
  const selected = ordered.filter((item) => chosen.has(item.event.id)).sort((a, b) => a.event.date.localeCompare(b.event.date) || a.event.startTime.localeCompare(b.event.startTime));
  const skipped = ordered.filter((item) => !chosen.has(item.event.id)).map((item) => ({ ...item, conflictsWith: selected.filter((pick) => pick.event.date === item.event.date && minutes(pick.event.startTime) < minutes(item.event.endTime) && minutes(pick.event.endTime) > minutes(item.event.startTime)).map((pick) => pick.event.title) }));
  return { selected, skipped, totalUtility: best[ordered.length] };
}
