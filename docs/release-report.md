# EventMesh Release Report

## Release commit

`5b7e67e152adcd1e37cf9a5a33881ce080a3795f` (final application and CI code; this report follows in a documentation commit).

## Quality Gates

| Check | Result |
| --- | --- |
| npm ci | Passed in the clean release clone: 433 packages installed |
| Database setup | Passed: five migrations and 19 seeded demo events; `db:deploy` rerun preserved data |
| Lint | Passed after final code changes |
| TypeScript | Passed after final code changes |
| Unit tests | 43/43 passed after final code changes |
| Evaluation | Passed after final code changes; see `docs/evaluation.md` |
| Production build | Passed in the clean release clone and final CI |
| npm audit | Zero vulnerabilities in the clean clone and final CI |
| Docker build | Passed in [final CI](https://github.com/QuantumArnav/Eventmesh/actions/runs/36462480659) |
| Docker smoke test | Passed: health, event write, container recreation using the same volume, and event readback |
| CI | [Final implementation CI run](https://github.com/QuantumArnav/Eventmesh/actions/runs/36462480659) completed successfully |

## Functional Verification

Student:
- Discover: browser checked with seeded listings and filters.
- Search: ordinary search checked.
- Smart Search: browser checked; phrase regressions for time windows and saved-schedule conflicts fixed, unit tested, and verified against an isolated production API (13 and 15 results respectively).
- Event detail: browser checked with recommendations and QR display.
- Save: browser checked.
- Preferences: Must Attend priority checked.
- Build My Plan: browser checked; selected six events and skipped one clash in the seeded case.
- ICS: export button activated; generated content unit tested. The browser download event was not captured.

Organizer:
- Manual creation: validation and successful publication checked.
- Text ingestion: staged, reviewed, corrected, and published.
- Poster flow: valid PNG staged for manual review without an API key; mislabeled image rejected.
- Readiness: form and publish validation checked.
- Duplicate detection: possible duplicate shown at 92% in the demo example.
- Conflict detection: venue and audience conflicts shown.
- Alternative slots: lower-conflict slot shown.
- Venue matching: ranked alternative venue shown.
- Scheduling: route and pressure view checked.
- Heatmap: checked in the scheduling view.
- Event Mesh: route and graph interaction checked.
- Publishing: a unique event appeared in Discover; a reviewed text source also published.

## OpenAI Live Validation

NOT TESTED

Reason: no `OPENAI_API_KEY` was available. Mocked provider tests and deterministic fallbacks passed. AI never auto-publishes.

## Deployment

Status: BLOCKED EXTERNALLY. The Docker image and persistent-volume recipe are prepared; a durable hosting account has not been provided.

URL: none verified. The previously shared Cloudflare tunnel is temporary and depends on local processes.

Persistence verified: yes, in GitHub Actions. The test wrote an event, removed the first container, started a new container with the same mounted directory, and found the event through `/api/events`. This does not verify persistence on an external host that has not yet been deployed.

## Responsive Testing

390px: 11 routes checked, no page-level horizontal overflow.

768px: 11 routes checked, no page-level horizontal overflow.

1440px: 11 routes checked, no page-level horizontal overflow.

Intentional scrolling inside tables and the graph remains.

## Accessibility

Checks performed: keyboard Tab path through navigation and labeled form fields, visible focus outline, form labels, semantic controls, reduced-motion styling, and mobile layout inspection. This is a targeted check, not a formal assistive-technology audit.

Lighthouse if available: not run; no score is claimed.

## Evaluation

Reference [docs/evaluation.md](evaluation.md). The fixture set is small and synthetic; it does not establish real campus accuracy.

## Reviewer Feedback

Reports received: 0 accessible public issues or pull requests; private friend feedback not supplied here.

Reports reproduced: 0 external reports.

P0 fixed: none attributed to external reviewers.

P1 fixed: none attributed to external reviewers; internal hardening findings are recorded in [feedback-triage.md](feedback-triage.md).

Deferred: any future reviewer report requires reproduction and severity triage.

## Known Limitations

- The listings, student profile, and venue data are illustrative, not official IITH records or bookings.
- The shared demo profile has no authentication, moderation, or retention policy. A public instance needs disposable content and access protection.
- SQLite needs one app instance, a persistent volume, and backups for a durable demo.
- Live OpenAI behavior, a durable public URL, a formal screen-reader audit, and Lighthouse results are unverified.

## Submission Status

READY WITH EXTERNAL DEPLOYMENT STEP

The application, no-key demo, and clean local release checks are ready for GitHub-only review. Final CI and its persistence test passed. A durable public URL still requires a hosting account with a persistent SQLite volume and a real-device verification pass described in [deployment.md](deployment.md).
