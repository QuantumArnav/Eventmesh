import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { addDays, todayInIsth } from "../dates";
import { extractedEventSchema } from "../validation";

export class ExtractionUnavailableError extends Error {}
export type ExtractionSource = { sourceType: "image"; content: File } | { sourceType: "text"; content: string };
export type ExtractionResult = { extracted: ReturnType<typeof extractedEventSchema.parse>; method: "AI vision" | "AI text" | "Local text parser" };

function dateFromWords(input: string): string | null {
  const today = todayInIsth();
  if (/\btomorrow\b/i.test(input)) return addDays(today, 1);
  if (/\btoday\b/i.test(input)) return today;
  const match = input.match(/\b(\d{1,2})\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)(?:\s+(\d{4}))?\b/i);
  if (!match) return null;
  const month = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].indexOf(match[2].slice(0, 3).toLowerCase()) + 1;
  let year = match[3] ? Number(match[3]) : Number(today.slice(0, 4));
  let date = `${year}-${String(month).padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  if (!match[3] && date < today) { year++; date = `${year}-${String(month).padStart(2, "0")}-${match[1].padStart(2, "0")}`; }
  return Number.isNaN(Date.parse(`${date}T00:00:00Z`)) ? null : date;
}

function toTime(hour: string, minute: string | undefined, meridian: string | undefined): string {
  let value = Number(hour);
  if (meridian?.toLowerCase() === "pm" && value < 12) value += 12;
  if (meridian?.toLowerCase() === "am" && value === 12) value = 0;
  return `${String(value).padStart(2, "0")}:${minute ?? "00"}`;
}

export function extractTextLocally(input: string): ExtractionResult["extracted"] {
  const text = input.trim();
  const title = (text.match(/\b(?:conducting|hosting|organizing|announcing|join us for)\s+(?:an?\s+)?([A-Za-z][A-Za-z0-9 +&-]*?\s+(?:workshop|contest|hackathon|talk|meetup|night|session|seminar))\b/i)?.[1]
    ?? text.match(/\b([A-Z][A-Za-z0-9 +&-]*?\s+(?:workshop|contest|hackathon|talk|meetup|night|session|seminar))\b/i)?.[1] ?? null)?.replace(/^the\s+/i, "") ?? null;
  const organizer = text.match(/\b(Lambda Club|Lambda|Programming Club|Robotics Club|Sports Council|[A-Z][A-Za-z]+ Club)\b/i)?.[1] ?? null;
  const venue = text.match(/\b(LH\s?\d+|Academic Block|Convention Centre|Sports Complex|Hostel Common Room|Amphitheatre)\b/i)?.[1]?.replace(/LH\s+(\d+)/i, "LH$1") ?? null;
  const timeMatches = [...text.matchAll(/\b(\d{1,2})(?::([0-5]\d))?\s*(AM|PM)\b/gi)];
  const tags = ["AI", "Programming", "Machine Learning", "LLMs", "Agents", "RAG", "Football", "Startups", "Robotics", "Astronomy", "Design", "Music"].filter((tag) => text.toLowerCase().includes(tag.toLowerCase()));
  const category = /workshop/i.test(text) ? "Workshop" : /contest|hackathon|coding|agents|programming/i.test(text) ? "Technical" : /football|sport/i.test(text) ? "Sports" : /talk|seminar/i.test(text) ? "Talk" : null;
  const firstTime = timeMatches[0];
  const secondTime = timeMatches[1];
  const betweenTimes = firstTime && secondTime ? text.slice((firstTime.index ?? 0) + firstTime[0].length, secondTime.index).trim() : "";
  return extractedEventSchema.parse({ title, organizer, description: text || null, date: dateFromWords(text), startTime: firstTime ? toTime(firstTime[1], firstTime[2], firstTime[3]) : null, endTime: secondTime && /^(to|until|[-–])$/i.test(betweenTimes) ? toTime(secondTime[1], secondTime[2], secondTime[3]) : null, venue, registrationDeadline: null, category, tags });
}

export async function extractEvent(source: ExtractionSource): Promise<ExtractionResult> {
  if (source.sourceType === "text" && !process.env.OPENAI_API_KEY) return { extracted: extractTextLocally(source.content), method: "Local text parser" };
  if (!process.env.OPENAI_API_KEY) throw new ExtractionUnavailableError("Automatic extraction unavailable. Add an API key or enter event details manually.");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 25000, maxRetries: 0 });
  const content = source.sourceType === "image" ? [
    { type: "input_text" as const, text: "Extract the event information visible in this campus poster." },
    { type: "input_image" as const, image_url: `data:${source.content.type};base64,${Buffer.from(await source.content.arrayBuffer()).toString("base64")}`, detail: "high" as const },
  ] : [{ type: "input_text" as const, text: `Extract the event information from this campus announcement:\n${source.content}` }];
  try {
    const response = await client.responses.parse({
      model: process.env.OPENAI_VISION_MODEL || "gpt-4.1-mini",
      input: [{ role: "user", content: [
        { type: "input_text", text: `Return null for fields not explicitly given. Normalize dates as YYYY-MM-DD and times as 24-hour HH:MM. If the year is missing, infer the next upcoming occurrence relative to today, ${todayInIsth()}. Do not invent organizers, times, venues or deadlines. Choose a category from Technical, Cultural, Sports, Workshop, Talk, Community when clear.` },
        ...content,
      ] }],
      text: { format: zodTextFormat(extractedEventSchema, "campus_event") },
    });
    if (!response.output_parsed) throw new Error("No structured result returned");
    return { extracted: extractedEventSchema.parse(response.output_parsed), method: source.sourceType === "image" ? "AI vision" : "AI text" };
  } catch {
    if (source.sourceType === "text") return { extracted: extractTextLocally(source.content), method: "Local text parser" };
    throw new ExtractionUnavailableError("Automatic extraction unavailable. You can enter the event details manually.");
  }
}
