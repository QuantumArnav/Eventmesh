import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "../lib/safe-redirect";

describe("post-login redirect", () => {
  it("keeps local destinations and rejects external and backslash-based redirects", () => {
    expect(safeRedirectPath("/events/abc?from=discover")).toBe("/events/abc?from=discover");
    for (const value of ["https://other.example", "//other.example", "/\\other.example", "javascript:alert(1)", null]) {
      expect(safeRedirectPath(value)).toBe("/discover");
    }
  });
});
