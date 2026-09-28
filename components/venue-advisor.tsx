"use client";

import { useEffect, useMemo, useState } from "react";
import type { EventData } from "@/lib/types";
import { rankVenues, type VenueData, type VenueRequest } from "@/lib/venue-matcher";
import { IntelligenceExplanation } from "@/components/intelligence-explanation";

type Props = {
  request: VenueRequest;
  events: EventData[];
  onSelect?: (venue: string) => void;
  variant?: "compact" | "full";
};

export function VenueAdvisor({ request, events, onSelect, variant = "compact" }: Props) {
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
    }).then((data) => { if (active) setVenues(data); })
      .catch(() => { if (active) setError("Venue profiles are unavailable. Try refreshing the page."); });
    return () => { active = false; };
  }, []);

  const validRequest = Boolean(request.date && request.startTime && request.endTime && request.expectedAudience > 0 && request.startTime < request.endTime);
  const matches = useMemo(() => validRequest
    ? rankVenues({ ...request, projector, audioSystem, stage, accessible, preferredArea: area }, venues, events)
    : [], [validRequest, request, projector, audioSystem, stage, accessible, area, venues, events]);
  const shown = variant === "full" ? matches : matches.slice(0, 3);

  return <section className={`venue-advisor ${variant === "full" ? "venue-intelligence-full" : ""}`} aria-label="Venue recommendations">
    <div className="panel-heading"><div><span className="mini-label">VENUE MATCH</span><h2>{variant === "full" ? "Ranked venues" : "Ranked rooms"}</h2></div>{variant === "full" && <span className="mini-label">{shown.length} VENUES</span>}</div>
    <p>Ranked against illustrative venue profiles and events in this demo calendar. Capacity, facilities, and real bookings must be verified with campus staff.</p>
    <div className="venue-controls">
      <label><input type="checkbox" checked={projector} onChange={(event) => setProjector(event.target.checked)} /> Projector</label>
      <label><input type="checkbox" checked={audioSystem} onChange={(event) => setAudioSystem(event.target.checked)} /> Audio system</label>
      <label><input type="checkbox" checked={stage} onChange={(event) => setStage(event.target.checked)} /> Stage</label>
      <label><input type="checkbox" checked={accessible} onChange={(event) => setAccessible(event.target.checked)} /> Accessible entry</label>
      <label>Preferred area <select value={area} onChange={(event) => setArea(event.target.value)}><option>Any</option><option>Academic zone</option><option>Central zone</option><option>Sports zone</option><option>Residential zone</option></select></label>
    </div>
    {error && <div className="notice error" role="alert">{error}</div>}
    {!validRequest ? <p>Set a date, valid time range, and expected audience to see ranked rooms.</p> : !venues.length && !error ? <p>Loading venue profiles…</p> : !shown.length ? <p>No venue profiles are available.</p> : <div className="venue-results">{shown.map((match, index) => {
      const required = [[projector, match.venue.hasProjector], [audioSystem, match.venue.hasAudioSystem], [stage, match.venue.hasStage], [accessible, match.venue.accessible]].filter(([needed]) => needed);
      const met = required.filter(([, available]) => available).length;
      const pressure = match.warnings.find((warning) => warning.includes("large listed event")) ?? "No large concurrent listed events";
      return <article className="venue-match" key={match.venue.id}>
        <div className="venue-match-head"><strong>{index + 1}. {match.venue.name}</strong><span>{match.score}/100 match</span></div>
        <p>{match.venue.type} · about {match.venue.capacity} seats · {match.venue.area}</p>
        {variant === "full" && <dl className="venue-match-facts">
          <div><dt>Capacity fit</dt><dd>{request.expectedAudience} / {match.venue.capacity} seats</dd></div>
          <div><dt>Required facilities</dt><dd>{required.length ? `${met} of ${required.length} listed` : "None requested"}</dd></div>
          <div><dt>Calendar availability</dt><dd>{match.available ? "No listed collision" : "Listed collision"}</dd></div>
          <div><dt>Event pressure</dt><dd>{pressure}</dd></div>
        </dl>}
        <details className="venue-reasons" open={variant === "full" || index === 0}><summary>Reasons and checks</summary><IntelligenceExplanation title="Why this venue?" reasons={variant === "full" ? match.reasons : match.reasons.slice(0, 3)} warnings={variant === "full" ? match.warnings : match.warnings.slice(0, 3)} /></details>
        {onSelect && <button className="button button-secondary button-small" type="button" onClick={() => onSelect(match.venue.name)}>Use this venue</button>}
      </article>;
    })}</div>}
  </section>;
}
