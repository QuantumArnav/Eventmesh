"use client";

import Link from "next/link";
import { useState } from "react";
import { useCampus } from "@/app/providers";
import { logout } from "@/app/auth-actions";
import { INTERESTS } from "@/lib/interests";
import { LoadingState } from "@/components/loading";

export default function AccountPage() {
  const { account, student, loading, refresh } = useCampus();
  const [selection, setSelection] = useState<string[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const chosen = selection ?? student?.interests ?? [];
  async function saveInterests() {
    setSaving(true); setError("");
    try {
      const response = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ interests: chosen }) });
      if (!response.ok) throw new Error((await response.json()).error || "Could not save interests.");
      await refresh(); setSelection(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save interests."); }
    finally { setSaving(false); }
  }
  if (loading) return <div className="page-wrap"><LoadingState /></div>;
  if (!account) return <div className="page-wrap"><section className="panel auth-card"><h1>Sign in to view your account.</h1><p>Your saved events and interests belong to your account.</p><Link href="/login?callbackUrl=%2Faccount" className="button button-primary">Sign in →</Link></section></div>;
  return <div className="page-wrap auth-page"><section className="panel auth-card"><span className="mini-label">YOUR EVENTMESH ACCOUNT</span><h1>{account.name || "Your account"}</h1><p>{account.email} · {account.role.toLowerCase()}</p><form action={logout}><button type="submit" className="button button-secondary">Sign out</button></form></section>
    <section className="panel auth-card"><span className="mini-label">PERSONALIZE DISCOVER</span><h2>Your interests</h2><p>Choose a few topics to shape recommendations across Discover, event details, and your schedule.</p><div className="interest-options" role="group" aria-label="Choose your interests">{INTERESTS.map((interest) => <button key={interest} type="button" className={`filter-button ${chosen.includes(interest) ? "active" : ""}`} aria-pressed={chosen.includes(interest)} onClick={() => setSelection(chosen.includes(interest) ? chosen.filter((item) => item !== interest) : [...chosen, interest])}>{interest}</button>)}</div>{error && <div className="notice error" role="alert">{error}</div>}<button type="button" className="button button-primary" disabled={saving || selection === null} onClick={() => void saveInterests()}>{saving ? "Saving…" : "Save interests"}</button><p><Link href="/my-schedule">Go to my schedule →</Link></p></section></div>;
}
