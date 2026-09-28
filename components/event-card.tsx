"use client";

import Link from "next/link";
import { ArrowUpRight, Bookmark, Clock3, MapPin } from "lucide-react";
import { formatDate, formatTime } from "@/lib/dates";
import { recommend } from "@/lib/recommendation-engine";
import type { EventData, StudentData } from "@/lib/types";

const colors: Record<string, string> = {
  Technical: "violet", Cultural: "rose", Sports: "lime", Workshop: "cyan", Talk: "amber", Community: "blue",
};

export function EventCard({ event, student, saved, onToggle }: { event: EventData; student: StudentData | null; saved: boolean; onToggle: () => void }) {
  const recommendation = student ? recommend(event, student) : null;
  return <article className={`event-card ${colors[event.category] || "blue"}`}>
    <div className="card-top"><span className="category-pill">{event.category}</span><button type="button" className={`icon-button save-button ${saved ? "saved" : ""}`} aria-label={saved ? `Remove ${event.title} from schedule` : `Save ${event.title}`} title={saved ? "Remove from schedule" : "Save to schedule"} onClick={onToggle}><Bookmark size={18} fill={saved ? "currentColor" : "none"} /></button></div>
    <Link href={`/events/${event.id}`} className="card-main"><div className="event-date">{formatDate(event.date)}</div><h3>{event.title}</h3><p>{event.description}</p></Link>
    <div className="event-tags">{event.tags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}</div>
    <div className="card-meta"><span><Clock3 size={15} /> {formatTime(event.startTime)} – {formatTime(event.endTime)}</span><span><MapPin size={15} /> {event.venue}</span></div>
    <div className="card-footer"><div className="card-organizer"><span className="organizer-avatar">{event.organizer.slice(0, 1)}</span><span>{event.organizer}</span></div><Link href={`/events/${event.id}`} aria-label={`View ${event.title}`}><ArrowUpRight size={18} /></Link></div>
    {recommendation && <div className="relevance"><div><strong>{recommendation.score}/100</strong> relevance score</div><span>{recommendation.reasons[0]}</span></div>}
  </article>;
}
