# Future campus integrations

EventMesh currently accepts organizer-supplied text and poster files. It does not read private chats, email, club feeds, or official campus systems. The current local SQLite store is the source of truth for its demo decisions.

An official deployment could replace the source ingestion boundary with adapters that produce the same review draft:

```ts
type EventSourceAdapter = {
  kind: "poster" | "text" | "official-calendar" | "email";
  ingest(input: unknown): Promise<{
    sourceReference: string;
    proposedEvent: unknown;
    evidence: string[];
  }>;
};
```

`PosterSource` and `TextSource` correspond to the two organizer-provided paths today. An `OfficialCalendarSource` or consented `EmailSource` would be future adapters; neither exists in this repository. Every adapter would still feed schema validation, organizer review, duplicate detection, and conflict analysis before publication.

Other integration boundaries are identity and authorization, verified club feeds, official venue inventory and reservations, and a campus calendar. Those would need IIT Hyderabad approval and data contracts. The illustrative venue capacity and availability signals must never be presented as official bookings.
