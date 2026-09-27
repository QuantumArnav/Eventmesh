import type { EventInput } from "./types";

export type ReadinessItem = { label: string; points: number; earned: number; advice?: string };
export type EventReadiness = { score: number; items: ReadinessItem[] };

export function assessReadiness(input: Partial<EventInput>): EventReadiness {
  const items: ReadinessItem[] = [
    { label: "Clear title", points: 10, earned: input.title?.trim().length && input.title.trim().length >= 8 ? 10 : 0, advice: "Use a descriptive event title." },
    { label: "Date", points: 15, earned: input.date ? 15 : 0, advice: "Add the event date." },
    { label: "Start and end time", points: 15, earned: input.startTime && input.endTime && input.endTime > input.startTime ? 15 : 0, advice: "Set a valid time range." },
    { label: "Venue", points: 15, earned: input.venue?.trim() ? 15 : 0, advice: "Confirm a venue." },
    { label: "Useful description", points: 10, earned: input.description?.trim().length && input.description.trim().length >= 40 ? 10 : 0, advice: "Explain what participants will do." },
    { label: "Category", points: 10, earned: input.category ? 10 : 0, advice: "Choose a category." },
    { label: "Audience tags", points: 10, earned: input.tags?.length ? 10 : 0, advice: "Add searchable interests." },
    { label: "Registration deadline", points: 5, earned: input.registrationDeadline ? 5 : 0, advice: "Add a deadline if registration is required." },
    { label: "Organizer", points: 5, earned: input.organizer?.trim() ? 5 : 0, advice: "Name the organizer." },
    { label: "Expected audience", points: 5, earned: input.expectedAudience && input.expectedAudience > 0 ? 5 : 0, advice: "Estimate turnout to improve scheduling signals." },
  ];
  return { score: items.reduce((sum, item) => sum + item.earned, 0), items };
}
