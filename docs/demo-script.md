# EventMesh judge demo (3–4 minutes)

## Before the timer

Run `npm ci`, copy `.env.example` to `.env`, run `npm run db:setup`, then `npm run dev`. Open `/demo` in one browser tab, `/organizer/create` in another, and `/discover` in a third. The seeded scenario is relative to the date the database was first created. No API key is needed for the text demo.

## 0:00–0:35 — The problem

“Campus events arrive as posters, messages, and club announcements. Students miss relevant events; organizers can accidentally compete for the same room and audience. EventMesh connects discovery with scheduling intelligence.”

Show the `/demo` proposed workshop and the disclaimer: all current records and venue capacities are illustrative, not official IITH data.

## 0:35–1:20 — Calculated coordination signals

On `/demo`, point to the possible duplicate, venue collision, audience overlap, lower-conflict time, and ranked rooms. Say: “These results are calculated by the same engines used in the organizer form. They are not canned screenshots or official booking status.”

## 1:20–2:15 — Organizer workflow

At `/organizer/create`, click **Load demo example**. Show the venue recommendations, select one, and click **Check conflicts**. Explain occupancy fit, requested facilities, listed-calendar collisions, and duplicate similarity. Show `/organizer/inbox` briefly if time allows: sources are staged for review and publication changes their state. Do not publish during the timed demo unless judges ask; publication writes a new local event.

Then select **Paste announcement**, click **Use demo announcement** and **Extract details**. Point to the **Local text parser** label and confidence cues. Say: “Without an API key this is deterministic parsing. Ambiguous dates stay empty, and the organizer must confirm all fields.”

## 2:15–3:05 — Student value

At `/discover`, try **Smart Search** with “AI or programming events after 6 PM tomorrow.” Expand **See interpreted filters**. Open a returned event and show the recommendation reasons. Then show `/my-schedule` and click **Build my plan** to demonstrate weighted interval scheduling across saved choices.

## 3:05–3:45 — Credibility and close

Point to the Event Pressure heatmap at `/organizer/scheduling` if time allows. Say: “We separate extraction, deterministic algorithms, and analytics. The offline evaluation script is runnable with `npm run evaluate`; its small synthetic fixture results and limitations are in `docs/evaluation.md`. Official venue feeds and real-world evaluation are future integration work.”

Close: “EventMesh helps organizers coordinate earlier and students choose what actually fits their interests and time.”
