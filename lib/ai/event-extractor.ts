import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { extractedEventSchema } from "../validation";

export class ExtractionUnavailableError extends Error {}

export async function extractEventFromPoster(file: File) {
  if (!process.env.OPENAI_API_KEY) throw new ExtractionUnavailableError("Automatic extraction unavailable. Add an API key or enter event details manually.");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 25000, maxRetries: 0 });
  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  try {
    const response = await client.responses.parse({
      model: process.env.OPENAI_VISION_MODEL || "gpt-4.1-mini",
      input: [{ role: "user", content: [
        { type: "input_text", text: "Extract the event information visible in this campus poster. Return null for fields not explicitly given. Normalize dates as YYYY-MM-DD and times as 24-hour HH:MM. If the year is missing, infer the next upcoming occurrence relative to today's date. Do not invent organizers, times, venues or deadlines. Choose a category from Technical, Cultural, Sports, Workshop, Talk, Community when clear. Today's date is " + new Date().toISOString().slice(0, 10) + "." },
        { type: "input_image", image_url: `data:${file.type};base64,${base64}`, detail: "high" },
      ] }],
      text: { format: zodTextFormat(extractedEventSchema, "campus_event") },
    });
    if (!response.output_parsed) throw new Error("No structured result returned");
    return extractedEventSchema.parse(response.output_parsed);
  } catch {
    throw new ExtractionUnavailableError("Automatic extraction unavailable. You can enter the event details manually.");
  }
}
