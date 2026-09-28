"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const studentLinks = [
  { href: "/discover", label: "Discover" },
  { href: "/my-schedule", label: "My Schedule" },
];

const organizerLinks = [
  { href: "/organizer", label: "Overview" },
  { href: "/organizer#upcoming-events", label: "Events" },
  { href: "/organizer/create", label: "Create event" },
  { href: "/organizer/inbox", label: "Source inbox" },
  { href: "/organizer/scheduling", label: "Scheduling" },
  { href: "/organizer/create#venue-advisor", label: "Venues" },
  { href: "/organizer/scheduling#heatmap", label: "Intelligence" },
  { href: "/event-mesh", label: "Event Mesh" },
  { href: "/demo", label: "Guided demo" },
];
const organizerMobileLinks = organizerLinks.filter(({ label }) => ["Overview", "Create event", "Source inbox", "Scheduling", "Event Mesh"].includes(label));

function isActive(pathname: string, href: string) {
  return pathname === href || (href === "/discover" && pathname.startsWith("/events/"));
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const organizer = pathname.startsWith("/organizer") || pathname === "/event-mesh" || pathname === "/demo";
  return <div className={`app-shell ${organizer ? "organizer-surface" : "student-surface"}`}>
    {organizer ? <aside className="sidebar organizer-sidebar">
      <Link href="/" className="brand">EventMesh<span className="brand-dot">.</span><small>IIT HYDERABAD</small></Link>
      <div className="sidebar-label">ORGANIZER WORKSPACE</div>
      <nav className="sidebar-nav" aria-label="Organizer navigation">
        {organizerLinks.map(({ href, label }) => <Link key={href} href={href} className={`nav-link ${isActive(pathname, href) ? "active" : ""}`}>{label}</Link>)}
      </nav>
      <div className="sidebar-spacer" />
      <Link href="/discover" className="sidebar-switch">← Student mode</Link>
      <p className="sidebar-demo">Local demonstration data</p>
    </aside> : null}
    <div className="main-column">
      {organizer ? <header className="topbar organizer-topbar">
        <div className="topbar-left"><span>EventMesh</span><span className="topbar-separator">/</span><strong>Organizer</strong></div>
        <div className="topbar-right"><span className="demo-pill">DEMO DATA</span><Link href="/discover" className="topbar-switch">Student mode →</Link></div>
      </header> : <header className="topbar student-topbar">
        <Link href="/" className="student-brand">EventMesh<span>.</span><small>IITH</small></Link>
        <nav aria-label="Student navigation" className="student-nav">{studentLinks.map(({ href, label }) => <Link key={href} href={href} className={isActive(pathname, href) ? "active" : ""}>{label}</Link>)}</nav>
        <div className="topbar-right"><span className="demo-pill">DEMO DATA</span><Link href="/organizer" className="topbar-switch">Organizer ↗</Link></div>
      </header>}
      <main>{children}</main>
    </div>
    <nav className="mobile-nav" aria-label="Mobile navigation">
      {(organizer ? organizerMobileLinks : [...studentLinks, { href: "/organizer", label: "Organizer" }]).map(({ href, label }) => <Link key={href} href={href} className={isActive(pathname, href) ? "active" : ""}>{label}</Link>)}
      {organizer && <Link href="/discover">Student</Link>}
    </nav>
  </div>;
}
