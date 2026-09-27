import { expect, it } from "vitest";
import { generateIcs } from "../lib/ics";
import type { EventData } from "../lib/types";

it("exports IST event times as UTC with escaped text", () => {
  const event: EventData = { id: "demo", title: "AI, Systems; Lab", organizer: "Lambda Club", description: "Learn practical AI.", date: "2026-09-29", startTime: "18:00", endTime: "19:30", venue: "LH3", category: "Workshop", tags: ["AI"], registrationDeadline: null, expectedAudience: 80, popularity: 80, isDemo: true };
  const ics = generateIcs([event]);
  expect(ics).toContain("DTSTART:20260929T123000Z");
  expect(ics).toContain("DTEND:20260929T140000Z");
  expect(ics).toContain("SUMMARY:AI\\, Systems\\; Lab");
  expect(ics).toContain("END:VCALENDAR\r\n");
});
