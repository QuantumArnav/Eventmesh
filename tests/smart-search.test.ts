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
  it("returns only events from the supplied database rows", () => {
    const rows = [event("one", "AI Lab", "2026-09-28", "18:30", "19:30", ["AI"]), event("two", "Morning coding", "2026-09-28", "10:00", "11:00", ["Programming"])];
    const results = smartSearch(parseSmartQuery("AI or programming after 6 PM tomorrow", today), rows, null, []);
    expect(results.map((item) => item.event.id)).toEqual(["one"]);
  });
  it("excludes clashes with saved events", () => {
    const rows = [event("saved", "My plan", "2026-09-28", "18:00", "19:00", ["AI"]), event("clash", "Other", "2026-09-28", "18:30", "19:30", ["AI"]), event("later", "Later", "2026-09-28", "19:30", "20:30", ["AI"])];
    const results = smartSearch(parseSmartQuery("AI tomorrow that don't clash with my schedule", today), rows, null, ["saved"]);
    expect(results.map((item) => item.event.id)).toEqual(["saved", "later"]);
  });
});
