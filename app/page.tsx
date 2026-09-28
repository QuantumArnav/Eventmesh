"use client";

import Link from "next/link";
import { useCampus } from "@/app/providers";
import { formatDate, formatTime, todayInIsth } from "@/lib/dates";

const themes = [
  { label: "Discover", description: "Find events across campus in one readable calendar." },
  { label: "Coordinate", description: "See room and audience conflicts before an event goes live." },
  { label: "Optimize", description: "Compare time slots and venues with reasons attached." },
];

export default function Home() {
  const { events, loading } = useCampus();
  const upcoming = events.filter((event) => event.date >= todayInIsth()).sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)).slice(0, 4);
  return <div className="page-wrap landing-page">
    <section className="editorial-hero">
      <div className="editorial-hero-main">
        <p className="mini-label">EVENTMESH / IIT HYDERABAD</p>
        <h1>Everything<br />happening<br /><em>on campus.</em></h1>
        <p className="editorial-hero-subtitle">Without the noise. Find events that fit your interests and your evening.</p>
        <div className="hero-actions"><Link href="/discover" className="button button-primary">Explore events →</Link><Link href="/organizer" className="text-link">For organizers: schedule smarter →</Link></div>
      </div>
      <div className="editorial-index" aria-label="Upcoming events in the local demo calendar">
        <div className="editorial-index-head"><span className="mini-label">UPCOMING AT IITH</span><span>LOCAL DEMO CALENDAR</span></div>
        {loading ? <p>Loading upcoming events…</p> : upcoming.length ? upcoming.map((event) => <Link href={`/events/${event.id}`} className="editorial-index-row" key={event.id}>
          <span>{formatDate(event.date, { day: "numeric", month: "short" })}<strong>{formatTime(event.startTime)}</strong></span>
          <span><strong>{event.title}</strong><small>{event.organizer} · {event.venue}</small></span><span aria-hidden="true">↗</span>
        </Link>) : <p>No upcoming events in this local calendar.</p>}
        <Link href="/discover" className="editorial-index-footer">View the complete event guide →</Link>
      </div>
    </section>
    <section className="editorial-principles" aria-label="What EventMesh does">
      {themes.map((theme, index) => <div key={theme.label}><span>0{index + 1}</span><h2>{theme.label}</h2><p>{theme.description}</p></div>)}
    </section>
    <div className="editorial-footer-line"><span>One campus. One connected event calendar.</span><Link href="/demo">How EventMesh works →</Link></div>
  </div>;
}
