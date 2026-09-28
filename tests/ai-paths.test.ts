import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ parse: vi.fn() }));
vi.mock("openai", () => ({ default: class { responses = { parse: mocks.parse }; } }));

import { extractEvent, ExtractionUnavailableError } from "../lib/ai/event-extractor";
import { interpretSearch } from "../lib/ai/search-interpreter";

const originalKey = process.env.OPENAI_API_KEY;

beforeEach(() => { process.env.OPENAI_API_KEY = "test-key"; mocks.parse.mockReset(); });
afterEach(() => { if (originalKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = originalKey; });

describe("optional AI integration boundaries", () => {
  it("turns AI search output into validated filters and never accepts event records", async () => {
    mocks.parse.mockResolvedValue({ output_parsed: { categories: [], tags: ["AI"], dateFrom: "2026-09-29", dateTo: "2026-09-29", afterTime: "18:00", beforeTime: null, maxDuration: null, avoidScheduleConflicts: false, freeText: "" } });
    const result = await interpretSearch("AI after 6 PM tomorrow", "2026-09-28");
    expect(result.method).toBe("AI");
    expect(result.query.tags).toEqual(["AI"]);
    expect(Object.keys(result.query)).not.toContain("events");
  });
  it("falls back to local search rules if AI returns invalid filters", async () => {
    mocks.parse.mockResolvedValue({ output_parsed: { categories: ["Not a category"], tags: [], dateFrom: null, dateTo: null, afterTime: null, beforeTime: null, maxDuration: null, avoidScheduleConflicts: false, freeText: "" } });
    const result = await interpretSearch("AI tomorrow", "2026-09-28");
    expect(result.method).toBe("Local rules");
    expect(result.query.dateFrom).toBe("2026-09-29");
  });
  it("sends poster bytes to the vision input and returns an editable draft", async () => {
    mocks.parse.mockResolvedValue({ output_parsed: { title: "AI Agents Workshop", organizer: "Lambda Club", description: "Join the workshop", date: "2026-09-29", startTime: "18:00", endTime: "19:30", venue: "LH3", registrationDeadline: null, category: "Workshop", tags: ["AI"] } });
    const poster = new File([new Uint8Array([137, 80, 78, 71])], "poster.png", { type: "image/png" });
    const result = await extractEvent({ sourceType: "image", content: poster });
    expect(result.method).toBe("AI vision");
    expect(result.extracted.title).toBe("AI Agents Workshop");
    expect(JSON.stringify(mocks.parse.mock.calls[0][0].input)).toContain("data:image/png;base64,");
  });
  it("keeps poster review manual when the provider fails", async () => {
    mocks.parse.mockRejectedValue(new Error("provider unavailable"));
    const poster = new File([new Uint8Array([137, 80, 78, 71])], "poster.png", { type: "image/png" });
    await expect(extractEvent({ sourceType: "image", content: poster })).rejects.toBeInstanceOf(ExtractionUnavailableError);
  });
});
