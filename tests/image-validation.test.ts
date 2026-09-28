import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { validPosterBytes } from "../lib/image-validation";

describe("poster upload bytes", () => {
  it("accepts fully decodable images in the declared format", async () => {
    const png = await sharp({ create: { width: 2, height: 2, channels: 4, background: "#187349" } }).png().toBuffer();
    expect(await validPosterBytes(png, "image/png")).toBe(true);
    expect(await validPosterBytes(png, "image/jpeg")).toBe(false);
  });

  it("rejects files with only a plausible signature or incomplete data", async () => {
    expect(await validPosterBytes(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), "image/png")).toBe(false);
    expect(await validPosterBytes(Buffer.from("RIFF"), "image/webp")).toBe(false);
    expect(await validPosterBytes(Buffer.from("not a poster"), "image/png")).toBe(false);
  });
});
