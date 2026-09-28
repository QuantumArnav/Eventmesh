import { describe, expect, it } from "vitest";
import { limitedFormData, limitedJson, RequestTooLargeError } from "../lib/request-limits";

describe("request size limits", () => {
  it("rejects a chunked body beyond the limit before parsing", async () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(8));
        controller.enqueue(new Uint8Array(8));
        controller.close();
      },
    });
    const request = new Request("http://localhost/api/extract", { method: "POST", body, duplex: "half" } as RequestInit);
    await expect(limitedJson(request, 10)).rejects.toBeInstanceOf(RequestTooLargeError);
  });

  it("parses an image form only within the total body cap", async () => {
    const form = new FormData();
    form.set("poster", new File(["not an image"], "poster.png", { type: "image/png" }));
    const request = new Request("http://localhost/api/inbox", { method: "POST", body: form });
    const parsed = await limitedFormData(request, 1024);
    expect((parsed.get("poster") as File).name).toBe("poster.png");
  });
});
