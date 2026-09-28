type Step = { label: string; status: "done" | "pending" | "skipped"; detail: string };

export function IntelligencePipeline({ hasInput, extracted, extractionApplicable, valid, analyzed, hasDuplicate, hasConflict, venueChosen }: { hasInput: boolean; extracted: boolean; extractionApplicable: boolean; valid: boolean; analyzed: boolean; hasDuplicate: boolean; hasConflict: boolean; venueChosen: boolean }) {
  const steps: Step[] = [
    { label: "Event input", status: hasInput ? "done" : "pending", detail: hasInput ? "Draft captured" : "Waiting for a source or manual details" },
    { label: "Structured extraction", status: extracted ? "done" : extractionApplicable ? "pending" : "skipped", detail: extracted ? "Proposed fields loaded for review" : extractionApplicable ? "Extraction has not produced a draft" : "Manual entry does not use extraction" },
    { label: "Schema validation", status: valid ? "done" : "pending", detail: valid ? "Required fields and time order valid" : "Complete or correct the form" },
    { label: "Duplicate check", status: analyzed ? "done" : "pending", detail: !analyzed ? "Run conflict analysis" : hasDuplicate ? "Possible duplicate requires review" : "No likely duplicate found" },
    { label: "Conflict check", status: analyzed ? "done" : "pending", detail: !analyzed ? "Run conflict analysis" : hasConflict ? "High-severity overlap found" : "No high-severity overlap found" },
    { label: "Venue selection", status: venueChosen ? "done" : "pending", detail: venueChosen ? "Venue entered; verify booking separately" : "Choose or enter a venue" },
    { label: "Organizer approval", status: "pending", detail: "Publication always requires your action" },
  ];
  return <section className="intelligence-pipeline" aria-label="Event intelligence pipeline"><span className="mini-label">EVENT INTELLIGENCE PIPELINE</span><h3>Review progress</h3><ol>{steps.map((step) => <li key={step.label} className={step.status}><span aria-hidden="true">{step.status === "done" ? "✓" : step.status === "skipped" ? "–" : "○"}</span><div><strong>{step.label}</strong><small>{step.detail}</small></div></li>)}</ol></section>;
}
