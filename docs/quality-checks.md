# Final quality checks — 28 September 2026

## Clean release clone

The release was tested in separate temporary clones so the already shared preview could keep running. With Node.js 24.19.0, the following completed successfully:

| Gate | Actual result |
| --- | --- |
| `npm ci` | 433 packages installed; zero reported vulnerabilities |
| `DATABASE_URL=file:./data/ci.db npm run db:setup` | Five committed migrations applied; 19 demo events and six saved choices seeded |
| `npm run db:deploy` again | No pending migrations; existing events preserved |
| `npm run lint` | Passed again after final Smart Search and request-limit changes |
| `npm run typecheck` | Passed again after final code changes |
| `npm test` | 43 tests passed in 11 files after final code changes |
| `npm run evaluate` | Passed again after final code changes; exact synthetic results below |
| `npm run build` | Passed in a clean clone of `6885064`; 22 app pages generated, API and dynamic routes compiled |
| `npm audit --audit-level=moderate` | Zero vulnerabilities reported again after final code changes |
| `npm run dev` | Started on port 3400; `/`, `/discover`, and `/api/health` returned 200 |
| `npm run start` | Started on port 3300 against the isolated SQLite file; `/api/health` returned `{"status":"ok"}` |
| GitHub Actions | [Final implementation CI for `5b7e67e`](https://github.com/QuantumArnav/Eventmesh/actions/runs/36462480659) passed every gate, including Docker build and persistent-volume write/recreate/read smoke test. |

The local sandbox initially blocked child-process or network operations for some commands; the gates above passed when rerun with the required execution permissions. Those initial environment errors were not application test failures.

## Offline evaluation

The small synthetic fixture run reported: duplicate TP 4, FP 0, FN 0 (precision/recall/F1 1.00 on eight pairs); text parser title 12/15, date 15/15, venue 13/15, start time 15/15, organizer 14/15; conflict 6/6; venue top match 5/5; and the constructed weighted-schedule case chose two compatible events over the greedy choice. See [evaluation.md](evaluation.md) for failures and limits. These figures do not measure real IITH accuracy.

## Browser flows

In isolated production databases, a real browser completed:

- Landing → Discover → date/category filters → ordinary search → Smart Search → event details → save → My Schedule → Must Attend priority → Build My Plan → export-button activation. The plan selected six events and skipped one clash in the seeded scenario. The `.ics` content has separate unit tests; the browser download event itself was not captured by this environment.
- Organizer manual entry: empty-form validation, demo example, 92% possible duplicate, two venue collisions, audience overlap, ranked venue and earlier slot, then a unique event was published and appeared in Discover.
- Source Inbox: staged a text announcement, reviewed uncertain extracted fields, corrected them, checked conflicts, published, and saw the linked event. A valid PNG poster staged as `NEW` without an API key and opened for manual review. A PNG declaration over JPEG bytes was rejected with a clear error.
- `/demo` showed a calculated possible duplicate, venue and audience conflicts, lower-conflict times, and venue matches.
- All 11 requested routes loaded at 390, 768, and 1440 pixel viewports: `/`, `/discover`, `/my-schedule`, `/organizer`, `/organizer/create`, `/organizer/inbox`, `/organizer/scheduling`, `/event-mesh`, `/demo`, an event detail, and an organizer conflict detail. No page-level horizontal overflow was measured. Tables and graph can scroll within their own bounds.
- Keyboard Tab traversed organizer navigation, creation modes, demo example, and labeled form fields in order. The focused field had a solid visible outline. The tested browser tab recorded no console warnings or errors.

The screenshots in `docs/assets/` came from the production build and fresh seed. A formal screen-reader audit and Lighthouse score were not run, so no numerical accessibility or performance claim is made.

## Security and deployment limits

Posters now require a full PNG, JPEG, or WebP decode with a pixel cap; requests have a total-body cap and files a 5 MB cap. The source review status update is conditional so publication cannot be undone by a concurrent review request. The tracked-file scan found no database, `.env` secret, private-key marker, or API-key pattern. `.env.example` is intentionally tracked.

The optional OpenAI live provider test was skipped because no `OPENAI_API_KEY` was available. Mocked provider paths and local fallback tests passed. The local Docker daemon was unavailable, but GitHub Actions built the image and verified SQLite persistence across container recreation with a mounted directory. An earlier smoke script failed at event readback; the final check looks up the uniquely named event in the database-backed event listing without passing an ID between CI steps. No durable public hosting URL has been verified; see [deployment.md](deployment.md). Public demo access needs protection because this prototype has no authentication or moderation.
