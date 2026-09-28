"use client";

import Link from "next/link";
import { useCampus } from "@/app/providers";
import { LoadingState } from "@/components/loading";
import { EventPressureHeatmap } from "@/components/event-pressure-heatmap";
import { formatTime, todayInIsth } from "@/lib/dates";
import { getOrganizerIntelligence } from "@/lib/organizer-intelligence";

export default function CampusIntelligencePage() {
  const { events, loading, error } = useCampus();
  const { upcoming, eventsThisWeek, activeConflicts, peakHours, quietHours, readiness, audiencePairs, venueCounts, categoryCounts } = getOrganizerIntelligence(events, todayInIsth());
  const peak = peakHours[0];

  return <div className="page-wrap organizer-intelligence-page">
    <nav className="organizer-breadcrumb" aria-label="Breadcrumb"><Link href="/">EventMesh</Link><span>/</span><Link href="/organizer">Organizer</Link><span>/</span><span aria-current="page">Intelligence</span></nav>
    <div className="page-header"><div><div className="section-kicker">CAMPUS EVENT INTELLIGENCE</div><h1 className="page-title">Understand campus activity.</h1><p className="page-subtitle">See when and where listed events are concentrated, and which audiences overlap.</p></div></div>
    {error && <div className="notice error" role="alert">{error}</div>}
    {loading ? <LoadingState label="Loading campus intelligence…" /> : <>
      <div className="stat-grid campus-intelligence-stats" aria-label="Campus intelligence summary">
        <div className="stat-card"><div>Events this week</div><strong>{eventsThisWeek.length}</strong><small>Next seven days</small></div>
        <div className="stat-card"><div>High-conflict events</div><strong>{activeConflicts.length}</strong><small>Score at least 60 / 100</small></div>
        <div className="stat-card"><div>Peak hour</div><strong className="stat-word">{peak?.count ? formatTime(`${String(peak.hour).padStart(2, "0")}:00`) : "—"}</strong><small>{peak?.count ?? 0} active listings across the week</small></div>
        <div className="stat-card"><div>Lower-pressure slots</div><strong>{quietHours}</strong><small>Of 42 visible hours</small></div>
        <div className="stat-card"><div>Average readiness</div><strong>{readiness}%</strong><small>From {upcoming.length} upcoming listings</small></div>
      </div>
      <EventPressureHeatmap events={events} />
      <div className="campus-intelligence-grid">
        <section className="panel aside-panel"><div className="panel-heading"><div><span className="mini-label">AUDIENCE OVERLAP</span><h2>Communities competing for time</h2></div></div>{audiencePairs.length ? <div className="audience-pairs">{audiencePairs.map(({ left, right, conflict }) => <div key={`${left.id}-${right.id}`}><span>{conflict.score}/100</span><div><strong>{left.title} ↔ {right.title}</strong><small>{conflict.reasons.join(" · ")}</small></div></div>)}</div> : <p className="intelligence-footnote">No strong audience overlap found in upcoming EventMesh listings.</p>}</section>
        <section className="panel aside-panel"><div className="panel-heading"><div><span className="mini-label">VENUE PRESSURE</span><h2>Where listings concentrate</h2></div><Link href="/organizer/venues">Match a room →</Link></div>{venueCounts.length ? <div className="category-bars">{venueCounts.map(({ venue, count }) => <div className="bar-row" key={venue}><div><span>{venue}</span><strong>{count} listing{count === 1 ? "" : "s"}</strong></div><div className="bar-track"><div className="bar-fill" style={{ width: `${Math.round(100 * count / Math.max(upcoming.length, 1))}%` }} /></div></div>)}</div> : <p className="intelligence-footnote">No upcoming venue listings.</p>}<p className="intelligence-footnote">Listing counts are not official bookings or utilization.</p></section>
        <section className="panel aside-panel"><div className="panel-heading"><div><span className="mini-label">EVENT MIX</span><h2>Categories in the calendar</h2></div></div>{categoryCounts.length ? <div className="category-bars">{categoryCounts.map(({ category, count }) => <div className="bar-row" key={category}><div><span>{category}</span><strong>{count}</strong></div><div className="bar-track"><div className="bar-fill" style={{ width: `${Math.round(100 * count / Math.max(upcoming.length, 1))}%` }} /></div></div>)}</div> : <p className="intelligence-footnote">No upcoming events in the local calendar.</p>}</section>
      </div>
      <p className="intelligence-footnote">All figures use current EventMesh listings and illustrative demo audience estimates. They do not represent official IIT Hyderabad booking or attendance data.</p>
    </>}
  </div>;
}
