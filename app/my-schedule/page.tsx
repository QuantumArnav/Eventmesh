"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CalendarDays, Download, Trash2 } from "lucide-react";
import { useCampus } from "@/app/providers";
import { EmptyState, LoadingState } from "@/components/loading";
import { formatDate, formatTime } from "@/lib/dates";
import { overlapMinutes } from "@/lib/conflict-engine";
import { optimizeSchedule, type Preference } from "@/lib/schedule-optimizer";
import { downloadIcs } from "@/lib/ics";

const labels: Record<Preference, string> = { INTERESTED: "Interested", SAVED: "Saved", MUST_ATTEND: "Must Attend" };

export default function MySchedule() {
  const { events, student, savedEventIds, preferences, toggleSaved, setPreference, loading, error } = useCampus();
  const [showPlan, setShowPlan] = useState(false);
  const saved = events.filter((event) => savedEventIds.includes(event.id)).sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  const days = [...new Set(saved.map((event) => event.date))];
  const overlapPairs = saved.reduce((count, event, index) => count + saved.slice(index + 1).filter((other) => overlapMinutes(event, other) > 0).length, 0);
  const plan = student ? optimizeSchedule(saved.map((event) => ({ event, preference: preferences[event.id] ?? "SAVED" })), student) : null;

  return <div className="page-wrap"><div className="page-header"><div><div className="section-kicker"><CalendarDays size={15} /> YOUR CAMPUS, YOUR TIME</div><h1 className="page-title">My schedule.</h1><p className="page-subtitle">Your saved events, arranged by day. Mark priorities to find a plan without overlaps.</p></div><Link href="/discover" className="button button-secondary">Find more events <ArrowRight size={16} /></Link></div>
    {error && <div className="notice error" role="alert">{error}</div>}
    {loading ? <LoadingState /> : saved.length === 0 ? <EmptyState title="No saved events." description="Browse events and save a few to build your schedule." action={<Link href="/discover" className="button button-secondary">Browse events →</Link>} /> : <><div className="schedule-summary"><span className="summary-chip"><strong>{saved.length}</strong> tracked events</span><span className="summary-chip"><strong>{days.length}</strong> event days</span><span className="summary-chip"><strong>{overlapPairs}</strong> schedule overlaps</span><button className="button button-primary" type="button" onClick={() => setShowPlan((current) => !current)}>{showPlan ? "Hide my plan" : "Build my plan"}</button><button className="button button-secondary" type="button" onClick={() => downloadIcs(showPlan && plan ? plan.selected.map((item) => item.event) : saved, "eventmesh-my-schedule.ics")}><Download size={15} /> Export {showPlan ? "my plan" : "schedule"}</button></div>
      {showPlan && plan && <section className="panel plan-panel"><div className="panel-heading"><div><span className="mini-label">WEIGHTED INTERVAL SCHEDULING</span><h2>Your best non-conflicting plan</h2></div><span className="plan-score">{plan.selected.length} selected · {plan.skipped.length} skipped</span></div><p className="plan-intro">EventMesh maximizes total relevance plus your priority boosts. Must Attend adds 80 points; Saved adds 20. Touching event times are compatible.</p><div className="plan-columns"><div><h3>Recommended itinerary</h3>{plan.selected.map((item) => <div className="plan-row" key={item.event.id}><span className="plan-time">{formatDate(item.event.date)}<strong>{formatTime(item.event.startTime)}</strong></span><div><Link href={`/events/${item.event.id}`}>{item.event.title}</Link><small>{item.reason}</small></div><span className="plan-utility">{item.utility} pts</span></div>)}</div><div><h3>Skipped to avoid clashes</h3>{plan.skipped.length ? plan.skipped.map((item) => <div className="plan-row skipped" key={item.event.id}><span className="plan-time">{formatTime(item.event.startTime)}</span><div><Link href={`/events/${item.event.id}`}>{item.event.title}</Link><small>Conflicts with {item.conflictsWith.join(", ") || "a higher-value combination"}. {item.reason}</small></div></div>) : <p className="plan-empty">No events need to be skipped. Your choices already fit together.</p>}</div></div></section>}
      <div className="schedule-list">{days.map((day) => <section key={day}><h2 className="schedule-day">{formatDate(day, { weekday: "long", month: "long" })}</h2>{saved.filter((event) => event.date === day).map((event) => { const clashes = saved.filter((other) => other.id !== event.id && overlapMinutes(event, other) > 0); return <div className="timeline-item" key={event.id}><span className="timeline-time">{formatTime(event.startTime)}</span><span className="timeline-spine" /><div className={`timeline-content ${clashes.length ? "overlap" : ""}`}><div><Link href={`/events/${event.id}`}><h3>{event.title}</h3></Link><p>{event.venue} · {formatTime(event.startTime)} – {formatTime(event.endTime)}</p>{clashes.length > 0 && <div className="timeline-warning">Overlaps with {clashes.map((item) => item.title).join(", ")}</div>}<div className="preference-group" role="group" aria-label={`Priority for ${event.title}`}>{(Object.keys(labels) as Preference[]).map((value) => <button key={value} className={preferences[event.id] === value ? "active" : ""} onClick={() => void setPreference(event.id, value)}>{labels[value]}</button>)}</div></div><button type="button" className="icon-button" aria-label={`Remove ${event.title} from schedule`} onClick={() => void toggleSaved(event.id)}><Trash2 size={15} /></button></div></div>; })}</section>)}</div></>}
  </div>;
}
