import Link from "next/link";
import { ArrowRight, BrainCircuit, CalendarCheck2, CalendarClock, Compass, FileImage, Radar, ScanLine } from "lucide-react";

const capabilities = [
  { icon: Compass, title: "Discover", description: "Search the campus calendar, save events, and build a plan that fits your interests and time.", label: "01 / FIND" },
  { icon: BrainCircuit, title: "Understand", description: "Turn announcements into reviewed event details and see why a listing is relevant to you.", label: "02 / EXPLAIN" },
  { icon: Radar, title: "Coordinate", description: "Spot likely duplicates, venue collisions, and audience overlap before publishing.", label: "03 / CHECK" },
  { icon: CalendarClock, title: "Optimize", description: "Compare lower-conflict times and suitable venues using transparent scores.", label: "04 / PLAN" },
];

export default function Home() {
  return <div className="page-wrap landing-page">
    <div className="eyebrow"><span className="eyebrow-dot" /> THE CAMPUS EVENT NETWORK</div>
    <section className="landing-hero">
      <div className="landing-copy">
        <h1>Everything happening at IITH.<br /><em>Without the noise.</em></h1>
        <p>EventMesh turns fragmented campus announcements into an intelligent event network — helping students discover what matters and organizers schedule without conflicts.</p>
        <div className="hero-actions"><Link href="/discover" className="button button-primary">Explore Events <ArrowRight size={18} /></Link><Link href="/organizer/create" className="button button-secondary">Organize Smarter <ArrowRight size={18} /></Link></div>
        <div className="hero-proof"><span>Built for campus life</span><span>•</span><Link href="/demo">See the guided demo ↗</Link></div>
      </div>
      <div className="hero-visual" aria-label="From a poster to reviewed event intelligence, conflict detection, and smart scheduling">
        <div className="visual-flow-heading"><span className="visual-icon"><ScanLine size={23} /></span><div><strong>From signal to schedule</strong><small>One connected organizer workflow</small></div></div>
        <ol className="visual-flow">
          <li><FileImage size={18} /><div><strong>Poster or announcement</strong><small>Organizer supplies a source</small></div><span>01</span></li>
          <li><BrainCircuit size={18} /><div><strong>Event intelligence</strong><small>Extract, review, and validate details</small></div><span>02</span></li>
          <li><Radar size={18} /><div><strong>Conflict detection</strong><small>Check venue and audience overlap</small></div><span>03</span></li>
          <li><CalendarClock size={18} /><div><strong>Smart scheduling</strong><small>Compare lower-conflict alternatives</small></div><span>04</span></li>
        </ol>
        <small className="visual-flow-note">Illustrative workflow · organizer approves publication</small>
      </div>
    </section>
    <div className="section-heading"><div><span className="mini-label">THE EVENTMESH DIFFERENCE</span><h2>More than an event calendar.</h2></div><p>From scattered announcements to one coordinated campus experience.</p></div>
    <section className="feature-grid">{capabilities.map(({ icon: Icon, title, description, label }) => <div className="feature-card" key={title}><div className="feature-icon"><Icon size={22} /></div><h3>{title}</h3><p>{description}</p><span>{label}</span></div>)}</section>
    <section className="landing-cta"><div><CalendarCheck2 size={28} /><h2>Make the most of what’s happening.</h2><p>Your next great campus moment is one click away.</p></div><Link href="/demo" className="button button-primary">Try guided demo <ArrowRight size={18} /></Link></section>
  </div>;
}
