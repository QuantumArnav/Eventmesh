"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, CalendarRange, ChevronRight, Radar, Sparkles } from "lucide-react";
import { useCampus } from "@/app/providers";
import { LoadingState } from "@/components/loading";
import { addDays, formatDate, formatTime, todayInIsth } from "@/lib/dates";
import { measureEventPressure, type PressureCell } from "@/lib/event-pressure";
import { findBestSlots, type RankedSlot } from "@/lib/scheduling-engine";
import { CATEGORIES, type Category, type EventInput } from "@/lib/types";

const hours = [16, 17, 18, 19, 20, 21];
const lectureHalls = ["LH1", "LH2", "LH3"];

export default function SchedulingIntelligence() {
  const { events, loading, error } = useCampus();
  const [category, setCategory] = useState<Category>("Technical");
  const [tags, setTags] = useState("AI, Programming, Machine Learning");
  const [audience, setAudience] = useState("80");
  const [duration, setDuration] = useState("90");
  const [date, setDate] = useState(() => addDays(todayInIsth(), 2));
  const [windowStart, setWindowStart] = useState("17:00");
  const [windowEnd, setWindowEnd] = useState("22:00");
  const [venue, setVenue] = useState("Any lecture hall");
  const [slots, setSlots] = useState<RankedSlot[] | null>(null);
  const [validation, setValidation] = useState("");
  const [selectedCell, setSelectedCell] = useState<PressureCell | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<RankedSlot | null>(null);
  const [busySlot, setBusySlot] = useState<RankedSlot | null>(null);
  const dates = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(todayInIsth(), index)), []);
  const cells = useMemo(() => dates.flatMap((day) => hours.map((hour) => measureEventPressure(day, hour, events))), [dates, events]);

  const calculate = () => {
    const size = Number(duration), turnout = Number(audience);
    if (!date || windowStart >= windowEnd || size < 30 || size > 240 || turnout < 1 || turnout > 10000 || !tags.trim()) {
      setValidation("Choose a date, valid 30–240 minute duration, audience, tags, and a time window with enough space."); setSlots(null); return;
    }
    const venues = venue === "Any lecture hall" ? lectureHalls : [venue];
    const base: EventInput = { title: "Proposed event", organizer: "Planning preview", description: "Scheduling preview for a proposed campus event.", date, startTime: windowStart, endTime: windowEnd, venue: venues[0], category, tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean), expectedAudience: turnout, registrationDeadline: null };
    const ranked = findBestSlots(base, events, { preferredDate: date, windowStart, windowEnd, durationMinutes: size, venues, daysToSearch: 3, limit: 300 });
    setSlots(ranked.slice(0, 6)); setSelectedSlot(ranked[0] ?? null);
    setBusySlot([...ranked].filter((slot) => slot.date === date).sort((a, b) => b.score - a.score)[0] ?? null);
    setValidation(ranked.length ? "" : "No interval fits this window. Widen it or shorten the event.");
  };

  return <div className="page-wrap"><div className="page-header"><div><div className="section-kicker"><Radar size={15} /> ORGANIZER INTELLIGENCE</div><h1 className="page-title">Find the right moment.</h1><p className="page-subtitle">Compare real campus signals before choosing a date, room, and audience.</p></div><Link href="/organizer/create" className="button button-secondary">Create event <ArrowRight size={16} /></Link></div>
    {error && <div className="notice error">{error}</div>}
    {loading ? <LoadingState /> : <><div className="intelligence-grid"><section className="panel intelligence-form"><div className="panel-heading"><div><span className="mini-label">SMART SCHEDULING</span><h2>Plan a campus event</h2></div><Sparkles size={19} color="#8ce9d6" /></div><div className="form-grid">
      <div className="field"><label htmlFor="sched-category">Category</label><select id="sched-category" value={category} onChange={(event) => setCategory(event.target.value as Category)}>{CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></div>
      <div className="field"><label htmlFor="sched-audience">Expected audience</label><input id="sched-audience" type="number" min="1" max="10000" value={audience} onChange={(event) => setAudience(event.target.value)} /></div>
      <div className="field full"><label htmlFor="sched-tags">Audience interests</label><input id="sched-tags" value={tags} onChange={(event) => setTags(event.target.value)} /></div>
      <div className="field"><label htmlFor="sched-date">Preferred date</label><input id="sched-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} /></div>
      <div className="field"><label htmlFor="sched-duration">Duration</label><select id="sched-duration" value={duration} onChange={(event) => setDuration(event.target.value)}><option value="60">60 minutes</option><option value="90">90 minutes</option><option value="120">120 minutes</option><option value="180">180 minutes</option></select></div>
      <div className="field"><label htmlFor="sched-from">Window starts</label><input id="sched-from" type="time" value={windowStart} onChange={(event) => setWindowStart(event.target.value)} /></div>
      <div className="field"><label htmlFor="sched-to">Window ends</label><input id="sched-to" type="time" value={windowEnd} onChange={(event) => setWindowEnd(event.target.value)} /></div>
      <div className="field full"><label htmlFor="sched-venue">Required venue</label><select id="sched-venue" value={venue} onChange={(event) => setVenue(event.target.value)}><option>Any lecture hall</option>{[...new Set([...lectureHalls, ...events.map((item) => item.venue)])].map((item) => <option key={item}>{item}</option>)}</select></div>
    </div>{validation && <div className="notice error" style={{ marginTop: 14 }}>{validation}</div>}<button className="button button-primary" style={{ marginTop: 19 }} onClick={calculate}><Radar size={16} /> Find best slots</button><p className="intelligence-footnote">Scores use listed demo events and estimated audiences. This is not an official venue booking check.</p></section>
    <section className="panel intelligence-results"><div className="panel-heading"><div><span className="mini-label">RANKED ALTERNATIVES</span><h2>Best times to schedule</h2></div><span className="mini-label">EXPLAINED</span></div>{slots === null ? <div className="intelligence-placeholder"><CalendarRange size={35} /><h3>Make a smarter first move.</h3><p>Set your constraints and run the planner to compare real candidate slots.</p></div> : slots.length ? <div className="ranked-list">{slots.map((slot, index) => <button key={`${slot.date}-${slot.startTime}-${slot.venue}`} className={`ranked-slot ${selectedSlot === slot ? "selected" : ""}`} onClick={() => setSelectedSlot(slot)}><span className="ranked-index">{String(index + 1).padStart(2, "0")}</span><span><strong>{formatDate(slot.date)} · {formatTime(slot.startTime)} – {formatTime(slot.endTime)}</strong><small>{slot.venue} · {slot.venueAvailable ? "Venue clear" : "Venue collision"} · {slot.audienceOverlap} audience overlap</small></span><span className={`score-badge ${slot.score >= 60 ? "hot" : ""}`}>{slot.score}<small>/100</small></span></button>)}</div> : <div className="intelligence-placeholder">No candidate slots fit the selected constraints.</div>}{selectedSlot && <div className="slot-explanation"><strong>Why this slot?</strong><p>{selectedSlot.competingEvents} overlapping listed events · Worst conflict {selectedSlot.worstConflict}/100. Combined score weights the worst clash at 70% and mean clash at 30%, with a venue penalty.</p><ul>{selectedSlot.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul></div>}{busySlot && busySlot.score > (selectedSlot?.score ?? 0) && <div className="avoid-slot"><span className="mini-label">COMPARE WITH A BUSY SLOT</span><strong>{formatTime(busySlot.startTime)} – {formatTime(busySlot.endTime)} · {busySlot.venue}</strong><p>{busySlot.score}/100 score · {busySlot.competingEvents} competing listed events · {busySlot.venueAvailable ? "venue clear" : "venue collision"}</p></div>}</section></div>
    <section className="panel heatmap-panel"><div className="panel-heading"><div><span className="mini-label">CAMPUS CONFLICT HEATMAP · DEMO DATA</span><h2>Where the week gets crowded</h2></div><p>Event pressure blends volume, shared audiences, category concentration, turnout, and venue usage.</p></div><div className="heatmap-scroll"><div className="heatmap-grid"><div className="heatmap-head time-head">TIME</div>{dates.map((day) => <div className="heatmap-head" key={day}>{formatDate(day, { weekday: "short", day: "numeric" })}</div>)}{hours.map((hour) => <div className="heatmap-row" key={hour}><div className="heatmap-time">{formatTime(`${String(hour).padStart(2, "0")}:00`)}</div>{dates.map((day) => { const cell = cells.find((item) => item.date === day && item.hour === hour)!; return <button key={`${day}-${hour}`} className={`heatmap-cell ${selectedCell?.date === day && selectedCell.hour === hour ? "active" : ""}`} style={{ backgroundColor: `rgba(119, 226, 202, ${0.08 + cell.score / 125})` }} onClick={() => setSelectedCell(cell)} title={`${formatDate(day)} ${formatTime(`${String(hour).padStart(2, "0")}:00`)}: ${cell.score}/100 pressure, ${cell.events.length} events`} aria-label={`${formatDate(day)} at ${hour}:00, pressure ${cell.score} of 100`}><span>{cell.score}</span></button>; })}</div>)}</div></div><div className="heatmap-legend"><span>QUIETER</span><i /><span>BUSIER</span><small>Click a cell for the evidence behind its score.</small></div>{selectedCell && <div className="pressure-detail"><div><span className="mini-label">SELECTED HOUR</span><h3>{formatDate(selectedCell.date, { weekday: "long", day: "numeric", month: "long" })} · {formatTime(`${String(selectedCell.hour).padStart(2, "0")}:00`)}</h3><p>{selectedCell.recommendation}</p></div><div className="pressure-score">{selectedCell.score}<small>/100 pressure</small></div><div className="pressure-facts"><span>{selectedCell.events.length} listed events</span><span>{selectedCell.totalAudience} estimated attendees</span><span>{selectedCell.topTags.length ? selectedCell.topTags.join(" · ") : "No audience cluster"}</span></div><ul>{selectedCell.reasons.map((reason) => <li key={reason}><ChevronRight size={13} /> {reason}</li>)}</ul>{selectedCell.events.length > 0 && <div className="pressure-events">{selectedCell.events.map((event) => <Link key={event.id} href={`/events/${event.id}`}>{event.title} <ArrowRight size={13} /></Link>)}</div>}</div>}</section></>}
  </div>;
}
