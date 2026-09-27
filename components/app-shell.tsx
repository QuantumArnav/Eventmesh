"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, CalendarDays, Compass, LayoutDashboard, Plus, Sparkles } from "lucide-react";

const links = [
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/my-schedule", label: "My Schedule", icon: CalendarDays },
  { href: "/organizer", label: "Organizer", icon: LayoutDashboard },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return <div className="app-shell">
    <aside className="sidebar">
      <Link href="/" className="brand"><span className="brand-mark"><Sparkles size={20} strokeWidth={2.4} /></span><span>eventmesh<span className="brand-dot">.</span><small>IIT HYDERABAD</small></span></Link>
      <div className="sidebar-label">CAMPUS NETWORK</div>
      <nav className="sidebar-nav" aria-label="Main navigation">
        {links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`nav-link ${pathname === href || (href === "/discover" && pathname.startsWith("/events/")) ? "active" : ""}`}><Icon size={18} />{label}</Link>)}
      </nav>
      <div className="sidebar-label organizer-label">FOR ORGANIZERS</div>
      <Link href="/organizer/create" className={`nav-link ${pathname === "/organizer/create" ? "active" : ""}`}><Plus size={18} />Create event</Link>
      <div className="sidebar-spacer" />
      <div className="sidebar-foot">
        <div className="live-indicator"><span /> DEMO ENVIRONMENT</div>
        <p>Sample campus events for a working product demonstration.</p>
        <Link href="/organizer/create">Bring your next event to life <ArrowUpRight size={15} /></Link>
      </div>
    </aside>
    <div className="main-column">
      <header className="topbar">
        <div className="topbar-left"><span className="topbar-pulse" /> Smart campus, better connected <span className="topbar-separator">/</span> <strong>Event intelligence</strong></div>
        <div className="topbar-right"><span className="demo-pill">DEMO DATA</span><Link href="/organizer/create" className="topbar-create"><Plus size={16} /> Create event</Link></div>
      </header>
      <main>{children}</main>
    </div>
    <nav className="mobile-nav" aria-label="Mobile navigation">{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={pathname === href ? "active" : ""}><Icon size={19} /><span>{label}</span></Link>)}<Link href="/organizer/create"><Plus size={19} /><span>Create</span></Link></nav>
  </div>;
}
