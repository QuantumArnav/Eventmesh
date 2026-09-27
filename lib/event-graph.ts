import type { EventData } from "./types";

export type AudienceLink = { left: string; right: string; similarity: number; sharedTags: string[] };
export type EventMeshData = { events: EventData[]; organizers: string[]; categories: string[]; tags: string[]; audienceLinks: AudienceLink[] };

export function audienceSimilarity(left: EventData, right: EventData): { similarity: number; sharedTags: string[] } {
  const other = new Set(right.tags.map((tag) => tag.toLowerCase()));
  const sharedTags = left.tags.filter((tag) => other.has(tag.toLowerCase()));
  const union = new Set([...left.tags, ...right.tags].map((tag) => tag.toLowerCase())).size;
  return { similarity: union ? Math.round(100 * sharedTags.length / union) : 0, sharedTags };
}

export function buildEventMesh(allEvents: EventData[], maxEvents = 9): EventMeshData {
  const events = [...allEvents].sort((a, b) => a.date.localeCompare(b.date) || b.popularity - a.popularity).slice(0, maxEvents);
  const organizers = [...new Set(events.map((event) => event.organizer))].slice(0, 8);
  const categories = [...new Set(events.map((event) => event.category))];
  const tagCounts = new Map<string, { count: number; peakPopularity: number }>();
  for (const event of events) for (const tag of event.tags) {
    const current = tagCounts.get(tag) ?? { count: 0, peakPopularity: 0 };
    tagCounts.set(tag, { count: current.count + 1, peakPopularity: Math.max(current.peakPopularity, event.popularity) });
  }
  const tags = [...tagCounts].sort((a, b) => b[1].count - a[1].count || b[1].peakPopularity - a[1].peakPopularity).slice(0, 6).map(([tag]) => tag);
  const audienceLinks: AudienceLink[] = [];
  for (let i = 0; i < events.length; i++) for (let j = i + 1; j < events.length; j++) {
    const overlap = audienceSimilarity(events[i], events[j]);
    if (overlap.similarity >= 15) audienceLinks.push({ left: events[i].id, right: events[j].id, ...overlap });
  }
  return { events, organizers, categories, tags, audienceLinks: audienceLinks.sort((a, b) => b.similarity - a.similarity) };
}
