"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, Layers3, Plus, Radar, Users } from "lucide-react";
import { useCampus } from "@/app/providers";
import { LoadingState } from "@/components/loading";
import { analyzeConflicts } from "@/lib/conflict-engine";
import { formatDate, todayInIsth } from "@/lib/dates";

export default function OrganizerDashboard() {
  const { events, loading, error, refresh } = useCampus();
  const upcoming = events.filter((event) => event.date >= todayInIsth());
  const activeConflicts = upcoming.filter((event) => analyzeConflicts(event, upcoming).some((item) => item.score >= 60));
  const organizers = new Set(upcoming.map((event) => event.organizer));
  const categories = new Set(upcoming.map((event) => event.category));
  const categoryCounts = [...categories].map((category) => ({ category, count: upcoming.filter((event) => event.category === category).length })).sort((a, b) => b.count - a.count);
  return <div className="page-wrap"><div className="page-header"><div><div className="section-kicker"><Radar size={15} /> EVENT INTELLIGENCE / ORGANIZER VIEW</div><h1 className="page-title">Schedule smarter.</h1><p className="page-subtitle">Plan around the entire campus, reach the right people, and spot clashes before publishing.</p></div><Link href="/organizer/create" className="button button-primary"><Plus size={16} /> Create event</Link></div>
    {error && <div className="notice error" role="alert">{error} <button className="button button-small button-secondary" onClick={() => void refresh()}>Retry</button></div>}
    {loading ? <LoadingState label="Loading organizer dashboard…" /> : <><div className="stat-grid"><div className="stat-card"><div>Upcoming events <CalendarDays size={17} /></div><strong>{upcoming.length}</strong><small>Across the demo calendar</small></div><div className="stat-card"><div>Potential conflicts <Radar size={17} /></div><strong>{activeConflicts.length}</strong><small>Events with a high-scoring clash</small></div><div className="stat-card"><div>Organizers <Users size={17} /></div><strong>{organizers.size}</strong><small>Campus groups in demo data</small></div><div className="stat-card"><div>Categories <Layers3 size={17} /></div><strong>{categories.size}</strong><small>Ways to explore campus life</small></div></div>
      <div className="dashboard-grid"><section className="panel table-panel"><div className="panel-heading"><h2>Upcoming across campus</h2><Link href="/discover">Explore all <ArrowRight size={13} style={{ display: "inline" }} /></Link></div><table className="event-table"><thead><tr><th>Event</th><th>Date</th><th>Venue</th><th>Signal</th></tr></thead><tbody>{upcoming.slice(0, 8).map((event) => { const score = analyzeConflicts(event, upcoming)[0]?.score ?? 0; return <tr key={event.id}><td><Link href={`/organizer/events/${event.id}/conflicts`}><strong>{event.title}</strong><span>{event.organizer}</span></Link></td><td>{formatDate(event.date)}</td><td>{event.venue}</td><td><span className={`status-dot ${score < 60 ? "clear" : ""}`} />{score >= 60 ? `${score} / 100` : "Clear"}</td></tr>; })}</tbody></table></section><div><section className="panel aside-panel"><div className="panel-heading"><h2>Event mix</h2><span className="mini-label">DEMO</span></div><div className="category-bars">{categoryCounts.map(({ category, count }) => <div className="bar-row" key={category}><div><span>{category}</span><strong>{count}</strong></div><div className="bar-track"><div className="bar-fill" style={{ width: `${Math.round(100 * count / Math.max(upcoming.length, 1))}%` }} /></div></div>)}</div></section><div className="dashboard-callout"><Radar size={24} /><h3>Publish with confidence.</h3><p>Run conflict intelligence on your proposed event and compare lower-conflict alternatives before it reaches campus.</p><Link className="button button-primary button-small" href="/organizer/create">Plan an event <ArrowRight size={15} /></Link></div></div></div></>}
  </div>;
}
