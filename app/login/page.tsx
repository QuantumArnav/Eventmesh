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
    <p>Sign in to save events, choose interests, and build a personal schedule.</p>
    {authConfigured ? <form action={loginWithGoogle}><input type="hidden" name="callbackUrl" value={callbackUrl} /><button type="submit" className="button button-primary">Continue with Google →</button></form> : <div className="notice amber">Google sign-in is not configured on this deployment. You can still browse events and try the guided demo.</div>}
    <div className="auth-links"><Link href="/discover">Browse events</Link><Link href="/demo">Explore guided demo</Link></div>
  </section></div>;
}
