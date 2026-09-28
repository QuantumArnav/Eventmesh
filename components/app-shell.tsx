"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

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
  { href: "/organizer/venues", label: "Venues" },
  { href: "/organizer/intelligence", label: "Intelligence" },
  { href: "/event-mesh", label: "Event Mesh" },
  { href: "/demo", label: "Guided demo" },
];
const organizerMobileLinks = organizerLinks;

function organizerActive(pathname: string, hash: string, href: string) {
  if (href === "/organizer#upcoming-events") return (pathname === "/organizer" && hash === "#upcoming-events") || pathname.startsWith("/organizer/events/");
  if (href === "/organizer") return pathname === "/organizer" && hash !== "#upcoming-events";
  return pathname === href;
}

function isActive(pathname: string, href: string) {
  return pathname === href || (href === "/discover" && pathname.startsWith("/events/"));
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [hash, setHash] = useState("");
  const mobileNavRef = useRef<HTMLElement>(null);
  const organizer = pathname.startsWith("/organizer") || pathname === "/event-mesh" || pathname === "/demo";

  useEffect(() => {
    const syncHash = () => setHash(window.location.hash);
    syncHash();
    window.addEventListener("hashchange", syncHash);
    window.addEventListener("popstate", syncHash);
    return () => {
      window.removeEventListener("hashchange", syncHash);
      window.removeEventListener("popstate", syncHash);
    };
  }, [pathname]);

  useEffect(() => {
    const nav = mobileNavRef.current;
    const activeLink = nav?.querySelector<HTMLAnchorElement>('a[aria-current="page"]');
    if (!nav || !activeLink) return;
    const linkLeft = activeLink.getBoundingClientRect().left - nav.getBoundingClientRect().left + nav.scrollLeft;
    nav.scrollLeft = linkLeft - (nav.clientWidth - activeLink.clientWidth) / 2;
  }, [pathname, hash]);

  return <div className={`app-shell ${organizer ? "organizer-surface" : "student-surface"}`}>
    {organizer ? <aside className="sidebar organizer-sidebar">
      <Link href="/" className="brand">EventMesh<span className="brand-dot">.</span><small>IIT HYDERABAD</small></Link>
      <div className="sidebar-label">ORGANIZER WORKSPACE</div>
      <nav className="sidebar-nav" aria-label="Organizer navigation">
        {organizerLinks.map(({ href, label }) => <Link key={href} href={href} onClick={href.startsWith("/organizer#") ? () => setHash("#upcoming-events") : href === "/organizer" ? () => setHash("") : undefined} aria-current={organizerActive(pathname, hash, href) ? "page" : undefined} className={`nav-link ${organizerActive(pathname, hash, href) ? "active" : ""}`}>{label}</Link>)}
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
    <nav ref={mobileNavRef} className="mobile-nav" aria-label="Mobile navigation">
      {(organizer ? organizerMobileLinks : [...studentLinks, { href: "/organizer", label: "Organizer" }]).map(({ href, label }) => {
        const active = organizer ? organizerActive(pathname, hash, href) : isActive(pathname, href);
        return <Link key={href} href={href} onClick={organizer && href.startsWith("/organizer#") ? () => setHash("#upcoming-events") : organizer && href === "/organizer" ? () => setHash("") : undefined} aria-current={active ? "page" : undefined} className={active ? "active" : ""}>{label}</Link>;
      })}
      {organizer && <Link href="/discover">Student</Link>}
    </nav>
  </div>;
}
