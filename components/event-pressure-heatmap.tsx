"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, ChevronRight } from "lucide-react";
import { addDays, formatDate, formatTime, todayInIsth } from "@/lib/dates";
import { measureEventPressure, type PressureCell } from "@/lib/event-pressure";
import type { EventData } from "@/lib/types";

const hours = [16, 17, 18, 19, 20, 21];
const clock = (hour: number) => formatTime(`${String(hour).padStart(2, "0")}:00`);

export function EventPressureHeatmap({ events, fullLink = false }: { events: EventData[]; fullLink?: boolean }) {
  const [selectedCell, setSelectedCell] = useState<PressureCell | null>(null);
  const dates = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(todayInIsth(), index)), []);
  const cells = useMemo(() => dates.flatMap((day) => hours.map((hour) => measureEventPressure(day, hour, events))), [dates, events]);
  const nextQuieter = selectedCell ? cells.find((cell) => cell.date === selectedCell.date && cell.hour > selectedCell.hour && cell.score < selectedCell.score) : null;

  return <section id="heatmap" className="panel heatmap-panel">
    <div className="panel-heading"><div><span className="mini-label">CAMPUS CONFLICT HEATMAP · DEMO DATA</span><h2>Where the week gets crowded</h2></div><p>Event pressure blends volume, shared audiences, category concentration, turnout, and venue usage.</p></div>
    <div className="heatmap-scroll"><div className="heatmap-grid">
      <div className="heatmap-head time-head">TIME</div>
      {dates.map((day) => <div className="heatmap-head" key={day}>{formatDate(day, { weekday: "short", day: "numeric" })}</div>)}
      {hours.map((hour) => <div className="heatmap-row" key={hour}><div className="heatmap-time">{clock(hour)}</div>{dates.map((day) => {
        const cell = cells.find((item) => item.date === day && item.hour === hour)!;
        return <button key={`${day}-${hour}`} type="button" className={`heatmap-cell ${selectedCell?.date === day && selectedCell.hour === hour ? "active" : ""}`} style={{ backgroundColor: `rgba(var(--heatmap-rgb), ${0.06 + cell.score / 125})`, color: cell.score > 88 ? "var(--heatmap-high-ink)" : "var(--ink)" }} onClick={() => setSelectedCell(cell)} title={`${formatDate(day)} ${clock(hour)}: ${cell.score}/100 pressure, ${cell.events.length} events`} aria-label={`${formatDate(day)} at ${hour}:00, pressure ${cell.score} of 100`} aria-pressed={selectedCell?.date === day && selectedCell.hour === hour}><span>{cell.score}</span></button>;
      })}</div>)}
    </div></div>
    <div className="heatmap-legend"><span>QUIETER</span><i /><span>BUSIER</span><small>Click a cell for the evidence behind its score.</small></div>
    {selectedCell && <div className="pressure-detail"><div><span className="mini-label">SELECTED HOUR</span><h3>{formatDate(selectedCell.date, { weekday: "long", day: "numeric", month: "long" })} · {clock(selectedCell.hour)}</h3><p>{nextQuieter ? `Consider ${clock(nextQuieter.hour)} onward: listed pressure is ${nextQuieter.score}/100 versus ${selectedCell.score}/100 now.` : selectedCell.recommendation}</p></div><div className="pressure-score">{selectedCell.score}<small>/100 pressure</small></div><div className="pressure-facts"><span>{selectedCell.events.length} listed events</span><span>{selectedCell.tier} pressure</span><span>{selectedCell.totalAudience} estimated attendees</span><span>{selectedCell.categoryCounts[0] ? `${selectedCell.categoryCounts[0].count} ${selectedCell.categoryCounts[0].category.toLowerCase()} event${selectedCell.categoryCounts[0].count === 1 ? "" : "s"}` : "No category concentration"}</span><span>{selectedCell.venueCollisions} listed venue collision{selectedCell.venueCollisions === 1 ? "" : "s"}</span><span>{selectedCell.audienceOverlapPairs} audience overlap pair{selectedCell.audienceOverlapPairs === 1 ? "" : "s"}</span><span>{selectedCell.topTags.length ? selectedCell.topTags.join(" · ") : "No audience cluster"}</span></div><ul>{selectedCell.reasons.map((reason) => <li key={reason}><ChevronRight size={13} /> {reason}</li>)}</ul>{selectedCell.events.length > 0 && <div className="pressure-events">{selectedCell.events.map((event) => <Link key={event.id} href={`/events/${event.id}`}>{event.title} <ArrowRight size={13} /></Link>)}</div>}</div>}
    {fullLink && <Link className="organizer-detail-link" href="/organizer/intelligence">Open full Campus Intelligence →</Link>}
  </section>;
}
