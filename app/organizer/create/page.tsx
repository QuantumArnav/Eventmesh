"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, FileImage, Radar, UploadCloud } from "lucide-react";
import { useCampus } from "@/app/providers";
import { addDays, formatDate, formatTime, todayInIsth } from "@/lib/dates";
import type { Conflict, SlotSuggestion } from "@/lib/conflict-engine";
import type { DuplicateMatch } from "@/lib/duplicate-detector";
import { assessReadiness } from "@/lib/event-readiness";
import { CATEGORIES, type Category, type EventInput } from "@/lib/types";
import { eventInputSchema } from "@/lib/validation";
import { VenueAdvisor } from "@/components/venue-advisor";
import { IntelligencePipeline } from "@/components/intelligence-pipeline";
import { IntelligenceExplanation } from "@/components/intelligence-explanation";
import type { ExtractionField, FieldAssessment } from "@/lib/ai/event-extractor";

type Draft = { title: string; organizer: string; description: string; date: string; startTime: string; endTime: string; venue: string; category: Category; tags: string; registrationDeadline: string; expectedAudience: string };
type Analysis = { conflicts: Conflict[]; suggestions: SlotSuggestion[]; duplicates: DuplicateMatch[] };

const emptyDraft: Draft = { title: "", organizer: "", description: "", date: "", startTime: "18:00", endTime: "19:30", venue: "", category: "Workshop", tags: "", registrationDeadline: "", expectedAudience: "" };

function demoDraft(events: { title: string; date: string }[]): Draft {
  const date = events.find((event) => event.title === "Lambda AI Workshop")?.date ?? addDays(todayInIsth(), 2);
  return { title: "Lambda AI Workshop: Agents", organizer: "Lambda Club", description: "A hands-on session to design, build and evaluate practical AI agents with fellow IITH students.", date, startTime: "18:00", endTime: "19:30", venue: "LH3", category: "Workshop", tags: "AI, Programming, Machine Learning", registrationDeadline: addDays(date, -1), expectedAudience: "80" };
}

function createSamplePoster(): File {
  const canvas = document.createElement("canvas");
  canvas.width = 900; canvas.height = 1200;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable in this browser.");
  context.fillStyle = "#f7f5ef"; context.fillRect(0, 0, 900, 1200);
  context.fillStyle = "#255740"; context.fillRect(80, 72, 740, 5);
  context.fillStyle = "#255740"; context.font = "bold 29px Arial"; context.fillText("LAMBDA CLUB  /  IITH", 80, 132);
  context.fillStyle = "#202722"; context.font = "bold 104px Arial"; context.fillText("APPLIED AI", 76, 370); context.fillText("SYSTEMS LAB", 76, 480);
  context.font = "36px Arial"; context.fillText("Build and evaluate practical AI systems", 80, 565);
  context.fillText("with the campus tech community.", 80, 615);
  context.strokeStyle = "#9aa89b"; context.beginPath(); context.moveTo(80, 710); context.lineTo(820, 710); context.stroke();
  context.fillStyle = "#255740"; context.font = "bold 40px Arial"; context.fillText(formatDate(addDays(todayInIsth(), 2), { month: "long", year: "numeric" }).toUpperCase(), 80, 790);
  context.fillStyle = "#202722"; context.font = "bold 50px Arial"; context.fillText("6:00 PM – 7:30 PM", 80, 875); context.fillText("LH3", 80, 945);
  context.strokeStyle = "#9aa89b"; context.beginPath(); context.moveTo(80, 1020); context.lineTo(820, 1020); context.stroke();
  context.font = "28px Arial"; context.fillText(`Registration deadline: ${formatDate(addDays(todayInIsth(), 1), { month: "long", year: "numeric" })}`, 80, 1080);
  const url = canvas.toDataURL("image/png");
  const binary = atob(url.split(",")[1]);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new File([bytes], "eventmesh-sample-poster.png", { type: "image/png" });
}

function asInput(draft: Draft): EventInput {
  return { title: draft.title.trim(), organizer: draft.organizer.trim(), description: draft.description.trim(), date: draft.date, startTime: draft.startTime, endTime: draft.endTime, venue: draft.venue.trim(), category: draft.category,
    tags: draft.tags.split(",").map((item) => item.trim()).filter(Boolean), registrationDeadline: draft.registrationDeadline || null, expectedAudience: draft.expectedAudience ? Number(draft.expectedAudience) : null };
}

