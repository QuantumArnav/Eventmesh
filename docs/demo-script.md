# EventMesh judge demo (3–4 minutes)

## Before the timer

Run `npm ci`, copy `.env.example` to `.env`, run `npm run db:setup`, then `npm run dev`. Open `/discover`, `/organizer/scheduling`, `/event-mesh`, and `/demo` in browser tabs. No Google or OpenAI key is needed for this public guided demo. Seeded events and venue profiles are illustrative and are not official IITH records.

## 0:00–0:25 — Problem

“Campus events are scattered across messages, posters and club channels. Students miss what fits their interests and time. Organizers may choose the same room or compete for the same audience.”

## 0:25–1:05 — Student discovery

Open **Discover**. Show the campus guide and run **Smart Search** with “AI or programming after 6 PM tomorrow.” Expand **See interpreted filters**, then open one listed event. “The phrase becomes structured constraints; all results come from the database.” Point to the local demo label. Personal recommendation reasons appear after sign-in and interest selection.

## 1:05–1:35 — Student schedule

Open **Guided demo**. Show the proposed workshop beside the seeded Lambda workshop and programming contest, then follow the conflict and better-slot explanations. “The same engine helps students avoid a clash and helps organizers coordinate time and venue.” This path needs no account. With configured Google login, save events and open **My Schedule** for per-user priorities, **Build my plan**, and `.ics` export.

## 1:35–2:15 — Organizer input and human review

In **Guided demo**, walk through “How EventMesh Works”: source intake, extraction, validation, duplicate checking, conflict detection, venue matching, scheduling, and discovery. The organizer source inbox requires a signed-in account granted `ORGANIZER` or `ADMIN`. With one available, you can stage a disposable announcement, open **Review**, and show editable extraction; without an OpenAI key, call this the **local text parser**.

## 2:15–3:05 — Coordination and optimization

On `/demo`, show the possible duplicate, LH3 venue collision, programming audience overlap, ranked venue, and a lower-conflict slot. These are calculated from the seeded local calendar. Open **Scheduling** to show the weekly Event Pressure heatmap and inspect one busy cell. With an organizer account, `/organizer/create` also allows manual input and publication.

## 3:05–3:35 — Campus network and close

Open **Event Mesh** and select a node to show relationships between events, organizers, categories and interests. If asked for technical evidence, open `/demo` for the reproducible proposed-event scenario and point to `npm run evaluate` and `docs/evaluation.md`.

“EventMesh doesn't just list campus events. It helps the campus understand, coordinate and optimize them.”
