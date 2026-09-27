"use client";

import Link from "next/link";
import { ArrowRight, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { EventCard } from "@/components/event-card";
import { EmptyState, LoadingState } from "@/components/loading";
import { useCampus } from "@/app/providers";
import { addDays, todayInIsth } from "@/lib/dates";
import { recommend } from "@/lib/recommendation-engine";
import { SmartSearch } from "@/components/smart-search";

const filters = ["All", "Today", "Tomorrow", "This Week", "Technical", "Cultural", "Sports", "Workshop", "Talk"];

export default function Discover() {
  const { events, student, savedEventIds, toggleSaved, loading, error, refresh } = useCampus();
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const today = todayInIsth();
  const filtered = useMemo(() => {
    const scores = new Map(events.map((event) => [event.id, student ? recommend(event, student).score : 0]));
    return events.filter((event) => {
    const query = search.trim().toLowerCase();
    const found = !query || [event.title, event.organizer, event.category, event.venue, ...event.tags].some((value) => value.toLowerCase().includes(query));
    if (!found) return false;
    if (filter === "Today") return event.date === today;
    if (filter === "Tomorrow") return event.date === addDays(today, 1);
    if (filter === "This Week") return event.date >= today && event.date <= addDays(today, 6);
    if (filter === "All") return true;
    return event.category === filter;
    }).sort((a, b) => (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0) || a.date.localeCompare(b.date));
  }, [events, student, search, filter, today]);

  return <div className="page-wrap">
    <div className="page-header"><div><div className="section-kicker"><Sparkles size={15} /> PERSONALIZED DISCOVERY</div><h1 className="page-title">Find your next thing.</h1><p className="page-subtitle">Events from across campus, organized around what matters to you.</p></div><Link href="/my-schedule" className="button button-secondary">View my schedule <ArrowRight size={16} /></Link></div>
    {!loading && !error && <SmartSearch events={events} student={student} savedIds={savedEventIds} />}
    <div className="toolbar"><label className="search-wrap"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search events, clubs, tags, venues…" aria-label="Search events" /></label><SlidersHorizontal size={17} color="#7891a8" /></div>
    <div className="filter-row" role="group" aria-label="Filter events">{filters.map((value) => <button type="button" className={`filter-button ${filter === value ? "active" : ""}`} key={value} onClick={() => setFilter(value)}>{value}</button>)}</div>
    <div style={{ marginTop: 28 }}><div className="section-heading" style={{ margin: "0 0 16px" }}><div><span className="mini-label">CURATED FOR YOU</span><h2>{filter === "All" ? "On your radar" : filter + " events"}</h2></div><p>Recommendations use your demo interests and a transparent weighted score.</p></div></div>
    {error && <div className="notice error" role="alert">{error} <button type="button" className="button button-small button-secondary" onClick={() => void refresh()}>Retry</button></div>}
    {loading ? <LoadingState /> : <><div className="result-count">Showing {filtered.length} of {events.length} demo events</div>{filtered.length ? <div className="event-grid">{filtered.map((event) => <EventCard key={event.id} event={event} student={student} saved={savedEventIds.includes(event.id)} onToggle={() => void toggleSaved(event.id)} />)}</div> : <EmptyState title="Nothing in this view yet" description="Try another filter or search term to discover more campus events." action={<button className="button button-secondary" onClick={() => { setFilter("All"); setSearch(""); }}>Clear filters</button>} />}</>}
  </div>;
}
