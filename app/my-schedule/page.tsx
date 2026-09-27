"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, Trash2 } from "lucide-react";
import { useCampus } from "@/app/providers";
import { EmptyState, LoadingState } from "@/components/loading";
import { formatDate, formatTime } from "@/lib/dates";
import { overlapMinutes } from "@/lib/conflict-engine";

export default function MySchedule() {
  const { events, savedEventIds, toggleSaved, loading, error } = useCampus();
  const saved = events.filter((event) => savedEventIds.includes(event.id)).sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  const days = [...new Set(saved.map((event) => event.date))];
  const conflicts = saved.filter((event) => saved.some((other) => other.id !== event.id && overlapMinutes(event, other) > 0));
  return <div className="page-wrap"><div className="page-header"><div><div className="section-kicker"><CalendarDays size={15} /> YOUR CAMPUS, YOUR TIME</div><h1 className="page-title">My schedule.</h1><p className="page-subtitle">A clearer view of what you’ve saved and where your plans collide.</p></div><Link href="/discover" className="button button-primary">Find more events <ArrowRight size={16} /></Link></div>
    {error && <div className="notice error" role="alert">{error}</div>}
    {loading ? <LoadingState /> : saved.length === 0 ? <EmptyState title="Your evening is wide open" description="Save events from Discover and they’ll appear here in a simple timeline." action={<Link href="/discover" className="button button-primary">Explore events</Link>} /> : <><div className="schedule-summary"><span className="summary-chip"><strong>{saved.length}</strong> saved events</span><span className="summary-chip"><strong>{days.length}</strong> event days</span><span className="summary-chip"><strong>{Math.floor(conflicts.length / 2)}</strong> schedule overlaps</span></div><div className="schedule-list">{days.map((day) => <section key={day}><h2 className="schedule-day">{formatDate(day, { weekday: "long", month: "long" })}</h2>{saved.filter((event) => event.date === day).map((event) => { const clashes = saved.filter((other) => other.id !== event.id && overlapMinutes(event, other) > 0); return <div className="timeline-item" key={event.id}><span className="timeline-time">{formatTime(event.startTime)}</span><span className="timeline-spine" /><div className={`timeline-content ${clashes.length ? "overlap" : ""}`}><div><Link href={`/events/${event.id}`}><h3>{event.title}</h3></Link><p>{event.venue} · {formatTime(event.startTime)} – {formatTime(event.endTime)}</p>{clashes.length > 0 && <div className="timeline-warning">Overlaps with {clashes.map((item) => item.title).join(", ")}</div>}</div><button type="button" className="icon-button" aria-label={`Remove ${event.title} from schedule`} onClick={() => void toggleSaved(event.id)}><Trash2 size={15} /></button></div></div>; })}</section>)}</div></>}
  </div>;
}
