const stages = [
  { name: "Event ingestion", method: "Source inbox and manual form", purpose: "Capture a poster, announcement, or organizer draft.", value: "Keeps the original input available for review." },
  { name: "Structured extraction", method: "Optional AI; local text parser fallback", purpose: "Propose event fields from a supplied source.", value: "Saves typing while leaving every field editable." },
  { name: "Validation", method: "Zod schema and organizer review", purpose: "Check required fields and time order.", value: "Prevents malformed listings from being published." },
  { name: "Duplicate detection", method: "Weighted title, organizer, date, time, venue, and tag similarity", purpose: "Surface likely copies of listed events.", value: "Avoids splitting attention across duplicate listings." },
  { name: "Conflict analysis", method: "Interval overlap, tag Jaccard similarity, and weighted scores", purpose: "Separate venue collisions from audience overlap.", value: "Shows the reasons behind scheduling risk." },
  { name: "Venue ranking", method: "Capacity, facilities, event fit, and listed-calendar availability", purpose: "Compare illustrative venue profiles.", value: "Helps organizers choose a suitable room; it is not a booking." },
  { name: "Recommendation", method: "Interest, category, time, demo popularity, and organizer affinity", purpose: "Rank events for each signed-in student's profile.", value: "Makes discovery more relevant and explainable." },
  { name: "Schedule optimization", method: "Candidate time search and weighted interval scheduling", purpose: "Suggest lower-conflict slots and compatible student plans.", value: "Helps both organizers and students use their time well." },
];

export function HowEventMeshWorks() {
  return <section className="panel judge-mode" aria-labelledby="judge-mode-title">
    <span className="mini-label">HOW EVENTMESH WORKS</span>
    <h2 id="judge-mode-title">Eight connected steps, visible decisions.</h2>
    <p>These are the product’s capabilities, not a claim that every stage ran for the sample above. The organizer review screen shows the live status of an individual draft.</p>
    <ol className="judge-stages">{stages.map((stage, index) => <li key={stage.name}>
      <span className="judge-stage-index">{String(index + 1).padStart(2, "0")}</span>
      <div><h3>{stage.name}</h3><dl><div><dt>Algorithm</dt><dd>{stage.method}</dd></div><div><dt>Purpose</dt><dd>{stage.purpose}</dd></div><div><dt>Why it matters</dt><dd>{stage.value}</dd></div></dl></div>
    </li>)}</ol>
  </section>;
}
