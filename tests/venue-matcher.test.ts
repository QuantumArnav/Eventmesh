import { describe, expect, it } from "vitest";
import { rankVenues, type VenueData, type VenueRequest } from "../lib/venue-matcher";
import type { EventData } from "../lib/types";

const venue = (name: string, capacity: number, projector = true): VenueData => ({ id: name, name, building: "Demo", area: "Academic zone", capacity, type: "Lecture hall", hasProjector: projector, hasAudioSystem: true, hasStage: false, indoor: true, accessible: true, description: null, isDemo: true });
const request: VenueRequest = { date: "2026-10-01", startTime: "18:00", endTime: "19:30", expectedAudience: 80, category: "Workshop", projector: true };

describe("deterministic venue matching", () => {
  it("prefers a comfortable fit to an oversized or undersized room", () => {
    const matches = rankVenues(request, [venue("small", 60), venue("ideal", 100), venue("huge", 500)], []);
    expect(matches.map((match) => match.venue.name)).toEqual(["ideal", "huge", "small"]);
    expect(matches[2].warnings.join(" ")).toContain("Too small");
  });
  it("penalizes missing requested facilities", () => {
    const matches = rankVenues(request, [venue("equipped", 100), venue("bare", 100, false)], []);
    expect(matches[0].venue.name).toBe("equipped");
    expect(matches[1].warnings.join(" ")).toContain("projector");
  });
  it("detects interval collisions in the listed calendar", () => {
    const existing = { id: "event", title: "Existing", organizer: "Club", description: "Demo event", date: request.date, startTime: "18:30", endTime: "20:00", venue: "ideal", category: "Technical", tags: ["AI"], registrationDeadline: null, expectedAudience: 50, popularity: 1, isDemo: true } satisfies EventData;
    const [match] = rankVenues(request, [venue("ideal", 100)], [existing]);
    expect(match.available).toBe(false);
    expect(match.warnings.join(" ")).toContain("overlaps");
  });
  it("ranks the available and suitable venue first", () => {
    const matches = rankVenues(request, [venue("ideal", 100), venue("huge", 500)], []);
    expect(matches[0].score).toBe(100);
    expect(matches[0].reasons.join(" ")).toContain("No collision");
  });
});
