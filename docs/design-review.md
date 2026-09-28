# EventMesh design review

## What changed

- Split the shared shell into a warm, publication-style student guide and a compact organizer workspace. Both use the EventMesh wordmark and one forest-green accent.
- Rebuilt the landing and Discover pages around real listings, a featured story, a chronological event index, quieter filters, and integrated Smart Search. Past listings have their own archive heading.
- Gave event detail pages an editorial hierarchy and My Schedule a day-planner timeline. Removed the repeated description in the detail hero.
- Reorganized event creation into visible groups and a short review sequence. Source intake, readiness, and the analysis pipeline retain their existing actions and status signals.
- Replaced colorful venue tiles with ranked room rows and expandable reasons. Conflict reports now scan as a risk ledger with lower-conflict alternatives.
- Restyled ranked scheduling options, the pressure heatmap, and the Event Mesh graph with neutral surfaces and restrained green data emphasis.
- Reduced decorative icons, gradients, large shadows, pills, and rounded panels. Typography, spacing, rules, and alignment carry the hierarchy.

## Visual checks

Reviewed the production app in a browser at desktop and 390px mobile widths: landing, Discover, event detail, My Schedule, organizer overview, create form and venue matches, source inbox, conflict report, scheduling and heatmap, and Event Mesh. Corrected low-contrast dashboard table titles and scheduling explanations, narrow venue columns, and mobile organizer table overflow found during review. The organizer table scrolls within its section on a narrow screen; the weekly heatmap has its own horizontal scroll.

## Behavior checks

- Discover filters changed the visible count; saving and removing a listing updated the control and persisted through the API.
- Smart Search returned four matching local listings for the seeded AI/programming query.
- The demo draft produced a possible duplicate, venue and audience conflicts, venue rankings, and lower-conflict slots. Choosing a suggested slot updated the form, cleared the time clash, and recalculated venue rankings.
- Scheduling returned ranked slots with explanations and a busy-slot comparison. Heatmap cells expose their score and evidence through labeled controls.
- Lint, TypeScript, 41 tests, offline evaluation fixtures, and the optimized production build passed after the UI work.

## Boundaries

The seeded event network and venue profiles are illustrative. Venue availability means no collision in EventMesh's local calendar, not a confirmed IIT Hyderabad booking. The optional OpenAI extraction paths still need a valid key for a live provider check; the local fallback works without one. No business engine, API contract, or database schema was changed for this redesign.
