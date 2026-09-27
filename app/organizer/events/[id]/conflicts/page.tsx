"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarDays, Radar } from "lucide-react";
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
  return <div className="page-wrap"><Link href="/organizer" className="back-link"><ArrowLeft size={15} /> Organizer dashboard</Link><div className="page-header"><div><div className="section-kicker"><Radar size={15} /> CONFLICT INTELLIGENCE</div><h1 className="page-title">{event.title}</h1><p className="page-subtitle">{formatDate(event.date)} · {formatTime(event.startTime)} – {formatTime(event.endTime)} · {event.venue}</p></div><Link href={`/events/${event.id}`} className="button button-secondary">View event</Link></div><div className="dashboard-grid"><div className="panel aside-panel"><h2>Detected overlaps</h2><p className="form-intro">Calculated from event time, venue, category, tags, and expected audience. Scores are estimates from demo data.</p>{conflicts.length ? <div className="conflict-list">{conflicts.map((conflict) => <div className={`conflict-card ${conflict.kind === "VENUE" ? "venue" : ""}`} key={conflict.eventId}><div className="conflict-top"><span>{conflict.kind === "VENUE" ? "Venue conflict" : "Audience overlap"} · {conflict.severity}</span><strong>{conflict.score}/100</strong></div><h4>{conflict.eventTitle}</h4><p>{conflict.eventTime} · {conflict.eventVenue}</p><ul>{conflict.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul></div>)}</div> : <div className="notice">No overlapping events in the demo calendar.</div>}</div><div className="panel aside-panel"><h2>Smarter time slots</h2><p className="form-intro">These options are ranked by the same conflict engine, with venue collisions avoided first.</p><div style={{ display: "grid", gap: 8 }}>{suggestions.map((slot) => <div className="slot-button" key={`${slot.date}-${slot.startTime}`}><strong><CalendarDays size={13} style={{ display: "inline", marginRight: 5 }} /> {formatDate(slot.date)}</strong><strong>{formatTime(slot.startTime)} – {formatTime(slot.endTime)}</strong><small>{slot.score}/100 conflict score · {slot.venueCollision ? "venue busy" : "no venue collision"}</small></div>)}</div><p className="workflow-note">Published events are not editable in this hackathon MVP. Create a new event to use a different slot.</p></div></div></div>;
}
