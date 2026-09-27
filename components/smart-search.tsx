"use client";

import Link from "next/link";
import { useState } from "react";
import { formatDate, formatTime, todayInIsth } from "@/lib/dates";
import { parseSmartQuery, smartSearch, type SmartQuery, type SmartResult } from "@/lib/smart-search";
import type { EventData, StudentData } from "@/lib/types";
import { optimizeSchedule } from "@/lib/schedule-optimizer";

const examples = ["AI or programming events after 6 PM tomorrow", "Events this weekend that don't clash with my schedule", "I have two hours free tonight", "Sports events before dinner"];

export function SmartSearch({ events, student, savedIds }: { events: EventData[]; student: StudentData | null; savedIds: string[] }) {
  const [text, setText] = useState("");
  const [query, setQuery] = useState<SmartQuery | null>(null);
  const [results, setResults] = useState<SmartResult[] | null>(null);
  const [error, setError] = useState("");
  const plan = results && student && query?.afterTime && query?.beforeTime ? optimizeSchedule(results.map(({ event }) => ({ event, preference: savedIds.includes(event.id) ? "SAVED" as const : "INTERESTED" as const })), student) : null;
  const run = (value: string) => {
    setText(value);
    try {
      const structured = parseSmartQuery(value, todayInIsth());
      setQuery(structured); setResults(smartSearch(structured, events, student, savedIds)); setError("");
    } catch { setError("Could not understand that query. Try a shorter phrase or use the filters below."); setResults(null); }
  };
  return <section className="panel smart-search" aria-label="Smart Search">
    <div className="panel-heading"><div><span className="mini-label">ASK EVENTMESH</span><h2>Smart Search</h2></div><span className="mini-label">EVENTS FROM THIS CALENDAR ONLY</span></div>
    <p>Describe your interests and free time. EventMesh converts the phrase into checked filters, ranks listed events, and can avoid clashes with saved events.</p>
    <form onSubmit={(event) => { event.preventDefault(); run(text); }} className="smart-search-form"><input value={text} onChange={(event) => setText(event.target.value)} aria-label="Ask EventMesh" placeholder="Find AI events after 6 PM tomorrow…" maxLength={200} /><button className="button button-primary" type="submit" disabled={!text.trim()}>Find events</button></form>
    <div className="smart-examples">{examples.map((example) => <button type="button" key={example} onClick={() => run(example)}>{example}</button>)}</div>
    {error && <div className="notice error" role="alert">{error}</div>}
    {results && <div className="smart-results"><p><strong>{results.length} matching listed event{results.length === 1 ? "" : "s"}</strong>{query?.avoidScheduleConflicts && " · saved schedule clashes excluded"}</p>
      {query && <details><summary>See interpreted filters</summary><pre>{JSON.stringify(query, null, 2)}</pre></details>}
      {plan && plan.selected.length > 0 && <div className="smart-plan"><strong>Recommended conflict-free plan</strong><p>Weighted interval scheduling selected {plan.selected.length} compatible event{plan.selected.length === 1 ? "" : "s"} from these results.</p>{plan.selected.map(({ event }) => <span key={event.id}>{formatTime(event.startTime)}–{formatTime(event.endTime)} · {event.title}</span>)}</div>}
      {results.length ? results.slice(0, 6).map(({ event, score, reasons }) => <Link href={`/events/${event.id}`} className="smart-result" key={event.id}><span><strong>{event.title}</strong><small>{formatDate(event.date)} · {formatTime(event.startTime)}–{formatTime(event.endTime)} · {event.venue}</small><small>{reasons.join(" · ")}</small></span><b>{score}/100</b></Link>) : <p>No listed event meets every constraint. Widen the time or remove a topic.</p>}
    </div>}
  </section>;
}
