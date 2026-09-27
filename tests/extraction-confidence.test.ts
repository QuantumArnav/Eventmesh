import { describe, expect, it } from "vitest";
import { assessExtraction, confidenceLabel, extractTextLocally } from "../lib/ai/event-extractor";

describe("extraction uncertainty", () => {
  it("does not resolve tomorrow without a publication date", () => {
    const source = "Lambda Club is hosting an AI workshop tomorrow at 6 PM in LH3.";
    const extracted = extractTextLocally(source);
    expect(extracted.date).toBeNull();
    expect(assessExtraction(extracted, source).date.warning).toContain("Relative date");
  });
  it("flags an incomplete lecture hall reference", () => {
    const source = "Join the robotics workshop on 29 September 2026 at 6 PM in LH.";
    const extracted = extractTextLocally(source);
    expect(extracted.venue).toBeNull();
    expect(assessExtraction(extracted, source).venue.warning).toContain("incomplete");
  });
  it("only assigns high confidence when text evidence is direct", () => {
    expect(confidenceLabel(0.9)).toBe("High confidence");
    expect(confidenceLabel(0.65)).toBe("Review suggested");
    expect(confidenceLabel(0.2)).toBe("Uncertain");
  });
});
