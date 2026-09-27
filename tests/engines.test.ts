import { describe, expect, it } from "vitest";
import { analyzeConflict, analyzeConflicts, overlapMinutes, suggestSlots } from "../lib/conflict-engine";
import { recommend } from "../lib/recommendation-engine";
import type { EventData, EventInput, StudentData } from "../lib/types";

const candidate: EventInput = {
  title: "Applied AI Lab", organizer: "Lambda Club", description: "A practical AI workshop for students.",
  date: "2026-09-29", startTime: "18:00", endTime: "19:30", venue: "LH3", category: "Workshop",
  tags: ["AI", "Programming", "Machine Learning"], registrationDeadline: null, expectedAudience: 110,
};
function event(overrides: Partial<EventData> = {}): EventData {
  return { id: "one", ...candidate, popularity: 80, isDemo: true, ...overrides };
}

describe("conflict intelligence", () => {
  it("ignores events on different days or with touching boundaries", () => {
    expect(analyzeConflict(candidate, event({ date: "2026-09-30" }))).toBeNull();
    expect(analyzeConflict(candidate, event({ startTime: "19:30", endTime: "21:00" }))).toBeNull();
  });
  it("calculates partial and complete time overlap", () => {
    expect(overlapMinutes(candidate, event({ startTime: "19:00", endTime: "20:00" }))).toBe(30);
    expect(overlapMinutes(candidate, event())).toBe(90);
  });
  it("distinguishes severe venue collisions from audience overlap", () => {
    const venue = analyzeConflict(candidate, event());
    const audience = analyzeConflict(candidate, event({ venue: "LH2", category: "Technical", tags: ["Programming", "Algorithms"], expectedAudience: 100 }));
    expect(venue?.kind).toBe("VENUE");
    expect(venue?.score).toBeGreaterThanOrEqual(80);
    expect(venue?.reasons).toContain("LH3 is already occupied");
    expect(audience?.kind).toBe("AUDIENCE");
    expect(audience?.score).toBeLessThan(venue!.score);
    expect(audience?.reasons.some((reason) => reason.includes("shared audience"))).toBe(true);
  });
  it("scores similar audiences above unrelated audiences", () => {
    const similar = analyzeConflict(candidate, event({ venue: "LH2" }));
    const unrelated = analyzeConflict(candidate, event({ venue: "LH2", category: "Sports", tags: ["Football"], expectedAudience: 20 }));
    expect(similar!.score).toBeGreaterThan(unrelated!.score);
    expect(analyzeConflicts(candidate, [event({ id: "a", venue: "LH2" }), event({ id: "b", venue: "LH3" })])[0].eventId).toBe("b");
  });
  it("suggests a lower-conflict slot using the same engine", () => {
    const existing = [event()];
    const current = analyzeConflicts(candidate, existing)[0].score;
    const slots = suggestSlots(candidate, existing);
    expect(slots).toHaveLength(3);
    expect(slots[0].score).toBeLessThan(current);
    expect(slots[0].venueCollision).toBe(false);
  });
});

describe("personalized discovery", () => {
  const student: StudentData = { id: "demo", name: "Arnav", interests: ["AI", "Programming", "Football"], categoryPreferences: ["Workshop", "Technical"], organizerAffinity: ["Lambda Club"] };
  it("recommends matching events more strongly and explains why", () => {
    const strong = recommend(event(), student);
    const unrelated = recommend(event({ category: "Cultural", tags: ["Music"], organizer: "Music Club", popularity: 10 }), student);
    expect(strong.score).toBeGreaterThan(unrelated.score);
    expect(strong.reasons.join(" ")).toContain("AI");
  });
  it("always keeps relevance within 0–100", () => {
    expect(recommend(event({ popularity: 10000 }), student).score).toBeLessThanOrEqual(100);
    expect(recommend(event({ popularity: 0, tags: [] }), student).score).toBeGreaterThanOrEqual(0);
  });
});
