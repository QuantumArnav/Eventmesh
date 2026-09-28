import { minutes } from "./dates";
import type { EventData } from "./types";

export type PressureCell = {
  date: string; hour: number; score: number; events: EventData[];
  totalAudience: number; topTags: string[]; categoryCounts: { category: string; count: number }[];
  venueCollisions: number; audienceOverlapPairs: number; tier: "LOW" | "MODERATE" | "BUSY" | "SATURATED";
  reasons: string[]; recommendation: string;
};

function tagSimilarity(a: EventData, b: EventData): number {
  const left = new Set(a.tags.map((tag) => tag.toLowerCase()));
  const right = new Set(b.tags.map((tag) => tag.toLowerCase()));
  const union = new Set([...left, ...right]).size;
  return union ? [...left].filter((tag) => right.has(tag)).length / union : 0;
}

export function measureEventPressure(date: string, hour: number, allEvents: EventData[]): PressureCell {
  const events = allEvents.filter((event) => event.date === date && minutes(event.startTime) < (hour + 1) * 60 && minutes(event.endTime) > hour * 60);
  const totalAudience = events.reduce((sum, event) => sum + (event.expectedAudience ?? 40), 0);
  const categories = new Map<string, number>();
  const tags = new Map<string, number>();
  for (const event of events) {
    categories.set(event.category, (categories.get(event.category) ?? 0) + 1);
    for (const tag of event.tags) tags.set(tag, (tags.get(tag) ?? 0) + 1);
  }
  const categoryCounts = [...categories].map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count);
  const topTags = [...tags].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([tag]) => tag);
  const pairs: number[] = [];
  for (let i = 0; i < events.length; i++) for (let j = i + 1; j < events.length; j++) pairs.push(tagSimilarity(events[i], events[j]));
  const audienceOverlapPairs = pairs.filter((value) => value >= 0.25).length;
  let venueCollisions = 0;
  for (let i = 0; i < events.length; i++) for (let j = i + 1; j < events.length; j++) {
    if (events[i].venue.toLowerCase() === events[j].venue.toLowerCase()) venueCollisions++;
  }
  const similarity = pairs.length ? pairs.reduce((sum, item) => sum + item, 0) / pairs.length : 0;
  const concentration = events.length > 1 ? Math.max(...categoryCounts.map((item) => item.count), 0) / events.length : 0;
  const knownVenues = new Set(allEvents.map((event) => event.venue.toLowerCase())).size;
  const occupiedVenues = new Set(events.map((event) => event.venue.toLowerCase())).size;
  const scarcity = knownVenues ? occupiedVenues / knownVenues : 0;
  const score = events.length ? Math.min(100, Math.round(
    Math.min(35, events.length * 12) + 20 * similarity + 15 * concentration +
    15 * Math.min(1, totalAudience / 300) + 15 * scarcity,
  )) : 0;
  const tier = score >= 75 ? "SATURATED" : score >= 55 ? "BUSY" : score >= 30 ? "MODERATE" : "LOW";
  const reasons = events.length ? [
    `${events.length} event${events.length === 1 ? "" : "s"} active during this hour`,
    `About ${totalAudience} expected attendees across listed events`,
    categoryCounts[0] ? `${categoryCounts[0].category} is the largest category (${categoryCounts[0].count})` : "",
    `${occupiedVenues} of ${knownVenues} listed venue${knownVenues === 1 ? "" : "s"} in use`,
  ].filter(Boolean) : ["No listed events during this hour"];
  const recommendation = score >= 70 ? `Busy hour${categoryCounts[0] ? ` for ${categoryCounts[0].category.toLowerCase()} events` : ""}; consider another slot.` : score >= 40 ? "Moderate campus activity; compare audience and venue before scheduling." : "Relatively open slot in the demo calendar.";
  return { date, hour, score, events, totalAudience, topTags, categoryCounts, venueCollisions, audienceOverlapPairs, tier, reasons, recommendation };
}
