"use client";

import { useEffect, useMemo, useState } from "react";
import type { EventData } from "@/lib/types";
import { rankVenues, type VenueData, type VenueRequest } from "@/lib/venue-matcher";
import { IntelligenceExplanation } from "@/components/intelligence-explanation";

export function VenueAdvisor({ request, events, onSelect }: { request: VenueRequest; events: EventData[]; onSelect: (venue: string) => void }) {
  const [venues, setVenues] = useState<VenueData[]>([]);
  const [error, setError] = useState("");
  const [projector, setProjector] = useState(false);
  const [audioSystem, setAudioSystem] = useState(false);
  const [stage, setStage] = useState(false);
  const [accessible, setAccessible] = useState(false);
  const [area, setArea] = useState("Any");
  useEffect(() => {
    let active = true;
    fetch("/api/venues").then(async (response) => {
      if (!response.ok) throw new Error("Venue profiles are unavailable.");
      return response.json() as Promise<VenueData[]>;
    }).then((data) => { if (active) setVenues(data); }).catch(() => { if (active) setError("Venue profiles are unavailable. You can still enter a venue manually."); });
    return () => { active = false; };
  }, []);
  const matches = useMemo(() => request.date && request.startTime && request.endTime && request.expectedAudience > 0 && request.startTime < request.endTime
    ? rankVenues({ ...request, projector, audioSystem, stage, accessible, preferredArea: area }, venues, events).slice(0, 3) : [],
    [request, projector, audioSystem, stage, accessible, area, venues, events]);

  return <section className="venue-advisor" aria-label="Smart venue recommendations">
    <div className="panel-heading"><div><span className="mini-label">SMART VENUE INTELLIGENCE</span><h3>Find a better fit</h3></div></div>
    <p>Ranked against illustrative venue profiles and events in this demo calendar. Capacity, facilities and real bookings must be verified with campus staff.</p>
    <div className="venue-controls">
      <label><input type="checkbox" checked={projector} onChange={(event) => setProjector(event.target.checked)} /> Projector</label>
      <label><input type="checkbox" checked={audioSystem} onChange={(event) => setAudioSystem(event.target.checked)} /> Audio system</label>
      <label><input type="checkbox" checked={stage} onChange={(event) => setStage(event.target.checked)} /> Stage</label>
      <label><input type="checkbox" checked={accessible} onChange={(event) => setAccessible(event.target.checked)} /> Accessible entry</label>
      <label>Preferred area <select value={area} onChange={(event) => setArea(event.target.value)}><option>Any</option><option>Academic zone</option><option>Central zone</option><option>Sports zone</option><option>Residential zone</option></select></label>
    </div>
    {error && <div className="notice error">{error}</div>}
    {!request.date || !request.expectedAudience ? <p>Set date, time and expected audience to see ranked rooms.</p> : <div className="venue-results">{matches.map((match, index) => <article className="venue-match" key={match.venue.id}>
      <div className="venue-match-head"><strong>{index + 1}. {match.venue.name}</strong><span>{match.score}/100 match</span></div>
      <p>{match.venue.type} · about {match.venue.capacity} seats · {match.venue.area}</p>
      <IntelligenceExplanation title="Why this venue?" reasons={match.reasons.slice(0, 3)} warnings={match.warnings.slice(0, 3)} />
      <button className="button button-secondary button-small" type="button" onClick={() => onSelect(match.venue.name)}>Use this venue</button>
    </article>)}</div>}
  </section>;
}
