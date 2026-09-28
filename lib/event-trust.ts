import { analyzeConflicts } from "./conflict-engine";
import { detectDuplicates } from "./duplicate-detector";
import { assessReadiness } from "./event-readiness";
import type { EventData } from "./types";

export type TrustCheck = { label: string; passed: boolean; detail: string };
export type EventTrust = { score: number; status: "Ready for organizer review" | "Needs review" | "Incomplete"; checks: TrustCheck[]; warnings: string[] };

export function assessEventTrust(event: EventData, otherEvents: EventData[], venueCapacity?: number): EventTrust {
  const score = assessReadiness(event).score;
  const duplicates = detectDuplicates(event, otherEvents.filter((other) => other.id !== event.id));
  const conflicts = analyzeConflicts(event, otherEvents.filter((other) => other.id !== event.id)).filter((item) => item.score >= 60);
  const checks: TrustCheck[] = [
    { label: "Organizer named", passed: !!event.organizer.trim(), detail: event.organizer.trim() || "Organizer missing" },
    { label: "Registration deadline listed", passed: !!event.registrationDeadline, detail: event.registrationDeadline ?? "No deadline provided; registration may not be required" },
    { label: "No likely duplicate in this calendar", passed: duplicates.length === 0, detail: duplicates.length ? `${duplicates.length} possible duplicate listing(s)` : "No likely duplicate found" },
    { label: "No high-severity listed conflict", passed: conflicts.length === 0, detail: conflicts.length ? `${conflicts.length} high-severity overlap(s)` : "No high-severity overlap found" },
    { label: "Venue fits expected audience", passed: venueCapacity === undefined || !event.expectedAudience || venueCapacity >= event.expectedAudience, detail: venueCapacity === undefined ? "Capacity unavailable; confirm with venue owner" : `Illustrative capacity ${venueCapacity}, expected audience ${event.expectedAudience ?? "unknown"}` },
  ];
  const warnings = [
    ...checks.filter((check) => !check.passed).map((check) => `${check.label}: ${check.detail}`),
    "Venue booking and organizer identity have not been independently verified.",
  ];
  return { score, status: score < 70 ? "Incomplete" : checks.some((check) => !check.passed) ? "Needs review" : "Ready for organizer review", checks, warnings };
}
