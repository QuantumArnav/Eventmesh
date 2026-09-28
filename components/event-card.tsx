"use client";

import Link from "next/link";
import { Bookmark } from "lucide-react";
import { formatDate, formatTime } from "@/lib/dates";
import { recommend } from "@/lib/recommendation-engine";
import type { EventData, StudentData } from "@/lib/types";

type PresentationProps = { event: EventData; student: StudentData | null; saved: boolean; onToggle: () => void };

function SaveAction({ event, saved, onToggle }: Pick<PresentationProps, "event" | "saved" | "onToggle">) {
  return <button type="button" className={`event-save ${saved ? "saved" : ""}`} aria-label={saved ? `Remove ${event.title} from schedule` : `Save ${event.title}`} onClick={onToggle}><Bookmark size={16} fill={saved ? "currentColor" : "none"} /> <span>{saved ? "Saved" : "Save"}</span></button>;
}

export function FeaturedEvent({ event, student, saved, onToggle }: PresentationProps) {
  const recommendation = student ? recommend(event, student) : null;
  return <article className="featured-event">
    <div className="featured-event-copy">
      <span className="mini-label">FEATURED / {event.category.toUpperCase()}</span>
      <Link href={`/events/${event.id}`}><h2>{event.title}</h2></Link>
      <p>{event.description}</p>
      <div className="featured-event-foot"><Link href={`/events/${event.id}`} className="text-link">View event →</Link><SaveAction event={event} saved={saved} onToggle={onToggle} /></div>
    </div>
    <div className="featured-event-facts">
      <div><span>DATE</span><strong>{formatDate(event.date, { weekday: "long", month: "long" })}</strong></div>
      <div><span>TIME</span><strong>{formatTime(event.startTime)}–{formatTime(event.endTime)}</strong></div>
      <div><span>PLACE</span><strong>{event.venue}</strong></div>
      <div><span>HOST</span><strong>{event.organizer}</strong></div>
      {recommendation && <div><span>FOR YOU</span><strong>{recommendation.score}/100 <small>{recommendation.reasons[0]}</small></strong></div>}
    </div>
  </article>;
}

export function EventRow({ event, student, saved, onToggle }: PresentationProps) {
  const recommendation = student ? recommend(event, student) : null;
  return <article className="event-row">
    <div className="event-row-when"><strong>{formatTime(event.startTime)}</strong><span>{formatDate(event.date, { weekday: "short", day: "numeric", month: "short" })}</span></div>
    <div className="event-row-main"><span className="event-row-category">{event.category} / {event.tags.slice(0, 2).join(" · ")}</span><Link href={`/events/${event.id}`}><h3>{event.title}</h3></Link><p>{event.organizer} · {event.venue}</p>{recommendation && <small>{recommendation.reasons[0]} · {recommendation.score}/100 relevance</small>}</div>
    <div className="event-row-actions"><SaveAction event={event} saved={saved} onToggle={onToggle} /><Link href={`/events/${event.id}`} aria-label={`View ${event.title}`}>↗</Link></div>
  </article>;
}
