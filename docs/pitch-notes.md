# EventMesh pitch notes

## 20 seconds

“IITH events are scattered across posters and messages, while clubs can accidentally compete for the same venue and audience. EventMesh turns supplied announcements into reviewed listings, detects duplicates and clashes, ranks better rooms and times, and helps students build a feasible personal schedule. Every decision score is explained.”

## 60 seconds

“A student should not need to monitor every club channel to find a relevant event. An organizer should not discover a room or audience clash after publishing a poster. EventMesh is a campus event intelligence layer: organizers submit a poster, text, or form; review extracted details and uncertainty; inspect duplicate, venue, audience, and timing signals; then publish. Students search in natural language, see why an event fits their interests, and use weighted interval scheduling to choose compatible events. Our algorithms run on local demo data and are measured with a small synthetic evaluation set. This is a working prototype, not an official IITH calendar or booking authority.”

## Three-minute technical explanation

1. **Input and validation (0:00–0:40).** The optional OpenAI Responses API extracts fields from a supplied poster or announcement. Without a key, a deterministic text parser handles common phrases. Ambiguous relative dates and incomplete venues stay empty. Organizers edit fields, and Zod validates before publication.
2. **Coordination (0:40–1:35).** Duplicate detection combines title token Jaccard/edit similarity with organizer, date, time, venue, and tags. The conflict engine requires real interval overlap, then scores venue collision or audience similarity. Slot suggestions reuse that engine. Venue ranking combines occupancy fit, requested facilities, local-calendar collisions, venue type, and concurrent pressure; all venue metadata is illustrative.
3. **Student side (1:35–2:20).** Smart Search turns natural language into a validated filter; results only come from stored events. Recommendations use explicit interest/category/time/popularity/organizer weights. A weighted interval scheduling DP chooses the highest-utility non-overlapping saved plan, including priority boosts.
4. **Evidence and limits (2:20–3:00).** `npm run evaluate` measures synthetic duplicate, extraction, conflict, schedule, and venue cases. The report names failures and does not extrapolate to real campus accuracy. Official identity, calendar, and room-booking integrations are future work.

## Judge questions

**Why not Google Calendar?** It manages a person's calendar well. EventMesh adds organizer-side duplicate, audience, venue, and slot reasoning across a shared event network before publication. A real integration could export confirmed events to personal calendars; `.ics` export already works locally.

**Why not WhatsApp?** Club messages distribute announcements but do not create a searchable, validated network or detect cross-club scheduling clashes. EventMesh only processes content users intentionally submit; it does not scrape private chats.

**Why use AI?** Posters and free-form announcements are unstructured. AI can reduce retyping for a supplied source. Core scoring and decisions are deterministic and work without an API key; extraction always requires organizer review.

**How does conflict detection work?** First require overlapping date/time intervals. A same-room conflict scores from a higher base plus overlap and shared audience; different-room conflicts use overlap, tag Jaccard similarity, category, and bounded turnout. The UI shows component reasons and ranked alternatives.

**What if extraction is wrong?** Fields remain editable, uncertain fields are flagged, ambiguous values remain null, Zod validates required fields, and nothing is auto-published. The optional AI path has not been live-evaluated with a key.

**Where is the data from?** Nineteen seeded campus-style events, seven illustrative venue profiles, and one demo student. They are invented for demonstration and are not official IITH data. User-staged sources and organizer-created listings remain in local SQLite.

**How would it scale?** Pure algorithms and database access are separated from the UI. A production service would move from local SQLite to a managed database, add identity/authorization, index event date/time and venue, and benchmark the engines on larger real datasets. No current throughput claim is made.

**What prevents duplicates?** Candidate similarity warns about near duplicates; an exact existing listing is rejected by the API. Newly created events also receive a unique hash key to prevent concurrent identical submissions.

**How are recommendations calculated?** A bounded weighted score: interest overlap 45, category 20, time suitability 15, demo popularity 10, organizer affinity 10. The plan adds Saved/Must Attend priority boosts and solves the interval selection problem with dynamic programming.

**Why IITH?** The motivating scenario is a compact campus with multiple clubs and shared student audiences. A single venue collision or same-audience clash is visible across groups in EventMesh. The current example records are illustrative, so measured campus impact is still unknown.

**How would official systems connect?** With institutional approval: replace demo sources with verified organizer feeds, add campus authentication, and read official room availability through an adapter. A booking action would need explicit permission and server-side authorization. The prototype does not claim those integrations exist.
