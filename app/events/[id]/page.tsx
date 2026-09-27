"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Bookmark, CalendarDays, Clock3, MapPin, Tag, Users, AlertTriangle } from "lucide-react";
import { useCampus } from "@/app/providers";
import { LoadingState, EmptyState } from "@/components/loading";
import { formatDate, formatTime } from "@/lib/dates";
import { overlapMinutes } from "@/lib/conflict-engine";
import { recommend } from "@/lib/recommendation-engine";

export default function EventDetail() {
  const params = useParams<{ id: string }>();
  const { events, student, savedEventIds, toggleSaved, loading } = useCampus();
  if (loading) return <div className="page-wrap"><LoadingState label="Loading event details…" /></div>;
  const event = events.find((item) => item.id === params.id);
  if (!event) return <div className="page-wrap"><EmptyState title="Event not found" description="This event may have been removed or the link may be incorrect." action={<Link href="/discover" className="button button-primary">Back to discover</Link>} /></div>;
  const saved = savedEventIds.includes(event.id);
  const clashes = events.filter((item) => item.id !== event.id && savedEventIds.includes(item.id) && overlapMinutes(event, item) > 0);
  const related = events.filter((item) => item.id !== event.id && (item.category === event.category || item.tags.some((tag) => event.tags.includes(tag)))).slice(0, 4);
  const recommendation = student ? recommend(event, student) : null;
  return <div className="page-wrap"><Link href="/discover" className="back-link"><ArrowLeft size={15} /> Back to discover</Link><div className="detail-grid"><div><div className="detail-hero"><div className="section-kicker">{event.category.toUpperCase()} · {event.isDemo ? "DEMO EVENT" : "COMMUNITY EVENT"}</div><h1>{event.title}</h1><p>{event.description}</p><div className="detail-actions"><button type="button" className={`button ${saved ? "button-secondary" : "button-primary"}`} onClick={() => void toggleSaved(event.id)}><Bookmark size={16} fill={saved ? "currentColor" : "none"} />{saved ? "Saved to schedule" : "Save to my schedule"}</button><Link href="/my-schedule" className="button button-secondary">See my schedule</Link></div></div>
    {clashes.length > 0 && <div className="notice amber" style={{ marginTop: 18 }} role="alert"><AlertTriangle size={16} style={{ display: "inline", verticalAlign: "middle", marginRight: 7 }} /> This event overlaps with your saved {clashes.map((item) => item.title).join(", ")}.</div>}
    <section className="detail-section"><h2>About this event</h2><p>{event.description}</p><div className="event-tags">{event.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></section>
    <section className="detail-section"><h2>Why it’s on your radar</h2><p>{recommendation ? `${recommendation.score}% relevance. ${recommendation.reasons.join(" · ")}. The score combines shared interests, category preference, time, demo popularity, and organizer affinity.` : "Sign in with a profile to see recommendations."}</p></section>
    </div><aside className="detail-sidebar"><div className="panel aside-panel"><h2>Event details</h2><div className="info-row"><CalendarDays size={18} /><div><strong>{formatDate(event.date, { weekday: "long", month: "long" })}</strong><small>Event date</small></div></div><div className="info-row"><Clock3 size={18} /><div><strong>{formatTime(event.startTime)} – {formatTime(event.endTime)}</strong><small>Local campus time (IST)</small></div></div><div className="info-row"><MapPin size={18} /><div><strong>{event.venue}</strong><small>Demo venue information</small></div></div><div className="info-row"><Users size={18} /><div><strong>{event.organizer}</strong><small>Organizer</small></div></div>{event.registrationDeadline && <div className="info-row"><Tag size={18} /><div><strong>{formatDate(event.registrationDeadline)}</strong><small>Registration deadline</small></div></div>}</div><div className="panel aside-panel"><h2>You might also like</h2><div className="related-list">{related.length ? related.map((item) => <Link href={`/events/${item.id}`} className="related-item" key={item.id}>{item.title}<span>↗</span></Link>) : <span className="page-subtitle">More events coming soon.</span>}</div></div></aside></div></div>;
}
