import { describe, expect, it } from "vitest";
import { detectDuplicates } from "../lib/duplicate-detector";
import { assessReadiness } from "../lib/event-readiness";
import { measureEventPressure } from "../lib/event-pressure";
import { findBestSlots } from "../lib/scheduling-engine";
import { optimizeSchedule } from "../lib/schedule-optimizer";
import { extractTextLocally } from "../lib/ai/event-extractor";
import { addDays, todayInIsth } from "../lib/dates";
import type { EventData, EventInput, StudentData } from "../lib/types";

const base: EventInput = { title: "Lambda AI Workshop", organizer: "Lambda Club", description: "A practical session about building useful AI systems on campus.", date: "2026-09-29", startTime: "18:00", endTime: "19:30", venue: "LH3", category: "Workshop", tags: ["AI", "Programming"], registrationDeadline: "2026-09-28", expectedAudience: 100 };
function event(id: string, changes: Partial<EventData> = {}): EventData { return { id, ...base, popularity: 80, isDemo: true, ...changes }; }
const student: StudentData = { id: "s", name: "Arnav", interests: ["AI", "Programming"], categoryPreferences: ["Workshop", "Technical"], organizerAffinity: ["Lambda Club"] };

describe("duplicate detection", () => {
  it("flags exact and slightly varied versions", () => {
    expect(detectDuplicates(base, [event("a")])[0].score).toBe(100);
    expect(detectDuplicates(base, [event("b", { title: "Lambda AI Workshop 2026" })])[0].score).toBeGreaterThanOrEqual(70);
  });
  it("does not flag another date or an unrelated event", () => {
    expect(detectDuplicates(base, [event("c", { date: "2026-10-10" })])).toEqual([]);
    expect(detectDuplicates(base, [event("d", { title: "Football Night", organizer: "Sports Council", venue: "Sports Complex", tags: ["Football"], category: "Sports" })])).toEqual([]);
  });
});

describe("scheduling intelligence", () => {
  it("ranks available low-conflict alternatives from the existing engine", () => {
    const slots = findBestSlots(base, [event("a")], { preferredDate: base.date, windowStart: "17:00", windowEnd: "21:00", durationMinutes: 90, venues: ["LH3", "LH2"], daysToSearch: 1 });
    expect(slots.length).toBeGreaterThan(0);
    expect(slots[0].venueAvailable).toBe(true);
    expect(slots[0].score).toBeLessThan(80);
    expect(slots[0].reasons.length).toBeGreaterThan(0);
  });
});

describe("event pressure", () => {
  it("returns zero for an empty hour and a positive explained signal for one event", () => {
    expect(measureEventPressure(base.date, 16, [event("a")]).score).toBe(0);
    const cell = measureEventPressure(base.date, 18, [event("a")]);
    expect(cell.score).toBeGreaterThan(0);
    expect(cell.totalAudience).toBe(100);
    expect(cell.reasons.length).toBeGreaterThan(0);
  });
  it("raises pressure for multiple similar events above unrelated events", () => {
    const related = measureEventPressure(base.date, 18, [event("a"), event("b", { venue: "LH2" })]);
    const unrelated = measureEventPressure(base.date, 18, [event("a"), event("c", { venue: "LH2", category: "Sports", tags: ["Football"] })]);
    expect(related.score).toBeGreaterThan(unrelated.score);
    expect(related.categoryCounts[0].count).toBe(2);
  });
});

describe("event readiness", () => {
  it("scores complete, partial and missing details transparently", () => {
    expect(assessReadiness(base).score).toBe(100);
    expect(assessReadiness({ title: "Short", date: base.date }).score).toBeLessThan(30);
    expect(assessReadiness({}).score).toBe(0);
    expect(assessReadiness({}).items).toHaveLength(10);
  });
});

describe("weighted schedule optimization", () => {
  it("handles no events and all compatible events", () => {
    expect(optimizeSchedule([], student).selected).toEqual([]);
    const result = optimizeSchedule([{ event: event("a"), preference: "SAVED" }, { event: event("b", { startTime: "19:30", endTime: "20:30" }), preference: "INTERESTED" }], student);
    expect(result.selected).toHaveLength(2);
  });
  it("prefers a must-attend event over a directly conflicting lower-value event", () => {
    const result = optimizeSchedule([{ event: event("a", { tags: ["Football"], organizer: "Sports Council", category: "Sports" }), preference: "MUST_ATTEND" }, { event: event("b"), preference: "INTERESTED" }], student);
    expect(result.selected.map((item) => item.event.id)).toEqual(["a"]);
    expect(result.skipped[0].conflictsWith).toContain(base.title);
  });
  it("chooses a better combination over one longer high-value event", () => {
    const result = optimizeSchedule([
      { event: event("long", { startTime: "17:00", endTime: "21:00" }), preference: "MUST_ATTEND" },
      { event: event("early", { startTime: "17:00", endTime: "19:00" }), preference: "SAVED" },
      { event: event("late", { startTime: "19:00", endTime: "21:00" }), preference: "SAVED" },
    ], student);
    expect(result.selected.map((item) => item.event.id)).toEqual(["early", "late"]);
  });
  it("reconstructs the optimum across a chain of conflicts", () => {
    const result = optimizeSchedule([
      { event: event("a", { startTime: "16:00", endTime: "18:00" }), preference: "SAVED" },
      { event: event("b", { startTime: "17:00", endTime: "19:00" }), preference: "INTERESTED" },
      { event: event("c", { startTime: "18:00", endTime: "20:00" }), preference: "SAVED" },
    ], student);
    expect(result.selected.map((item) => item.event.id)).toEqual(["a", "c"]);
  });
});

describe("text ingestion fallback", () => {
  it("extracts the demo announcement without claiming AI or inventing an end time", () => {
    const extracted = extractTextLocally("Hey everyone! Lambda is conducting an AI agents workshop tomorrow at 6 PM in LH3. Topics include LLMs, agents and RAG. See you there!");
    expect(extracted.title).toBe("AI agents workshop");
    expect(extracted.date).toBe(addDays(todayInIsth(), 1));
    expect(extracted.startTime).toBe("18:00");
    expect(extracted.endTime).toBeNull();
    expect(extracted.venue).toBe("LH3");
  });
  it("reads an explicit end time and preserves a clean demo title", () => {
    const extracted = extractTextLocally("Lambda Club is hosting the Lambda AI Workshop on 29 September 2026 from 6 PM to 7:30 PM in LH3. Learn AI and Programming.");
    expect(extracted.title).toBe("Lambda AI Workshop");
    expect(extracted.organizer).toBe("Lambda Club");
    expect(extracted.endTime).toBe("19:30");
  });
});
