import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { parseSmartQuery, smartQuerySchema, type SmartQuery } from "../smart-search";

export type SearchInterpretation = { query: SmartQuery; method: "AI" | "Local rules" };

export async function interpretSearch(text: string, today: string): Promise<SearchInterpretation> {
  const fallback = (): SearchInterpretation => ({ query: parseSmartQuery(text, today), method: "Local rules" });
  if (!process.env.OPENAI_API_KEY) return fallback();

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 10000, maxRetries: 0 });
    const response = await client.responses.parse({
      model: process.env.OPENAI_SEARCH_MODEL || "gpt-4.1-mini",
      input: [{ role: "user", content: [{ type: "input_text", text: `Today in India is ${today}. Convert the following campus event search into filters only. Use dates YYYY-MM-DD and times HH:MM. Categories may only be Technical, Cultural, Sports, Workshop, Talk, Community. Use null for unspecified constraints and an empty array for unspecified categories or tags. Set avoidScheduleConflicts only when requested. Never invent event records. A free-time window means afterTime and beforeTime. Put any unparsed topic in freeText. Query: ${JSON.stringify(text)}` }] }],
      text: { format: zodTextFormat(smartQuerySchema, "event_search_filters") },
    });
    if (!response.output_parsed) return fallback();
    const query = smartQuerySchema.parse(response.output_parsed);
    if (query.dateFrom && query.dateTo && query.dateFrom > query.dateTo) return fallback();
    if (query.afterTime && query.beforeTime && query.afterTime >= query.beforeTime) return fallback();
    return { query, method: "AI" };
  } catch {
    return fallback();
  }
}
