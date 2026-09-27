"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, GitBranch, Network } from "lucide-react";
import { useCampus } from "@/app/providers";
import { LoadingState } from "@/components/loading";
import { formatDate, todayInIsth } from "@/lib/dates";
import { buildEventMesh } from "@/lib/event-graph";

type Focus = { kind: "event" | "organizer" | "category" | "tag"; value: string };
type Facet = { kind: "category" | "tag"; value: string };
const centerY = (index: number, count: number) => 80 + index * (540 / Math.max(1, count - 1));

export default function EventMeshPage() {
  const { events, loading, error } = useCampus();
  const mesh = useMemo(() => buildEventMesh(events.filter((event) => event.date >= todayInIsth())), [events]);
  const [focus, setFocus] = useState<Focus | null>(null);
  const facets: Facet[] = [
    ...mesh.categories.map((value) => ({ kind: "category" as const, value })),
    ...mesh.tags.map((value) => ({ kind: "tag" as const, value })),
  ];
  const hero = [...mesh.events].sort((a, b) =>
    mesh.audienceLinks.filter((link) => link.left === b.id || link.right === b.id).length -
    mesh.audienceLinks.filter((link) => link.left === a.id || link.right === a.id).length ||
    b.popularity - a.popularity,
  )[0];
  const selected = focus ?? (hero ? { kind: "event" as const, value: hero.id } : null);
  const selectedEvent = selected?.kind === "event" ? mesh.events.find((event) => event.id === selected.value) : null;
  const related = selected?.kind === "event" ? mesh.audienceLinks.filter((link) => link.left === selected.value || link.right === selected.value) : [];
  const activeIds = new Set(
    selected?.kind === "event"
      ? [selected.value, ...related.map((link) => link.left === selected.value ? link.right : link.left)]
      : selected?.kind === "organizer"
        ? mesh.events.filter((event) => event.organizer === selected.value).map((event) => event.id)
        : selected?.kind === "category"
          ? mesh.events.filter((event) => event.category === selected.value).map((event) => event.id)
          : selected?.kind === "tag"
            ? mesh.events.filter((event) => event.tags.includes(selected.value)).map((event) => event.id)
            : [],
  );
  const relevantEvents = mesh.events.filter((event) => activeIds.has(event.id));

  return <div className="page-wrap">
    <div className="page-header">
      <div><div className="section-kicker"><Network size={15} /> CAMPUS EVENT NETWORK</div><h1 className="page-title">The Event Mesh.</h1><p className="page-subtitle">See how events, communities, categories, and interests connect across campus.</p></div>
      <Link href="/discover" className="button button-secondary">Explore events <ArrowRight size={16} /></Link>
    </div>
    {error && <div className="notice error">{error}</div>}
    {loading ? <LoadingState /> : <>
      <div className="mesh-summary">
        <span><strong>{mesh.events.length}</strong> events in view</span>
        <span><strong>{mesh.organizers.length}</strong> organizers</span>
        <span><strong>{mesh.categories.length}</strong> categories</span>
        <span><strong>{mesh.tags.length}</strong> prominent interests</span>
        <span><strong>{mesh.audienceLinks.length}</strong> audience connections</span>
      </div>
      <div className="mesh-layout">
        <section className="panel mesh-panel">
          <div className="mesh-head"><div><span className="mini-label">INTERACTIVE CAMPUS GRAPH · DEMO DATA</span><h2>Connected by people and interests</h2></div><GitBranch size={21} color="#8ce9d6" /></div>
          <div className="mesh-swipe">Swipe sideways to explore events and topics →</div>
          <div className="mesh-scroll"><div className="mesh-canvas">
            <div className="mesh-column-label organizers">ORGANIZERS</div><div className="mesh-column-label events">EVENTS</div><div className="mesh-column-label interests">CATEGORIES + INTERESTS</div>
            <svg className="mesh-lines" viewBox="0 0 1000 700" aria-hidden="true">
              <defs><linearGradient id="mesh-line"><stop stopColor="#6cbaad" /><stop offset="1" stopColor="#6d839f" /></linearGradient></defs>
              {mesh.events.flatMap((event, index) => {
                const organizerIndex = mesh.organizers.indexOf(event.organizer);
                return organizerIndex < 0 ? [] : [<line key={`o-${event.id}`} x1="170" y1={centerY(organizerIndex, mesh.organizers.length)} x2="450" y2={centerY(index, mesh.events.length)} stroke="url(#mesh-line)" strokeWidth={activeIds.has(event.id) ? 2 : 1} opacity={activeIds.has(event.id) ? .8 : .16} />];
              })}
              {mesh.events.flatMap((event, index) => facets.flatMap((facet, facetIndex) => {
                if (facet.kind === "category" ? event.category !== facet.value : !event.tags.includes(facet.value)) return [];
                return [<line key={`${facet.kind}-${event.id}-${facet.value}`} x1="550" y1={centerY(index, mesh.events.length)} x2="800" y2={centerY(facetIndex, facets.length)} stroke={facet.kind === "category" ? "#bba5ee" : "#7ebdb2"} strokeWidth={activeIds.has(event.id) ? 2 : 1} opacity={activeIds.has(event.id) ? .8 : .13} />];
              }))}
              {mesh.audienceLinks.slice(0, 10).map((link, index) => {
                const leftIndex = mesh.events.findIndex((event) => event.id === link.left);
                const rightIndex = mesh.events.findIndex((event) => event.id === link.right);
                return <path key={`${link.left}-${link.right}`} d={`M 565 ${centerY(leftIndex, mesh.events.length)} Q ${640 + index * 5} ${(centerY(leftIndex, mesh.events.length) + centerY(rightIndex, mesh.events.length)) / 2} 565 ${centerY(rightIndex, mesh.events.length)}`} fill="none" stroke="#bba5ee" strokeWidth={selected?.kind === "event" && (selected.value === link.left || selected.value === link.right) ? 2 : 1} strokeDasharray="4 5" opacity={selected?.kind === "event" && (selected.value === link.left || selected.value === link.right) ? .9 : .16} />;
              })}
            </svg>
            {mesh.organizers.map((organizer, index) => <button key={organizer} className={`mesh-node organizer ${selected?.kind === "organizer" && selected.value === organizer ? "selected" : ""}`} style={{ top: centerY(index, mesh.organizers.length) - 19 }} onClick={() => setFocus({ kind: "organizer", value: organizer })} title={`Show ${organizer} events`}>{organizer}</button>)}
            {mesh.events.map((event, index) => <button key={event.id} className={`mesh-node event ${selected?.kind === "event" && selected.value === event.id ? "selected" : ""} ${activeIds.has(event.id) ? "related" : "muted"}`} style={{ top: centerY(index, mesh.events.length) - 21 }} onClick={() => setFocus({ kind: "event", value: event.id })} title={event.title}><span>{event.title}</span><small>{event.category}</small></button>)}
            {facets.map((facet, index) => <button key={`${facet.kind}-${facet.value}`} className={`mesh-node tag ${selected?.kind === facet.kind && selected.value === facet.value ? "selected" : ""}`} style={{ top: centerY(index, facets.length) - 19 }} onClick={() => setFocus(facet)} title={`Show events in ${facet.kind} ${facet.value}`}>{facet.kind === "category" ? "◆" : "#"} {facet.value}</button>)}
          </div></div>
          <p className="intelligence-footnote">Solid links connect organizers, categories, and interests to events. Dotted links connect events with at least 15% shared audience tags. Select any node to inspect the evidence.</p>
        </section>
        <aside className="panel mesh-detail"><span className="mini-label">NETWORK INSIGHT</span>
          {selectedEvent ? <>
            <h2>{selectedEvent.title}</h2><p>{selectedEvent.organizer} · {formatDate(selectedEvent.date)} · {selectedEvent.venue}</p>
            <div className="mesh-detail-tags"><button onClick={() => setFocus({ kind: "category", value: selectedEvent.category })}>◆ {selectedEvent.category}</button>{selectedEvent.tags.map((tag) => <button key={tag} onClick={() => setFocus({ kind: "tag", value: tag })}># {tag}</button>)}</div>
            <Link href={`/events/${selectedEvent.id}`} className="button button-primary button-small">Open event <ArrowRight size={14} /></Link>
            <h3>Shared audience</h3>
            {related.length ? related.slice(0, 5).map((link) => {
              const otherId = link.left === selectedEvent.id ? link.right : link.left;
              const other = mesh.events.find((event) => event.id === otherId);
              return other && <button className="mesh-related" key={otherId} onClick={() => setFocus({ kind: "event", value: otherId })}><strong>{other.title}</strong><span>{link.similarity}% overlap · {link.sharedTags.join(", ")}</span></button>;
            }) : <p>No other visible event shares enough audience tags.</p>}
          </> : <>
            <h2>{selected?.value ?? "Explore the network"}</h2>
            <p>{selected?.kind === "organizer" ? "Events from this campus group." : selected?.kind === "category" ? "Events in this category." : "Events connected by this interest."}</p>
            <h3>Connected events</h3>
            {relevantEvents.length ? relevantEvents.map((event) => <button className="mesh-related" key={event.id} onClick={() => setFocus({ kind: "event", value: event.id })}><strong>{event.title}</strong><span>{formatDate(event.date)} · {event.category}</span></button>) : <p>No visible events in this selection.</p>}
          </>}
        </aside>
      </div>
    </>}
  </div>;
}
