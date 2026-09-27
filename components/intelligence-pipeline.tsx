type Step = { label: string; done: boolean; detail: string };

export function IntelligencePipeline({ hasInput, valid, analyzed, hasDuplicate, hasConflict, venueChosen }: { hasInput: boolean; valid: boolean; analyzed: boolean; hasDuplicate: boolean; hasConflict: boolean; venueChosen: boolean }) {
  const steps: Step[] = [
    { label: "Event input", done: hasInput, detail: hasInput ? "Draft captured" : "Waiting for a source or manual details" },
    { label: "Schema validation", done: valid, detail: valid ? "Required fields and time order valid" : "Complete or correct the form" },
    { label: "Duplicate check", done: analyzed, detail: !analyzed ? "Run conflict analysis" : hasDuplicate ? "Possible duplicate requires review" : "No likely duplicate found" },
    { label: "Conflict check", done: analyzed, detail: !analyzed ? "Run conflict analysis" : hasConflict ? "High-severity overlap found" : "No high-severity overlap found" },
    { label: "Venue selection", done: venueChosen, detail: venueChosen ? "Venue entered; verify booking separately" : "Choose or enter a venue" },
    { label: "Organizer approval", done: false, detail: "Publication always requires your action" },
  ];
  return <section className="intelligence-pipeline" aria-label="Event intelligence pipeline"><span className="mini-label">EVENT INTELLIGENCE PIPELINE</span><h3>Review progress</h3><ol>{steps.map((step) => <li key={step.label} className={step.done ? "done" : "pending"}><span aria-hidden="true">{step.done ? "✓" : "○"}</span><div><strong>{step.label}</strong><small>{step.detail}</small></div></li>)}</ol></section>;
}
