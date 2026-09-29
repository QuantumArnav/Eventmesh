import { minutes } from "./dates";
import type { EventData, StudentData } from "./types";

export type Recommendation = { score: number; reasons: string[] };

export function recommend(event: EventData, student: StudentData): Recommendation {
  const interests = student.interests.flatMap((value) => value === "AI / ML" ? ["ai", "machine learning"] : [value.toLowerCase()]);
  const shared = event.tags.filter((tag) => interests.includes(tag.toLowerCase()));
  const inferredCategories = student.interests.flatMap((value) => value === "Sports" ? ["Sports"] : value === "Music" || value === "Dance" || value === "Photography" || value === "Literature" ? ["Cultural"] : value === "Programming" || value === "AI / ML" ? ["Technical", "Workshop"] : []);
  const preferredCategory = [...student.categoryPreferences, ...inferredCategories].some((value) => value.toLowerCase() === event.category.toLowerCase());
  const organizerAffinity = student.organizerAffinity.some((value) => value.toLowerCase() === event.organizer.toLowerCase());
  const start = minutes(event.startTime);
  const suitableTime = start >= 16 * 60 && start <= 21 * 60;
  const score = Math.max(0, Math.min(100, Math.round(
    45 * Math.min(1, shared.length / 2) + (preferredCategory ? 20 : 0) +
    (suitableTime ? 15 : 5) + 10 * Math.min(1, event.popularity / 100) +
    (organizerAffinity ? 10 : 0),
  )));
  const reasons: string[] = [];
  if (shared.length) reasons.push(`Matches ${shared.slice(0, 3).join(", ")}`);
  if (preferredCategory) reasons.push(`You like ${event.category.toLowerCase()} events`);
  if (organizerAffinity) reasons.push(`You follow ${event.organizer}`);
  if (!reasons.length) reasons.push("Explore something new on campus");
  return { score, reasons };
}
