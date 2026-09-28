# EventMesh judge demo (3–4 minutes)

## Before the timer

Run `npm ci`, copy `.env.example` to `.env`, run `npm run db:setup`, then `npm run dev`. Open `/discover`, `/my-schedule`, `/organizer/create`, `/organizer/scheduling`, `/event-mesh`, and `/demo` in browser tabs. No API key is needed for this local-rule demo. Seeded events and venue profiles are illustrative and are not official IITH records.

## 0:00–0:25 — Problem

“Campus events are scattered across messages, posters and club channels. Students miss what fits their interests and time. Organizers may choose the same room or compete for the same audience.”

## 0:25–1:05 — Student discovery

Open **Discover**. Show the campus guide and run **Smart Search** with “AI or programming after 6 PM tomorrow.” Expand **See interpreted filters**, then open one listed event. “The phrase becomes structured constraints; all results come from the database.” Point to the recommendation reason and local demo label.

## 1:05–1:35 — Student schedule

Save that event, open **My Schedule**, mark one choice **Must Attend**, and click **Build my plan**. Show a selected event and a skipped clash. “Weighted interval scheduling maximizes total relevance and priority while keeping the plan conflict free.” Click **Export my plan** to demonstrate `.ics` export.

## 1:35–2:15 — Organizer input and human review

Switch to **Organizer**, then **Source inbox**. Paste a short announcement and click **Stage announcement**; open **Review**. Show the editable extracted fields and confidence cues. Without a key, call this the **local text parser**. A poster can also be staged, but without a provider key its fields require manual entry. “Extraction never publishes.” Avoid publishing a new event during the timed demo.

## 2:15–3:05 — Coordination and optimization

Open **Create event**, click **Load demo example**, then **Check conflicts**. Show the possible duplicate, LH3 venue collision, programming audience overlap, ranked venue, and a lower-conflict slot. These are calculated from the seeded local calendar. Open **Scheduling** to show the weekly Event Pressure heatmap and inspect one busy cell.

## 3:05–3:35 — Campus network and close

Open **Event Mesh** and select a node to show relationships between events, organizers, categories and interests. If asked for technical evidence, open `/demo` for the reproducible proposed-event scenario and point to `npm run evaluate` and `docs/evaluation.md`.

“EventMesh doesn't just list campus events. It helps the campus understand, coordinate and optimize them.”
