import { describe, expect, it } from "vitest";
import { parseSmartQuery, smartSearch } from "../lib/smart-search";
import type { EventData } from "../lib/types";

const event = (id: string, title: string, date: string, startTime: string, endTime: string, tags: string[]): EventData => ({ id, title, organizer: "Demo Club", description: "Demo listing", date, startTime, endTime, venue: "LH1", category: "Technical", tags, registrationDeadline: null, expectedAudience: 50, popularity: 50, isDemo: true });

describe("Smart Search", () => {
  const today = "2026-09-27";
  it("turns the example phrase into a checked tomorrow and time filter", () => {
    const query = parseSmartQuery("Find me an AI or programming event after 6 PM tomorrow", today);
    expect(query.dateFrom).toBe("2026-09-28");
    expect(query.afterTime).toBe("18:00");
    expect(query.tags).toEqual(["AI", "Programming"]);
  });
  it("understands a free-time window and a written duration", () => {
    const window = parseSmartQuery("I am free from 6 PM to 9 PM", today);
    expect(window.afterTime).toBe("18:00");
    expect(window.beforeTime).toBe("21:00");
    expect(window.avoidScheduleConflicts).toBe(true);
    expect(parseSmartQuery("I have two hours free tonight", today).maxDuration).toBe(120);
    const casualWindow = parseSmartQuery("things I can attend between 6 and 9 PM", today);
    expect(casualWindow.afterTime).toBe("18:00");
    expect(casualWindow.beforeTime).toBe("21:00");
    expect(casualWindow.freeText).toBe("");
  });
  it("returns only events from the supplied database rows", () => {
    const rows = [event("one", "AI Lab", "2026-09-28", "18:30", "19:30", ["AI"]), event("two", "Morning coding", "2026-09-28", "10:00", "11:00", ["Programming"])];
    const results = smartSearch(parseSmartQuery("AI or programming after 6 PM tomorrow", today), rows, null, []);
    expect(results.map((item) => item.event.id)).toEqual(["one"]);
  });
  it("excludes clashes with saved events", () => {
    const rows = [event("saved", "My plan", "2026-09-28", "18:00", "19:00", ["AI"]), event("clash", "Other", "2026-09-28", "18:30", "19:30", ["AI"]), event("later", "Later", "2026-09-28", "19:30", "20:30", ["AI"])];
    const results = smartSearch(parseSmartQuery("AI tomorrow that don't clash with my schedule", today), rows, null, ["saved"]);
    expect(results.map((item) => item.event.id)).toEqual(["saved", "later"]);
    const generic = parseSmartQuery("events that don't clash with my saved schedule", today);
    expect(generic.avoidScheduleConflicts).toBe(true);
    expect(generic.freeText).toBe("");
    expect(smartSearch(generic, rows, null, ["saved"]).map((item) => item.event.id)).toEqual(["saved", "later"]);
  });
});
