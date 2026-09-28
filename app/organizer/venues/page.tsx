"use client";

import Link from "next/link";
import { useState } from "react";
import { useCampus } from "@/app/providers";
import { LoadingState } from "@/components/loading";
import { VenueAdvisor } from "@/components/venue-advisor";
import { addDays, todayInIsth } from "@/lib/dates";
import { CATEGORIES, type Category } from "@/lib/types";

export default function VenueIntelligencePage() {
  const { events, loading, error } = useCampus();
  const [audience, setAudience] = useState("80");
  const [category, setCategory] = useState<Category>("Workshop");
  const [date, setDate] = useState(() => addDays(todayInIsth(), 2));
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("19:30");
  const request = { date, startTime, endTime, expectedAudience: Number(audience), category };

  return <div className="page-wrap organizer-intelligence-page">
    <nav className="organizer-breadcrumb" aria-label="Breadcrumb"><Link href="/">EventMesh</Link><span>/</span><Link href="/organizer">Organizer</Link><span>/</span><span aria-current="page">Venues</span></nav>
    <div className="page-header"><div><div className="section-kicker">VENUE INTELLIGENCE</div><h1 className="page-title">Find the right room.</h1><p className="page-subtitle">Compare the rooms in the EventMesh calendar before choosing a venue.</p></div></div>
    <section className="panel intelligence-form venue-request-form" aria-label="Event requirements"><div className="panel-heading"><div><span className="mini-label">EVENT REQUIREMENTS</span><h2>What does your event need?</h2></div></div>
      <div className="form-grid">
        <div className="field"><label htmlFor="venue-audience">Expected audience</label><input id="venue-audience" type="number" min="1" max="10000" value={audience} onChange={(event) => setAudience(event.target.value)} /></div>
        <div className="field"><label htmlFor="venue-category">Category / event type</label><select id="venue-category" value={category} onChange={(event) => setCategory(event.target.value as Category)}>{CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></div>
        <div className="field"><label htmlFor="venue-date">Date</label><input id="venue-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} /></div>
        <div className="field"><label htmlFor="venue-start">Start time</label><input id="venue-start" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} /></div>
        <div className="field"><label htmlFor="venue-end">End time</label><input id="venue-end" type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} /></div>
      </div>
      <p className="intelligence-footnote">Facility requirements and preferred area are below. Scores update as you change the request.</p>
    </section>
    {error && <div className="notice error" role="alert">{error}</div>}
    {loading ? <LoadingState label="Loading venue intelligence…" /> : <VenueAdvisor variant="full" request={request} events={events} />}
    <p className="intelligence-footnote">Venue profiles and listed availability are illustrative demo data, not official IIT Hyderabad booking status. Confirm real capacity, facilities, and reservations with campus staff.</p>
  </div>;
}
