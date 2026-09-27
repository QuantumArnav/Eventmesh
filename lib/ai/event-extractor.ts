import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { extractedEventSchema } from "../validation";

export class ExtractionUnavailableError extends Error {}
export type ExtractionSource = { sourceType: "image"; content: File } | { sourceType: "text"; content: string };
export type ExtractionField = "title" | "organizer" | "date" | "startTime" | "endTime" | "venue" | "registrationDeadline";
export type FieldAssessment = { confidence: number; label: "High confidence" | "Review suggested" | "Uncertain"; warning: string | null };
export type ExtractionResult = { extracted: ReturnType<typeof extractedEventSchema.parse>; method: "AI vision" | "AI text" | "Local text parser"; fields: Record<ExtractionField, FieldAssessment> };

export function confidenceLabel(score: number): FieldAssessment["label"] {
  return score >= 0.85 ? "High confidence" : score >= 0.5 ? "Review suggested" : "Uncertain";
}

export function assessExtraction(extracted: ExtractionResult["extracted"], sourceText: string | null): Record<ExtractionField, FieldAssessment> {
  const keys: ExtractionField[] = ["title", "organizer", "date", "startTime", "endTime", "venue", "registrationDeadline"];
  const relativeDate = !!sourceText && /\b(today|tomorrow|tonight|next\s+\w+)\b/i.test(sourceText);
  const fullDate = !!sourceText && /\b\d{1,2}\s+[A-Za-z]+\s+\d{4}\b/.test(sourceText);
  const incompleteVenue = !!sourceText && /\b(?:at|in)\s+LH\b(?!\s*\d)/i.test(sourceText);
  return Object.fromEntries(keys.map((key) => {
    let value = extracted[key];
    let warning: string | null = null;
    if ((key === "date" || key === "registrationDeadline") && relativeDate && !fullDate) {
      value = null; warning = "Relative date detected but the announcement date is unavailable.";
    }
    if (key === "venue" && incompleteVenue && !/\bLH\s*\d+\b/i.test(sourceText ?? "")) {
      value = null; warning = "Venue appears incomplete.";
    }
    if (value === null) warning ??= "Not clearly stated in the source; please enter or verify it.";
    // These are evidence tiers, not calibrated model probabilities.
    const evidence = sourceText && typeof value === "string" && sourceText.toLowerCase().includes(value.toLowerCase());
    const confidence = value === null ? 0.2 : evidence ? 0.9 : sourceText ? 0.65 : 0.65;
    return [key, { confidence, label: confidenceLabel(confidence), warning }];
  })) as Record<ExtractionField, FieldAssessment>;
}

function result(extracted: ExtractionResult["extracted"], method: ExtractionResult["method"], sourceText: string | null): ExtractionResult {
  const fields = assessExtraction(extracted, sourceText);
  for (const key of ["date", "registrationDeadline", "venue"] as const) if (fields[key].warning?.startsWith("Relative date") || fields[key].warning === "Venue appears incomplete.") extracted[key] = null;
  return { extracted, method, fields };
}

function dateFromWords(input: string): string | null {
  const match = input.match(/\b(\d{1,2})\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{4})\b/i);
  if (!match) return null;
  const month = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].indexOf(match[2].slice(0, 3).toLowerCase()) + 1;
  const year = Number(match[3]);
  const date = `${year}-${String(month).padStart(2, "0")}-${match[1].padStart(2, "0")}`;
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
  const deadlineText = text.match(/\b(?:registration\s+(?:deadline|closes)|register\s+by)\b\s*(?:is|on|by|:)?\s*([^.!?\n]+)/i)?.[1];
  const tags = ["AI", "Programming", "Machine Learning", "LLMs", "Agents", "RAG", "Football", "Startups", "Robotics", "Astronomy", "Design", "Music"].filter((tag) => text.toLowerCase().includes(tag.toLowerCase()));
  const category = /workshop/i.test(text) ? "Workshop" : /contest|hackathon|coding|agents|programming/i.test(text) ? "Technical" : /football|sport/i.test(text) ? "Sports" : /talk|seminar/i.test(text) ? "Talk" : null;
  const firstTime = timeMatches[0];
  const secondTime = timeMatches[1];
  const betweenTimes = firstTime && secondTime ? text.slice((firstTime.index ?? 0) + firstTime[0].length, secondTime.index).trim() : "";
  return extractedEventSchema.parse({ title, organizer, description: text || null, date: dateFromWords(text), startTime: firstTime ? toTime(firstTime[1], firstTime[2], firstTime[3]) : null, endTime: secondTime && /^(to|until|[-–])$/i.test(betweenTimes) ? toTime(secondTime[1], secondTime[2], secondTime[3]) : null, venue, registrationDeadline: deadlineText ? dateFromWords(deadlineText) : null, category, tags });
}

export async function extractEvent(source: ExtractionSource): Promise<ExtractionResult> {
  if (source.sourceType === "text" && !process.env.OPENAI_API_KEY) return result(extractTextLocally(source.content), "Local text parser", source.content);
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
        { type: "input_text", text: "Return null for fields not explicitly given. Normalize fully specified dates as YYYY-MM-DD and times as 24-hour HH:MM. If a date is relative (such as tomorrow) and the source publication date is not explicit, return null. If the year is absent, return null. Incomplete venues such as LH must be null. Do not invent organizers, times, venues or deadlines. Choose a category from Technical, Cultural, Sports, Workshop, Talk, Community when clear." },
        ...content,
      ] }],
      text: { format: zodTextFormat(extractedEventSchema, "campus_event") },
    });
    if (!response.output_parsed) throw new Error("No structured result returned");
    return result(extractedEventSchema.parse(response.output_parsed), source.sourceType === "image" ? "AI vision" : "AI text", source.sourceType === "text" ? source.content : null);
  } catch {
    if (source.sourceType === "text") return result(extractTextLocally(source.content), "Local text parser", source.content);
    throw new ExtractionUnavailableError("Automatic extraction unavailable. You can enter the event details manually.");
  }
}
