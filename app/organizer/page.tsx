"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, Layers3, Plus, Radar, Sparkles, Users } from "lucide-react";
import { useCampus } from "@/app/providers";
import { LoadingState } from "@/components/loading";
import { analyzeConflict, analyzeConflicts } from "@/lib/conflict-engine";
import { addDays, formatDate, todayInIsth } from "@/lib/dates";
import { measureEventPressure } from "@/lib/event-pressure";
import { assessReadiness } from "@/lib/event-readiness";

export default function OrganizerDashboard() {
  const { events, loading, error, refresh } = useCampus();
  const upcoming = events.filter((event) => event.date >= todayInIsth());
  const activeConflicts = upcoming.filter((event) => analyzeConflicts(event, upcoming).some((item) => item.score >= 60));
  const organizers = new Set(upcoming.map((event) => event.organizer));
  const categories = [...new Set(upcoming.map((event) => event.category))];
  const categoryCounts = categories.map((category) => ({ category, count: upcoming.filter((event) => event.category === category).length })).sort((a, b) => b.count - a.count);
  const readiness = upcoming.length ? Math.round(upcoming.reduce((sum, event) => sum + assessReadiness(event).score, 0) / upcoming.length) : 0;
  const nextDates = Array.from({ length: 7 }, (_, index) => addDays(todayInIsth(), index));
  const pressure = nextDates.map((date) => ({ date, cells: [16, 17, 18, 19, 20, 21].map((hour) => measureEventPressure(date, hour, upcoming)) }));
  const quietHours = pressure.flatMap((day) => day.cells).filter((cell) => cell.score <= 25).length;
  const audiencePairs = upcoming.flatMap((left, i) => upcoming.slice(i + 1).flatMap((right) => {
    const conflict = analyzeConflict(left, right);
    return conflict?.kind === "AUDIENCE" && conflict.score >= 25 ? [{ left, right, conflict }] : [];
  })).sort((a, b) => b.conflict.score - a.conflict.score).slice(0, 3);

  return <div className="page-wrap"><div className="page-header"><div><div className="section-kicker"><Radar size={15} /> EVENT INTELLIGENCE / ORGANIZER VIEW</div><h1 className="page-title">Schedule smarter.</h1><p className="page-subtitle">Plan around campus demand, reach the right people, and spot clashes before publishing.</p></div><Link href="/organizer/create" className="button button-primary"><Plus size={16} /> Create event</Link></div>
    {error && <div className="notice error" role="alert">{error} <button className="button button-small button-secondary" onClick={() => void refresh()}>Retry</button></div>}
    {loading ? <LoadingState label="Loading organizer dashboard…" /> : <><div className="stat-grid intelligence-stats"><div className="stat-card"><div>Upcoming events <CalendarDays size={17} /></div><strong>{upcoming.length}</strong><small>In the local calendar</small></div><div className="stat-card"><div>High-conflict events <Radar size={17} /></div><strong>{activeConflicts.length}</strong><small>Score at least 60 / 100</small></div><div className="stat-card"><div>Lower-pressure hours <Sparkles size={17} /></div><strong>{quietHours}</strong><small>Of 42 visible slots</small></div><div className="stat-card"><div>Average readiness <Layers3 size={17} /></div><strong>{readiness}%</strong><small>From event fields</small></div><div className="stat-card"><div>Leading category <Layers3 size={17} /></div><strong className="stat-word">{categoryCounts[0]?.category ?? "—"}</strong><small>{categoryCounts[0]?.count ?? 0} listed events</small></div><div className="stat-card"><div>Organizers <Users size={17} /></div><strong>{organizers.size}</strong><small>In the local network</small></div></div>
      <div className="dashboard-grid"><section className="panel table-panel"><div className="panel-heading"><div><span className="mini-label">CURRENT LOCAL CALENDAR</span><h2>Upcoming across campus</h2></div><Link href="/discover">Explore all <ArrowRight size={13} style={{ display: "inline" }} /></Link></div><table className="event-table"><thead><tr><th>Event</th><th>Date</th><th>Venue</th><th>Signal</th></tr></thead><tbody>{upcoming.slice(0, 8).map((event) => { const score = analyzeConflicts(event, upcoming)[0]?.score ?? 0; return <tr key={event.id}><td><Link href={`/organizer/events/${event.id}/conflicts`}><strong>{event.title}</strong><span>{event.organizer}</span></Link></td><td>{formatDate(event.date)}</td><td>{event.venue}</td><td><span className={`status-dot ${score < 60 ? "clear" : ""}`} />{score >= 60 ? `${score} / 100` : "Clear"}</td></tr>; })}</tbody></table></section><div><section className="panel aside-panel"><div className="panel-heading"><h2>Event mix</h2><span className="mini-label">LOCAL</span></div><div className="category-bars">{categoryCounts.map(({ category, count }) => <div className="bar-row" key={category}><div><span>{category}</span><strong>{count}</strong></div><div className="bar-track"><div className="bar-fill" style={{ width: `${Math.round(100 * count / Math.max(upcoming.length, 1))}%` }} /></div></div>)}</div></section><div className="dashboard-callout"><Radar size={24} /><h3>Find a better time.</h3><p>Compare audience, venue, and campus pressure for the next seven days.</p><Link className="button button-primary button-small" href="/organizer/scheduling">Open Scheduling Intelligence <ArrowRight size={15} /></Link></div></div></div>
      <div className="dashboard-grid" style={{ marginTop: 18 }}><section className="panel aside-panel"><div className="panel-heading"><div><span className="mini-label">WEEKLY EVENT PRESSURE</span><h2>Busy hours ahead</h2></div><Link href="/organizer/scheduling">Open heatmap →</Link></div><div className="pressure-bars">{pressure.map((day) => { const peak = Math.max(...day.cells.map((cell) => cell.score)); return <div key={day.date}><div><span>{formatDate(day.date, { weekday: "short", day: "numeric" })}</span><strong>{peak}/100</strong></div><div className="bar-track"><div className="bar-fill" style={{ width: `${peak}%` }} /></div></div>; })}</div><p className="intelligence-footnote">Peak hourly pressure per day, calculated from listed events and estimated audiences.</p></section><section className="panel aside-panel"><div className="panel-heading"><div><span className="mini-label">AUDIENCE OVERLAP</span><h2>Communities competing for time</h2></div><Link href="/event-mesh">Explore mesh →</Link></div>{audiencePairs.length ? <div className="audience-pairs">{audiencePairs.map(({ left, right, conflict }) => <div key={`${left.id}-${right.id}`}><span>{conflict.score}/100</span><div><strong>{left.title} ↔ {right.title}</strong><small>{conflict.reasons.join(" · ")}</small></div></div>)}</div> : <p className="intelligence-footnote">No high audience overlap found in upcoming demo events.</p>}</section></div></>}
  </div>;
}
