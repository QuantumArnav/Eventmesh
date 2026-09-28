import { describe, expect, it } from "vitest";
import { assessEventTrust } from "../lib/event-trust";
import type { EventData } from "../lib/types";

const event: EventData = { id: "one", title: "AI Agents Workshop", organizer: "Lambda Club", description: "A practical campus session for building useful AI agents.", date: "2026-10-01", startTime: "18:00", endTime: "19:30", venue: "LH3", category: "Workshop", tags: ["AI", "Programming"], registrationDeadline: "2026-09-30", expectedAudience: 80, popularity: 50, isDemo: true };

describe("listing trust checks", () => {
  it("reports completeness separately from independent venue and identity verification", () => {
    const result = assessEventTrust(event, [event], 100);
    expect(result.score).toBe(100);
    expect(result.status).toBe("Ready for organizer review");
    expect(result.warnings).toContain("Venue booking and organizer identity have not been independently verified.");
  });
  it("surfaces duplicate, conflict, and capacity concerns", () => {
    const result = assessEventTrust(event, [{ ...event, id: "two" }], 60);
    expect(result.status).toBe("Needs review");
    expect(result.checks.filter((check) => !check.passed).map((check) => check.label)).toEqual(expect.arrayContaining(["No likely duplicate in this calendar", "No high-severity listed conflict", "Venue fits expected audience"]));
  });
});
