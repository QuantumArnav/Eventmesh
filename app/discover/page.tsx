"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useCampus } from "@/app/providers";
import { EmptyState, LoadingState } from "@/components/loading";
import { EventRow, FeaturedEvent } from "@/components/event-card";
import { SmartSearch } from "@/components/smart-search";
import { addDays, formatDate, todayInIsth } from "@/lib/dates";
import { recommend } from "@/lib/recommendation-engine";

const filters = ["All", "Today", "Tomorrow", "This Week", "Technical", "Cultural", "Sports", "Workshop", "Talk"];

export default function Discover() {
  const { events, account, student, savedEventIds, toggleSaved, loading, error, refresh } = useCampus();
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
      return filter === "All" || event.category === filter;
    }).sort((a, b) => (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0) || a.date.localeCompare(b.date));
  }, [events, student, search, filter, today]);
  const featured = filter === "All" && !search.trim() ? filtered.find((event) => event.date >= today) ?? filtered[0] : null;
  const rows = filtered.filter((event) => event.id !== featured?.id).sort((a, b) => Number(b.date >= today) - Number(a.date >= today) || a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  const upcomingRows = rows.filter((event) => event.date >= today);
  const pastRows = rows.filter((event) => event.date < today);

  return <div className="page-wrap discover-page">
    <div className="discover-header"><div><span className="mini-label">THE CAMPUS EVENT GUIDE / {formatDate(today, { weekday: "long", month: "long" }).toUpperCase()}</span><h1>What’s happening<br />at IITH?</h1><p>Find an event for tonight, the weekend, or the hour you have free.</p></div><Link href="/my-schedule" className="text-link">My schedule →</Link></div>
    {!loading && account && student?.interests.length === 0 && <div className="notice">Make Discover yours: <Link href="/account">choose your interests →</Link></div>}
    {error && <div className="notice error" role="alert">{error} <button type="button" className="button button-small button-secondary" onClick={() => void refresh()}>Retry</button></div>}
    {!loading && !error && <SmartSearch student={student} savedIds={savedEventIds} events={events} />}
    <section className="discover-browser" aria-label="Browse events">
      <div className="discover-controls"><label className="search-wrap"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search events, clubs, venues…" aria-label="Search events" /></label><span>{filtered.length} of {events.length} listings</span></div>
      <div className="filter-row" role="group" aria-label="Filter events">{filters.map((value) => <button type="button" className={`filter-button ${filter === value ? "active" : ""}`} key={value} onClick={() => setFilter(value)}>{value}</button>)}</div>
      {loading ? <LoadingState /> : filtered.length ? <>
        {featured && <FeaturedEvent event={featured} student={student} saved={savedEventIds.includes(featured.id)} onToggle={() => void toggleSaved(featured.id)} />}
        {upcomingRows.length > 0 && <><div className="event-list-heading"><span className="mini-label">{filter === "All" ? "THE EVENT INDEX" : `${filter.toUpperCase()} EVENTS`}</span><span>DATE / TIME / PLACE</span></div>
        <div className="event-list">{upcomingRows.map((event) => <EventRow key={event.id} event={event} student={student} saved={savedEventIds.includes(event.id)} onToggle={() => void toggleSaved(event.id)} />)}</div></>}
        {pastRows.length > 0 && <><div className="event-list-heading past-events-heading"><span className="mini-label">PAST LISTINGS</span><span>ARCHIVE</span></div>
        <div className="event-list">{pastRows.map((event) => <EventRow key={event.id} event={event} student={student} saved={savedEventIds.includes(event.id)} onToggle={() => void toggleSaved(event.id)} />)}</div></>}
      </> : <EmptyState title="No events in this view." description="Try another filter or search term." action={<button className="button button-secondary" onClick={() => { setFilter("All"); setSearch(""); }}>Clear filters</button>} />}
    </section>
  </div>;
}
