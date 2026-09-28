import sharp from "sharp";

const formats: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/webp": "webp",
};

/** Decode the entire image: a signature alone does not make a safe poster. */
export async function validPosterBytes(bytes: Buffer, type: string): Promise<boolean> {
  const format = formats[type];
  if (!format || bytes.length === 0) return false;
  try {
    const image = sharp(bytes, { failOn: "error", limitInputPixels: 25_000_000 });
    const metadata = await image.metadata();
    if (metadata.format !== format || !metadata.width || !metadata.height) return false;
    await image.stats();
    return true;
  } catch {
    return false;
  }
}
