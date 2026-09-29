"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, FileImage, Inbox } from "lucide-react";
import { useCampus } from "@/app/providers";

type InboxRow = { id: string; sourceType: "TEXT" | "POSTER"; label: string; status: string; publishedEventId: string | null; createdAt: string };

function OrganizerInboxEditor() {
  const [rows, setRows] = useState<InboxRow[]>([]);
  const [text, setText] = useState("");
  const [poster, setPoster] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const refresh = useCallback(async () => {
    const response = await fetch("/api/inbox", { cache: "no-store" });
    if (!response.ok) throw new Error("Could not load the source inbox.");
    setRows(await response.json());
  }, []);
  useEffect(() => { const timer = setTimeout(() => void refresh().catch((cause) => setError(cause instanceof Error ? cause.message : "Could not load inbox.")), 0); return () => clearTimeout(timer); }, [refresh]);
  const stage = async (kind: "TEXT" | "POSTER") => {
    setBusy(true); setError(""); setInfo("");
    try {
      let response: Response;
      if (kind === "TEXT") response = await fetch("/api/inbox", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
      else {
        if (!poster) throw new Error("Choose a poster image first.");
        const data = new FormData(); data.append("poster", poster);
        response = await fetch("/api/inbox", { method: "POST", body: data });
      }
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not stage source.");
      setInfo(body.status === "NEW" ? "Poster staged. AI extraction is unavailable; open it for manual review." : "Source staged with an editable extraction draft. Open it to review.");
      setText(""); setPoster(null);
      await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not stage source."); }
    finally { setBusy(false); }
  };
  return <div className="page-wrap"><div className="page-header"><div><div className="section-kicker"><Inbox size={15} /> EVENT SOURCE INBOX</div><h1 className="page-title">From signal to listing.</h1><p className="page-subtitle">Stage a poster or announcement, review the draft, then decide whether it is ready to publish.</p></div><Link href="/organizer/create" className="button button-secondary">Create manually <ArrowRight size={16} /></Link></div>
    <div className="notice">Sources stay in the local demo database. Poster images are stored locally for review; this is not a connected campus feed.</div>
    <div className="inbox-grid"><section className="panel inbox-panel"><div className="section-kicker">TEXT ANNOUNCEMENT</div><h2>Paste a message</h2><textarea aria-label="Announcement to stage" value={text} onChange={(event) => setText(event.target.value)} placeholder="Lambda Club is hosting an AI workshop on 29 September 2026 from 6 PM to 7:30 PM in LH3..." maxLength={5000} /><button type="button" className="button button-primary" disabled={busy || text.trim().length < 15} onClick={() => void stage("TEXT")}>Stage announcement</button></section>
      <section className="panel inbox-panel"><div className="section-kicker"><FileImage size={15} /> POSTER IMAGE</div><h2>Stage a poster</h2><p>PNG, JPEG or WebP · maximum 5 MB. If vision extraction is unavailable, the source waits for manual entry.</p><input aria-label="Poster to stage" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setPoster(event.target.files?.[0] ?? null)} /><button type="button" className="button button-primary" disabled={busy || !poster} onClick={() => void stage("POSTER")}>Stage poster</button></section></div>
    {error && <div className="notice error" role="alert">{error} <button type="button" className="button button-secondary button-small" onClick={() => void refresh().catch(() => setError("Could not load inbox."))}>Retry</button></div>}
    {info && <div className="notice" role="status">{info}</div>}
    <section className="panel inbox-list"><div className="panel-heading"><div><span className="mini-label">INCOMING SOURCES</span><h2>Review queue</h2></div><span className="mini-label">{rows.length} local items</span></div>
      {rows.length ? rows.map((row) => <div className="inbox-row" key={row.id}><div><strong>{row.label}</strong><small>{row.sourceType === "POSTER" ? "Poster" : "Text announcement"} · {new Date(row.createdAt).toLocaleString("en-IN")}</small></div><span className="inbox-status">{row.status.replaceAll("_", " ")}</span>{row.status === "PUBLISHED" && row.publishedEventId ? <Link href={`/events/${row.publishedEventId}`}>View event →</Link> : <Link href={`/organizer/create?source=${encodeURIComponent(row.id)}`}>Review →</Link>}</div>) : <p>No staged sources yet. Paste an announcement or upload a poster to start.</p>}
    </section>
  </div>;
}

export default function OrganizerInbox() {
  const { account, loading } = useCampus();
  if (loading) return <div className="page-wrap"><div className="notice">Loading organizer access…</div></div>;
  if (!account || !["ORGANIZER", "ADMIN"].includes(account.role)) return <div className="page-wrap"><section className="panel auth-card"><span className="mini-label">ORGANIZER WORKSPACE</span><h1>Organizer access is required.</h1><p>The source inbox is available to organizer accounts. You can explore the guided demo without signing in.</p><Link href={account ? "/account" : "/login?callbackUrl=%2Forganizer%2Finbox"} className="button button-primary">{account ? "View account" : "Sign in"} →</Link> <Link href="/demo" className="button button-secondary">Guided demo</Link></section></div>;
  return <OrganizerInboxEditor />;
}
