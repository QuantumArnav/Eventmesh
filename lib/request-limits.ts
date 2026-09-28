export class RequestTooLargeError extends Error {}

async function readLimited(request: Request, maxBytes: number): Promise<Buffer> {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) throw new RequestTooLargeError();
  if (!request.body) return Buffer.alloc(0);
  const reader = request.body.getReader();
  const chunks: Buffer[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) throw new RequestTooLargeError();
      chunks.push(Buffer.from(value));
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  }
  return Buffer.concat(chunks, total);
}

export async function limitedJson(request: Request, maxBytes = 8 * 1024): Promise<unknown> {
  return JSON.parse((await readLimited(request, maxBytes)).toString("utf8"));
}

export async function limitedFormData(request: Request, maxBytes = 6 * 1024 * 1024): Promise<FormData> {
  const bytes = await readLimited(request, maxBytes);
  const headers = new Headers({ "content-type": request.headers.get("content-type") ?? "" });
  return new Request(request.url, { method: "POST", headers, body: new Uint8Array(bytes) }).formData();
}
