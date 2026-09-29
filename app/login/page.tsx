import Link from "next/link";
import { redirect } from "next/navigation";
import { authConfigured } from "@/auth";
import { getCurrentUser } from "@/lib/current-user";
import { loginWithGoogle } from "@/app/auth-actions";
import { safeRedirectPath } from "@/lib/safe-redirect";

export const dynamic = "force-dynamic";

export default async function Login({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const callbackUrl = safeRedirectPath((await searchParams).callbackUrl);
  if (await getCurrentUser()) redirect(callbackUrl);
  return <div className="page-wrap auth-page"><section className="panel auth-card">
    <span className="mini-label">EVENTMESH / IIT HYDERABAD</span>
    <h1>Your campus events, organized around you.</h1>
    <p>Sign in to keep an account-backed schedule and choose interests. You can also save events on this device without signing in.</p>
    {authConfigured ? <form action={loginWithGoogle}><input type="hidden" name="callbackUrl" value={callbackUrl} /><button type="submit" className="button button-primary">Continue with Google →</button></form> : <div className="notice amber">Google sign-in is not configured here. Saved events can still be kept in this browser; they will not sync to other devices.</div>}
    <div className="auth-links"><Link href="/discover">Browse events</Link><Link href="/my-schedule">My schedule</Link><Link href="/demo">Explore guided demo</Link></div>
  </section></div>;
}