function mergeExtracted(current: Draft, extracted: Record<string, unknown>): Draft {
  return { ...current,
    title: typeof extracted.title === "string" ? extracted.title : current.title,
    organizer: typeof extracted.organizer === "string" ? extracted.organizer : current.organizer,
    description: typeof extracted.description === "string" ? extracted.description : current.description,
    date: typeof extracted.date === "string" ? extracted.date : current.date,
    startTime: typeof extracted.startTime === "string" ? extracted.startTime : current.startTime,
    endTime: typeof extracted.endTime === "string" ? extracted.endTime : "",
    venue: typeof extracted.venue === "string" ? extracted.venue : current.venue,
    registrationDeadline: typeof extracted.registrationDeadline === "string" ? extracted.registrationDeadline : current.registrationDeadline,
    category: CATEGORIES.includes(extracted.category as Category) ? extracted.category as Category : current.category,
    tags: Array.isArray(extracted.tags) && extracted.tags.length ? extracted.tags.join(", ") : current.tags,
  };
}

function ReviewHint({ assessment }: { assessment?: FieldAssessment }) {
  if (!assessment) return null;
  return <span className={`extraction-hint ${assessment.label === "High confidence" ? "" : "needs-review"}`}>{assessment.label}{assessment.warning && <small>{assessment.warning}</small>}</span>;
}

