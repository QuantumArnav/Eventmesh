"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Radar, Sparkles } from "lucide-react";
import { useCampus } from "@/app/providers";
import { LoadingState } from "@/components/loading";
import { IntelligenceExplanation } from "@/components/intelligence-explanation";
import { HowEventMeshWorks } from "@/components/how-eventmesh-works";
import { analyzeConflicts, suggestSlots } from "@/lib/conflict-engine";
import { addDays, formatDate, formatTime, todayInIsth } from "@/lib/dates";
import { detectDuplicates } from "@/lib/duplicate-detector";
import type { EventInput } from "@/lib/types";
import { rankVenues, type VenueData } from "@/lib/venue-matcher";

export default function Demo() {
  const { events, loading, error, refresh } = useCampus();
  const [venues, setVenues] = useState<VenueData[]>([]);
  useEffect(() => { fetch("/api/venues").then((response) => response.ok ? response.json() as Promise<VenueData[]> : []).then(setVenues).catch(() => setVenues([])); }, []);
  const scenario = useMemo(() => {
    const date = events.find((event) => event.title === "Lambda AI Workshop")?.date ?? addDays(todayInIsth(), 2);
    const candidate: EventInput = { title: "Lambda AI Workshop: Agents", organizer: "Lambda Club", description: "Hands-on AI agents workshop for the campus technical community.", date, startTime: "18:00", endTime: "19:30", venue: "LH3", category: "Workshop", tags: ["AI", "Programming", "Machine Learning"], registrationDeadline: addDays(date, -1), expectedAudience: 80 };
    return { candidate, conflicts: analyzeConflicts(candidate, events), duplicates: detectDuplicates(candidate, events), slots: suggestSlots(candidate, events), matches: rankVenues({ date, startTime: candidate.startTime, endTime: candidate.endTime, expectedAudience: 80, category: "Workshop", projector: true, audioSystem: true, preferredArea: "Academic zone" }, venues, events) };
  }, [events, venues]);
  return <div className="page-wrap demo-page"><div className="page-header"><div><div className="section-kicker"><Sparkles size={15} /> GUIDED PRODUCT DEMO</div><h1 className="page-title">One event. Every signal.</h1><p className="page-subtitle">A reproducible organizer scenario calculated from the local demo calendar and illustrative venue profiles.</p></div><Link href="/organizer/create" className="button button-primary">Try event creation <ArrowRight size={16} /></Link></div>
    <div className="notice">Current demonstration uses seeded campus-style event and venue data. These are not official IITH listings or booking records.</div>
    {error && <div className="notice error">{error} <button className="button button-secondary button-small" onClick={() => void refresh()}>Retry</button></div>}
    {loading ? <LoadingState /> : <><section className="panel demo-scenario"><span className="mini-label">PROPOSED SUBMISSION</span><h2>{scenario.candidate.title}</h2><p>{formatDate(scenario.candidate.date)} · {formatTime(scenario.candidate.startTime)}–{formatTime(scenario.candidate.endTime)} · {scenario.candidate.venue} · {scenario.candidate.expectedAudience} expected students</p><p>Lambda Club · AI, Programming, Machine Learning</p></section>
      <div className="demo-grid"><section className="panel"><span className="mini-label">01 · DUPLICATE DETECTION</span><h2>{scenario.duplicates.length} possible duplicate{scenario.duplicates.length === 1 ? "" : "s"}</h2>{scenario.duplicates.length ? scenario.duplicates.slice(0, 2).map((item) => <IntelligenceExplanation key={item.event.id} title={item.event.title} score={item.score} scoreLabel="similarity" reasons={item.reasons} tone="neutral" />) : <p>No listing crosses the duplicate threshold in this calendar.</p>}</section>
      <section className="panel"><span className="mini-label">02 · CONFLICT ANALYSIS</span><h2>{scenario.conflicts.length} overlapping event{scenario.conflicts.length === 1 ? "" : "s"}</h2>{scenario.conflicts.slice(0, 3).map((item) => <IntelligenceExplanation key={item.eventId} title={`${item.kind === "VENUE" ? "Venue collision" : "Audience overlap"}: ${item.eventTitle}`} score={item.score} scoreLabel="severity" reasons={item.reasons} tone="neutral" />)}{!scenario.conflicts.length && <p>No overlap found in listed events.</p>}</section>
      <section className="panel"><span className="mini-label">03 · BETTER TIME</span><h2>{scenario.slots.length ? "Lower-conflict alternatives" : "No alternative found"}</h2>{scenario.slots.slice(0, 3).map((slot) => <IntelligenceExplanation key={`${slot.date}-${slot.startTime}`} title={`${formatDate(slot.date)} · ${formatTime(slot.startTime)}–${formatTime(slot.endTime)}`} score={slot.score} scoreLabel="worst conflict" reasons={[slot.venueCollision ? "A listed venue collision remains" : "No listed venue collision"]} tone="neutral" />)}</section>
      <section className="panel"><span className="mini-label">04 · BETTER VENUE</span><h2>Ranked venue matches</h2>{scenario.matches.slice(0, 3).map((match) => <IntelligenceExplanation key={match.venue.id} title={match.venue.name} score={match.score} scoreLabel="fit" reasons={match.reasons.slice(0, 2)} warnings={match.warnings.slice(0, 2)} />)}{!venues.length && <p>Venue profiles unavailable; the rest of the demo remains usable.</p>}</section></div>
      <section className="panel demo-journey"><Radar size={22} /><h2>Continue the journey</h2><p>Open the organizer form and select “Load demo example” to review the same event, choose a venue, run conflict analysis, and decide whether to publish. Try Smart Search afterward to see the student view.</p><div><Link className="button button-primary" href="/organizer/create">Open organizer workflow <ArrowRight size={15} /></Link><Link className="button button-secondary" href="/discover">Try Smart Search <ArrowRight size={15} /></Link></div></section><HowEventMeshWorks /></>}
  </div>;
}
