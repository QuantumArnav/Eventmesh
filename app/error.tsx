"use client";

import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="page-wrap"><div className="state-panel" role="alert"><AlertTriangle size={28} color="#ffb3ad" /><h3>Something interrupted EventMesh.</h3><p>Your local data is still here. Try this page again, or return to event discovery.</p><div style={{ display: "flex", gap: 9, marginTop: 8 }}><button className="button button-primary" type="button" onClick={reset}><RotateCcw size={15} /> Try again</button><Link href="/discover" className="button button-secondary">Discover events</Link></div></div></div>;
}