export default function CreateEvent() {
  const router = useRouter();
  const { refresh, events } = useCampus();
  const [mode, setMode] = useState<"manual" | "poster" | "announcement">("manual");
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [announcement, setAnnouncement] = useState("");
  const [poster, setPoster] = useState<File | null>(null);
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analysisKey, setAnalysisKey] = useState("");
  const [confirmConflicts, setConfirmConflicts] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [publishedId, setPublishedId] = useState<string | null>(null);
  const [dismissedDuplicates, setDismissedDuplicates] = useState(false);
  const [extractionFields, setExtractionFields] = useState<Partial<Record<ExtractionField, FieldAssessment>> | null>(null);
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const [sourceStatus, setSourceStatus] = useState<string | null>(null);
  const readiness = assessReadiness(asInput(draft));

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("source");
    if (!id) return;
    let active = true;
    fetch(`/api/inbox/${encodeURIComponent(id)}`).then(async (response) => {
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not load staged source.");
      return body;
    }).then((source) => {
      if (!active) return;
      setSourceId(id); setSourceStatus(source.status);
      if (source.sourceType === "POSTER" && typeof source.sourceData === "string" && source.sourceData.startsWith("data:image/")) setSourcePreview(source.sourceData);
      if (source.extractedJson) {
        const result = JSON.parse(source.extractedJson);
        setDraft((current) => mergeExtracted(current, result.extracted));
        setExtractionFields(result.fields ?? null);
        setInfo(`${result.method} created this staged draft. Review every field before publishing.`);
      } else setInfo("Staged poster loaded without automatic extraction. Enter the details manually and review the image.");
    }).catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Could not load staged source."); });
    return () => { active = false; };
  }, []);

  const change = (name: keyof Draft, value: string) => {
    setDraft((current) => ({ ...current, [name]: value }));
    setAnalysis(null); setConfirmConflicts(false); setDismissedDuplicates(false); setError(null);
    setFieldErrors((current) => ({ ...current, [name]: "" }));
    setExtractionFields((current) => current ? { ...current, [name]: undefined } : null);
  };

  const validate = (value: Draft): EventInput | null => {
    const input = asInput(value);
    const parsed = eventInputSchema.safeParse(input);
    if (!parsed.success) {
      const fields = parsed.error.flatten().fieldErrors;
      setFieldErrors(Object.fromEntries(Object.entries(fields).map(([key, messages]) => [key, messages?.[0] || "Invalid value"])));
      setError("Please complete the required event details before continuing.");
      return null;
    }
    setFieldErrors({}); setError(null);
    return parsed.data;
  };

  const analyze = async (value = draft) => {
    const input = validate(value);
    if (!input) return;
    setAnalyzing(true); setAnalysis(null); setConfirmConflicts(false); setDismissedDuplicates(false);
    try {
      const response = await fetch("/api/conflicts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Analysis failed");
      setAnalysis(body); setAnalysisKey(JSON.stringify(input));
      setInfo(body.duplicates.length ? "Possible duplicate found. Review the existing event before deciding to continue." : body.conflicts.length ? "Conflict analysis complete. Review the signals below before publishing." : "No overlapping events found in the demo calendar.");
      if (sourceId) {
        const status = body.duplicates.length ? "DUPLICATE" : body.conflicts.some((item: Conflict) => item.score >= 60) ? "CONFLICT_FOUND" : "READY_TO_PUBLISH";
        const updated = await fetch(`/api/inbox/${encodeURIComponent(sourceId)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
        if (updated.ok) setSourceStatus(status);
        else setInfo("Analysis completed, but the inbox status could not be updated. You can retry the check.");
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not analyze conflicts"); }
    finally { setAnalyzing(false); }
  };

  const applyExtracted = (extracted: Record<string, unknown>, method: string, fields: Record<ExtractionField, FieldAssessment>) => {
    setDraft((current) => mergeExtracted(current, extracted));
    setInfo(`${method} created an editable draft. Check every field; nothing is published automatically.`);
    setExtractionFields(fields);
    setAnalysis(null); setDismissedDuplicates(false); setMode("manual");
  };

  const extract = async () => {
    if (!poster) { setError("Choose a PNG, JPEG or WebP poster first."); return; }
    setExtracting(true); setError(null); setInfo(null);
    try {
      const data = new FormData(); data.append("poster", poster);
      const response = await fetch("/api/extract", { method: "POST", body: data });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Extraction failed");
      applyExtracted(body.extracted, body.method, body.fields);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Automatic extraction unavailable. Enter details manually."); }
    finally { setExtracting(false); }
  };

  const extractAnnouncement = async () => {
    setExtracting(true); setError(null); setInfo(null);
    try {
      const response = await fetch("/api/extract", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: announcement }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not read announcement");
      applyExtracted(body.extracted, body.method, body.fields);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not read announcement. Enter details manually."); }
    finally { setExtracting(false); }
  };

  const loadSamplePoster = () => {
    try {
      const file = createSamplePoster();
      if (posterUrl) URL.revokeObjectURL(posterUrl);
      setPoster(file); setPosterUrl(URL.createObjectURL(file));
      setInfo("Sample poster loaded. Extraction will call the AI API only if a key is configured."); setError(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create sample poster"); }
  };

  const applySuggestion = (slot: SlotSuggestion) => {
    const next = { ...draft, date: slot.date, startTime: slot.startTime, endTime: slot.endTime };
    setDraft(next); setInfo("Suggested slot applied. Conflict scores have been recalculated.");
    void analyze(next);
  };

  const publish = async () => {
    const input = validate(draft);
    if (!input) return;
    if (!analysis || analysisKey !== JSON.stringify(input)) { setError("Run conflict analysis on the current event details before publishing."); return; }
    if (analysis.duplicates.length && !dismissedDuplicates) { setError("Review the possible duplicate and choose Continue anyway before publishing."); return; }
    if (analysis.conflicts.some((item) => item.score >= 60) && !confirmConflicts) { setError("Confirm that you reviewed the high-severity conflicts, or choose a suggested slot."); return; }
    setPublishing(true); setError(null);
    try {
      const response = await fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event: input, confirmConflicts, ...(sourceId ? { sourceId } : {}) }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Publishing failed");
      setPublishedId(body.id);
      if (sourceId) setSourceStatus("PUBLISHED");
      await refresh();
      router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not publish event"); }
    finally { setPublishing(false); }
  };

  if (publishedId) return <div className="page-wrap"><div className="panel publish-success"><CheckCircle2 size={40} /><h2>Your event is live in EventMesh.</h2><p>Students can discover and save it now. This is a local hackathon demo, not an official IITH announcement.</p><div><Link href={`/events/${publishedId}`} className="button button-primary">View published event <ArrowRight size={16} /></Link><Link href={`/organizer/events/${publishedId}/conflicts`} className="button button-secondary">View conflict intelligence</Link></div></div></div>;

  return <div className="page-wrap"><Link href={sourceId ? "/organizer/inbox" : "/organizer"} className="back-link"><ArrowLeft size={15} /> {sourceId ? "Source inbox" : "Organizer dashboard"}</Link><div className="page-header"><div><div className="section-kicker">CREATE A CAMPUS EVENT</div><h1 className="page-title">Create an event.</h1><p className="page-subtitle">Enter details, review conflicts, then publish.</p></div></div>
    <div className="workflow-steps" aria-label="Creation workflow"><span>01 &nbsp; Details</span><span>02 &nbsp; Analysis</span><span>03 &nbsp; Review & publish</span></div>
    <div className="form-layout"><div className="panel form-panel"><div className="form-tabs" role="group" aria-label="Event creation method"><button type="button" aria-pressed={mode === "manual"} className={`form-tab ${mode === "manual" ? "active" : ""}`} onClick={() => setMode("manual")}>Enter details manually</button><button type="button" aria-pressed={mode === "poster"} className={`form-tab ${mode === "poster" ? "active" : ""}`} onClick={() => setMode("poster")}>Upload poster</button><button type="button" aria-pressed={mode === "announcement"} className={`form-tab ${mode === "announcement" ? "active" : ""}`} onClick={() => setMode("announcement")}>Paste announcement</button></div>
      {mode === "announcement" && <div className="announcement-zone"><strong>Turn a scattered message into a structured event.</strong><p>Paste a club message or event announcement. With an API key, AI extracts details; otherwise a clearly labeled local parser handles common dates, times, venues and tags.</p><textarea aria-label="Event announcement" value={announcement} onChange={(event) => setAnnouncement(event.target.value)} placeholder="Hey everyone! Lambda is conducting an AI agents workshop tomorrow at 6 PM in LH3. Topics include LLMs, agents and RAG." /><div><button type="button" className="button button-secondary button-small" onClick={() => setAnnouncement(`Hey everyone! Lambda Club is hosting the Lambda AI Workshop on ${formatDate(addDays(todayInIsth(), 2), { weekday: undefined, month: "long", year: "numeric" })} from 6 PM to 7:30 PM in LH3. Learn practical AI and Programming with Machine Learning. Registration closes on ${formatDate(addDays(todayInIsth(), 1), { weekday: undefined, month: "long", year: "numeric" })}. See you there!`)}>Use demo announcement</button><button type="button" className="button button-primary button-small" disabled={extracting || announcement.trim().length < 15} onClick={() => void extractAnnouncement()}>{extracting ? "Reading…" : "Extract details"}</button></div></div>}
      {mode === "poster" && <div className="upload-zone"><UploadCloud size={29} /><strong>Upload an event poster</strong><p>PNG, JPEG or WebP · maximum 5 MB. Vision extraction requires an API key; manual entry always works.</p><input aria-label="Choose poster image" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { const file = event.target.files?.[0] ?? null; setPoster(file); if (posterUrl) URL.revokeObjectURL(posterUrl); setPosterUrl(file ? URL.createObjectURL(file) : null); }} />{posterUrl && <Image className="poster-preview" src={posterUrl} alt="Selected event poster preview" width={420} height={240} unoptimized />}<div style={{ marginTop: 14, display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}><button className="button button-secondary button-small" type="button" onClick={loadSamplePoster}>Use sample poster</button><button className="button button-primary button-small" type="button" disabled={extracting || !poster} onClick={() => void extract()}><FileImage size={15} />{extracting ? "Extracting details…" : "Extract event details"}</button></div></div>}
      <div className="panel-heading"><div><h2>Event details</h2><p className="form-intro">Review every field before publishing. All starred fields are required.</p></div><button type="button" className="button button-secondary button-small" onClick={() => { setDraft(demoDraft(events)); setExtractionFields(null); setAnalysis(null); setInfo("Demo example loaded into the form. This is sample input, not AI extraction."); setError(null); }}>Load demo example</button></div>
      {sourceId && <div className="notice" style={{ marginBottom: 14 }}>Inbox source · {sourceStatus?.replaceAll("_", " ")}. {sourcePreview && <Image src={sourcePreview} alt="Staged poster for organizer review" className="poster-preview" width={420} height={240} unoptimized />}</div>}
      {error && <div className="notice error" role="alert">{error}</div>}{info && <div className="notice" role="status" style={{ marginTop: error ? 8 : 0 }}>{info}</div>}
      <div className="form-grid" style={{ marginTop: 20 }}>
        <div className="form-group-label">Event</div>
        <div className="field full"><label htmlFor="title">Event title *</label><input id="title" value={draft.title} onChange={(event) => change("title", event.target.value)} placeholder="e.g. Applied AI Systems Lab" /><ReviewHint assessment={extractionFields?.title} />{fieldErrors.title && <span className="field-error">{fieldErrors.title}</span>}</div>
        <div className="field"><label htmlFor="organizer">Organizer *</label><input id="organizer" value={draft.organizer} onChange={(event) => change("organizer", event.target.value)} placeholder="e.g. Lambda Club" /><ReviewHint assessment={extractionFields?.organizer} />{fieldErrors.organizer && <span className="field-error">{fieldErrors.organizer}</span>}</div>
        <div className="field full"><label htmlFor="description">Description *</label><textarea id="description" value={draft.description} onChange={(event) => change("description", event.target.value)} placeholder="What will participants experience?" />{fieldErrors.description && <span className="field-error">{fieldErrors.description}</span>}</div>
        <div className="form-group-label">Schedule</div>
        <div className="field"><label htmlFor="date">Date *</label><input id="date" type="date" value={draft.date} onChange={(event) => change("date", event.target.value)} /><ReviewHint assessment={extractionFields?.date} />{fieldErrors.date && <span className="field-error">{fieldErrors.date}</span>}</div>
        <div className="field"><label htmlFor="startTime">Start time *</label><input id="startTime" type="time" value={draft.startTime} onChange={(event) => change("startTime", event.target.value)} /><ReviewHint assessment={extractionFields?.startTime} />{fieldErrors.startTime && <span className="field-error">{fieldErrors.startTime}</span>}</div>
        <div className="field"><label htmlFor="endTime">End time *</label><input id="endTime" type="time" value={draft.endTime} onChange={(event) => change("endTime", event.target.value)} /><ReviewHint assessment={extractionFields?.endTime} />{fieldErrors.endTime && <span className="field-error">{fieldErrors.endTime}</span>}</div>
        <div className="field"><label htmlFor="registrationDeadline">Registration deadline</label><input id="registrationDeadline" type="date" value={draft.registrationDeadline} onChange={(event) => change("registrationDeadline", event.target.value)} /><ReviewHint assessment={extractionFields?.registrationDeadline} />{fieldErrors.registrationDeadline && <span className="field-error">{fieldErrors.registrationDeadline}</span>}</div>
        <div className="form-group-label">Venue & audience</div>
        <div className="field"><label htmlFor="venue">Venue *</label><input id="venue" value={draft.venue} onChange={(event) => change("venue", event.target.value)} placeholder="e.g. LH3" /><ReviewHint assessment={extractionFields?.venue} />{fieldErrors.venue && <span className="field-error">{fieldErrors.venue}</span>}</div>
        <div className="field"><label htmlFor="expectedAudience">Expected audience</label><input id="expectedAudience" type="number" min="1" max="10000" value={draft.expectedAudience} onChange={(event) => change("expectedAudience", event.target.value)} placeholder="e.g. 100" />{fieldErrors.expectedAudience && <span className="field-error">{fieldErrors.expectedAudience}</span>}</div>
        <div className="form-group-label">Classification</div>
        <div className="field"><label htmlFor="category">Category *</label><select id="category" value={draft.category} onChange={(event) => change("category", event.target.value)}>{CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></div>
        <div className="field full"><label htmlFor="tags">Audience tags * <span className="field-help">(comma-separated)</span></label><input id="tags" value={draft.tags} onChange={(event) => change("tags", event.target.value)} placeholder="AI, Programming, Machine Learning" />{fieldErrors.tags && <span className="field-error">{fieldErrors.tags}</span>}</div>
      </div>
      <div id="venue-advisor"><VenueAdvisor request={{ date: draft.date, startTime: draft.startTime, endTime: draft.endTime, expectedAudience: Number(draft.expectedAudience), category: draft.category }} events={events} onSelect={(venue) => change("venue", venue)} /></div>
      <div className="form-actions"><button type="button" className="button button-primary" disabled={analyzing} onClick={() => void analyze()}><Radar size={17} />{analyzing ? "Checking conflicts…" : "Check conflicts"}</button><button type="button" className="button button-secondary" disabled={publishing || !analysis} onClick={() => void publish()}>{publishing ? "Publishing…" : "Publish event"} <ArrowRight size={16} /></button></div>
      {analysis && <section className="analysis-panel" aria-label="Conflict analysis results">{analysis.duplicates.length > 0 && !dismissedDuplicates && <div className="duplicate-panel"><h3>Possible duplicate detected</h3><p>These are similarity signals, not a publication block. Check the existing listing before continuing.</p>{analysis.duplicates.map((match) => <div className="duplicate-row" key={match.event.id}><div><strong>{match.event.title}</strong><small>{match.event.organizer} · {formatDate(match.event.date)} · {match.event.venue}</small><span>{match.reasons.join(" · ")}</span></div><strong>{match.score}%</strong><Link href={`/events/${match.event.id}`} target="_blank">View existing ↗</Link></div>)}<button type="button" className="button button-secondary button-small" onClick={() => setDismissedDuplicates(true)}>Continue anyway</button></div>}{dismissedDuplicates && <div className="notice" style={{ marginBottom: 18 }}>Duplicate warning reviewed. You can continue with conflict review and publishing.</div>}<h3>Conflict intelligence</h3>{analysis.conflicts.length ? <div className="conflict-list">{analysis.conflicts.map((conflict) => <div className={`conflict-card ${conflict.kind === "VENUE" ? "venue" : ""}`} key={conflict.eventId}><div className="conflict-top"><span>{conflict.kind === "VENUE" ? "Venue conflict" : "Audience overlap"} · {conflict.severity}</span><strong>{conflict.score}/100</strong></div><h4>{conflict.eventTitle}</h4><p>{conflict.eventTime} · {conflict.eventVenue}</p><ul>{conflict.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul></div>)}</div> : <div className="notice">Clear slot. No time overlap with events in this demo calendar.</div>}
        <div className="panel-heading" style={{ marginTop: 22 }}><h3>Lower-conflict alternatives</h3><Link href="/organizer/scheduling">Open Scheduling Intelligence →</Link></div><div className="suggestion-list">{analysis.suggestions.map((slot) => <button type="button" className="slot-button" key={`${slot.date}-${slot.startTime}`} onClick={() => applySuggestion(slot)}><strong>{formatDate(slot.date)}</strong><strong>{formatTime(slot.startTime)} – {formatTime(slot.endTime)}</strong><small>{slot.score}/100 score · {slot.venueCollision ? "venue busy" : "venue available"}</small><small>Use this slot ↗</small></button>)}</div>
        {analysis.conflicts.some((conflict) => conflict.score >= 60) && <label className="workflow-note" style={{ display: "flex", gap: 9, alignItems: "flex-start" }}><input type="checkbox" checked={confirmConflicts} onChange={(event) => setConfirmConflicts(event.target.checked)} /> I reviewed the high-severity conflicts and still want to publish this event.</label>}
      </section>}
    </div><aside className="panel side-note"><IntelligencePipeline hasInput={!!(sourceId || draft.title || draft.description)} extracted={!!extractionFields} extractionApplicable={!!sourceId || mode !== "manual"} valid={eventInputSchema.safeParse(asInput(draft)).success} analyzed={!!analysis && analysisKey === JSON.stringify(asInput(draft))} hasDuplicate={!!analysis?.duplicates.length} hasConflict={!!analysis?.conflicts.some((item) => item.score >= 60)} venueChosen={!!draft.venue} /><div className="readiness-card"><div className="section-kicker">EVENT READINESS</div><div className="readiness-score">{readiness.score}<small>/100</small></div><div className="readiness-track"><span style={{ width: `${readiness.score}%` }} /></div><p>A transparent completeness score. It never blocks publishing.</p><IntelligenceExplanation title="Why this readiness score?" reasons={readiness.items.filter((item) => item.earned > 0).map((item) => `${item.label}: +${item.points}`)} warnings={readiness.items.filter((item) => !item.earned).map((item) => `${item.label}: ${item.advice}`)} /></div><div className="section-kicker">HOW IT WORKS</div><h2>From idea to campus.</h2><p className="form-intro">A short, transparent workflow that keeps organizers in control.</p><div className="step-list"><div className="step-item"><span className="step-number">01</span><div><strong>Enter or extract details</strong><p>Upload a poster, paste an announcement, or fill the form yourself.</p></div></div><div className="step-item"><span className="step-number">02</span><div><strong>Review every field</strong><p>Extraction never creates an event automatically.</p></div></div><div className="step-item"><span className="step-number">03</span><div><strong>Check the campus</strong><p>Review duplicates, venue collisions, audience overlap and better slots.</p></div></div><div className="step-item"><span className="step-number">04</span><div><strong>Publish with confidence</strong><p>Your event appears in the discovery feed immediately.</p></div></div></div><div className="tip-box">Demo tip: use “Load demo example” to show both a venue collision at LH3 and audience overlap with the Programming Club contest.</div></aside></div>
  </div>;
}
