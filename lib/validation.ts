import { z } from "zod";
import { CATEGORIES } from "./types";

const date = z.iso.date({ error: "Choose a valid date." });
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM (24-hour) time");

export const eventInputSchema = z.object({
  title: z.string().trim().min(3, "Enter an event title with at least 3 characters.").max(120),
  organizer: z.string().trim().min(2, "Enter the organizer name.").max(100),
  description: z.string().trim().min(10, "Describe the event in at least 10 characters.").max(1500),
  date,
  startTime: time,
  endTime: time,
  venue: z.string().trim().min(2, "Enter a venue or location.").max(100),
  category: z.enum(CATEGORIES),
  tags: z.array(z.string().trim().min(1).max(40)).min(1, "Add at least one audience tag.").max(8),
  registrationDeadline: date.nullable(),
  expectedAudience: z.number().int().min(1).max(10000).nullable(),
}).refine((value) => value.endTime > value.startTime, { path: ["endTime"], message: "End time must be after start time" })
  .refine((value) => !value.registrationDeadline || value.registrationDeadline <= value.date,
    { path: ["registrationDeadline"], message: "Deadline must not be after the event" });

export const extractedEventSchema = z.object({
  title: z.string().nullable(),
  organizer: z.string().nullable(),
  description: z.string().nullable(),
  date: z.string().nullable(),
  startTime: z.string().nullable(),
  endTime: z.string().nullable(),
  venue: z.string().nullable(),
  registrationDeadline: z.string().nullable(),
  category: z.string().nullable(),
  tags: z.array(z.string()),
});
