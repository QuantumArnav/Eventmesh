"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCampus } from "@/app/providers";
import { EmptyState, LoadingState } from "@/components/loading";
import { analyzeConflicts, suggestSlots } from "@/lib/conflict-engine";
import { formatDate, formatTime } from "@/lib/dates";

export default function EventConflicts() {
  const params = useParams<{ id: string }>();
  const { events, loading } = useCampus();
  if (loading) return <div className="page-wrap"><LoadingState /></div>;
  const event = events.find((item) => item.id === params.id);
  if (!event) return <div className="page-wrap"><EmptyState title="Event not found" description="Try an event from the organizer dashboard." action={<Link href="/organizer" className="button button-primary">Organizer dashboard</Link>} /></div>;
  const conflicts = analyzeConflicts(event, events);
  const suggestions = suggestSlots(event, events);
  const venueConflicts = conflicts.filter((conflict) => conflict.kind === "VENUE").length;
  const highest = conflicts[0]?.score ?? 0;
  return <div className="page-wrap conflict-page">
    <Link href="/organizer" className="back-link">← Organizer overview</Link>
    <div className="page-header"><div><span className="mini-label">CONFLICT INTELLIGENCE / LOCAL CALENDAR</span><h1 className="page-title">{event.title}</h1><p className="page-subtitle">{formatDate(event.date)} · {formatTime(event.startTime)}–{formatTime(event.endTime)} · {event.venue}</p></div><Link href={`/events/${event.id}`} className="button button-secondary">View event →</Link></div>
    <div className="conflict-summary"><div><span>OVERLAPPING EVENTS</span><strong>{conflicts.length}</strong></div><div><span>VENUE COLLISIONS</span><strong>{venueConflicts}</strong></div><div><span>HIGHEST RISK</span><strong>{highest}<small>/100</small></strong></div></div>
    <div className="conflict-workspace">
      <section className="conflict-report"><div className="report-heading"><div><span className="mini-label">THE EVIDENCE</span><h2>Detected overlaps</h2></div><p>Scores use listed event times, venues, categories, and audience tags.</p></div>
        {conflicts.length ? <div>{conflicts.map((conflict, index) => <article className="conflict-report-row" key={conflict.eventId}>
          <div className="conflict-report-index">{String(index + 1).padStart(2, "0")}</div>
          <div><span className={`conflict-kind ${conflict.kind === "VENUE" ? "critical" : ""}`}>{conflict.kind === "VENUE" ? "VENUE COLLISION" : "AUDIENCE OVERLAP"} / {conflict.severity}</span><h3>{conflict.eventTitle}</h3><p>{conflict.eventTime} · {conflict.eventVenue}</p><ul>{conflict.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul></div>
          <strong>{conflict.score}<small>/100</small></strong>
        </article>)}</div> : <p className="report-empty">No overlapping event appears in the local calendar.</p>}
      </section>
      <aside className="conflict-alternatives"><span className="mini-label">OPTIONS</span><h2>Lower-conflict times</h2><p>Ranked by the same conflict engine. A lower conflict score is better; venue collisions are avoided first.</p>
        <ol>{suggestions.map((slot, index) => <li key={`${slot.date}-${slot.startTime}`}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{formatDate(slot.date)}</strong><b>{formatTime(slot.startTime)}–{formatTime(slot.endTime)}</b><small>{slot.venueCollision ? "Listed venue collision" : "No listed venue collision"}</small></div><strong>{slot.score}<small>/100</small></strong></li>)}</ol>
        <p className="workflow-note">Published events are not editable in this demo. Create a new listing to use a different time.</p>
      </aside>
    </div>
  </div>;
}
