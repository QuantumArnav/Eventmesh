"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Bookmark, CalendarDays, Clock3, Download, MapPin, Share2, Tag, Users, AlertTriangle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useCampus } from "@/app/providers";
import { LoadingState, EmptyState } from "@/components/loading";
import { formatDate, formatTime } from "@/lib/dates";
import { overlapMinutes } from "@/lib/conflict-engine";
import { recommend } from "@/lib/recommendation-engine";
import { downloadIcs } from "@/lib/ics";
import { assessEventTrust } from "@/lib/event-trust";
import { IntelligenceExplanation } from "@/components/intelligence-explanation";

export function EventDetail({ id }: { id: string }) {
  const [shareStatus, setShareStatus] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [showQr, setShowQr] = useState(false);
  const { events, student, savedEventIds, toggleSaved, loading } = useCampus();
  if (loading) return <div className="page-wrap"><LoadingState label="Loading event details…" /></div>;
  const event = events.find((item) => item.id === id);
  if (!event) return <div className="page-wrap"><EmptyState title="Event not found" description="This event may have been removed or the link may be incorrect." action={<Link href="/discover" className="button button-primary">Back to discover</Link>} /></div>;
  const saved = savedEventIds.includes(event.id);
  const clashes = events.filter((item) => item.id !== event.id && savedEventIds.includes(item.id) && overlapMinutes(event, item) > 0);
  const related = events.filter((item) => item.id !== event.id && (item.category === event.category || item.tags.some((tag) => event.tags.includes(tag)))).slice(0, 4);
  const recommendation = student ? recommend(event, student) : null;
  const trust = assessEventTrust(event, events);
  return <div className="page-wrap"><Link href="/discover" className="back-link"><ArrowLeft size={15} /> Back to discover</Link><div className="detail-grid"><div><div className="detail-hero"><div className="section-kicker">{event.category.toUpperCase()} · {event.isDemo ? "DEMO EVENT" : "COMMUNITY EVENT"}</div><h1>{event.title}</h1><div className="detail-actions"><button type="button" className={`button ${saved ? "button-secondary" : "button-primary"}`} onClick={() => void toggleSaved(event.id)}><Bookmark size={16} fill={saved ? "currentColor" : "none"} />{saved ? "Saved to schedule" : "Save to my schedule"}</button><button type="button" className="button button-secondary" onClick={() => downloadIcs([event], `eventmesh-${event.id}.ics`)}><Download size={15} /> Add to calendar</button><button type="button" className="button button-secondary" onClick={() => void navigator.clipboard.writeText(window.location.href).then(() => setShareStatus("Link copied"), () => setShareStatus("Copy failed; use the address bar"))}><Share2 size={15} /> Share event</button><button type="button" className="button button-secondary" aria-expanded={showQr} aria-controls="event-share-qr" onClick={() => { setShareUrl(window.location.href); setShowQr((value) => !value); }}>Show QR</button><Link href="/my-schedule" className="button button-secondary">See my schedule</Link></div><span role="status" aria-live="polite" className="share-status">{shareStatus}</span>{showQr && shareUrl && <div id="event-share-qr" className="qr-share"><QRCodeSVG value={shareUrl} size={154} marginSize={2} title={`QR code for ${event.title}`} /><div><strong>Scan to open this event</strong><p>{shareUrl}</p>{new URL(shareUrl).hostname === "localhost" && <small>This local address works on this computer. Share a deployed URL for other devices.</small>}</div></div>}</div>
    {clashes.length > 0 && <div className="notice amber" style={{ marginTop: 18 }} role="alert"><AlertTriangle size={16} style={{ display: "inline", verticalAlign: "middle", marginRight: 7 }} /> This event overlaps with your saved {clashes.map((item) => item.title).join(", ")}.</div>}
    <section className="detail-section"><h2>About this event</h2><p>{event.description}</p><div className="event-tags">{event.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></section>
    <section className="detail-section"><h2>Listing checks</h2><p>{event.isDemo ? "Static demo listing; seed details may be illustrative or adapted from campus announcements. Confirm current details with the organizer." : "This listing was created in the local demo."}</p><IntelligenceExplanation title={`Listing status: ${trust.status}`} score={trust.score} scoreLabel="completeness" reasons={trust.checks.filter((check) => check.passed).map((check) => check.detail).slice(0, 4)} warnings={[...trust.checks.filter((check) => !check.passed).map((check) => check.detail), "Venue booking and organizer identity have not been independently verified."]} /></section>
    <section className="detail-section"><h2>Why it’s on your radar</h2>{recommendation ? <><IntelligenceExplanation title="Your relevance signals" score={recommendation.score} scoreLabel="relevance" reasons={recommendation.reasons} /><p>This heuristic uses interests, category, time, demo popularity, and organizer affinity.</p></> : <p>Sign in with a profile to see recommendations.</p>}</section>
    </div><aside className="detail-sidebar"><div className="panel aside-panel"><h2>Event details</h2><div className="info-row"><CalendarDays size={18} /><div><strong>{formatDate(event.date, { weekday: "long", month: "long" })}</strong><small>Event date</small></div></div><div className="info-row"><Clock3 size={18} /><div><strong>{formatTime(event.startTime)} – {formatTime(event.endTime)}</strong><small>Local campus time (IST)</small></div></div><div className="info-row"><MapPin size={18} /><div><strong>{event.venue}</strong><small>Venue in local listing</small></div></div><div className="info-row"><Users size={18} /><div><strong>{event.organizer}</strong><small>Organizer</small></div></div>{event.registrationDeadline && <div className="info-row"><Tag size={18} /><div><strong>{formatDate(event.registrationDeadline)}</strong><small>Registration deadline</small></div></div>}</div><div className="panel aside-panel"><h2>You might also like</h2><div className="related-list">{related.length ? related.map((item) => <Link href={`/events/${item.id}`} className="related-item" key={item.id}>{item.title}<span>↗</span></Link>) : <span className="page-subtitle">More events coming soon.</span>}</div></div></aside></div></div>;
}
