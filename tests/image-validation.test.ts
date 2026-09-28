import { describe, expect, it } from "vitest";
import { validPosterBytes } from "../lib/image-validation";

describe("poster upload bytes", () => {
  it("accepts a matching PNG header and rejects a renamed text file", () => {
    expect(validPosterBytes(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), "image/png")).toBe(true);
    expect(validPosterBytes(Buffer.from("not a poster"), "image/png")).toBe(false);
  });
  it("rejects truncated WebP data", () => {
    expect(validPosterBytes(Buffer.from("RIFF"), "image/webp")).toBe(false);
  });
});
