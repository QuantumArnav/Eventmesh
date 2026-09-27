import { expect, it } from "vitest";
import { audienceSimilarity, buildEventMesh } from "../lib/event-graph";
import type { EventData } from "../lib/types";

const make = (id: string, tags: string[]): EventData => ({ id, title: id, organizer: "Club", description: "A demo campus event.", date: "2026-09-29", startTime: "18:00", endTime: "19:30", venue: "LH3", category: "Workshop", tags, registrationDeadline: null, expectedAudience: 80, popularity: 70, isDemo: true });

it("connects events only through real shared audience tags", () => {
  const a = make("a", ["AI", "Programming"]), b = make("b", ["Programming", "Algorithms"]), c = { ...make("c", ["Music"]), category: "Cultural" as const };
  expect(audienceSimilarity(a, b).similarity).toBe(33);
  expect(audienceSimilarity(a, c).similarity).toBe(0);
  const mesh = buildEventMesh([a, b, c]);
  expect(mesh.audienceLinks.map((link) => `${link.left}-${link.right}`)).toEqual(["a-b"]);
  expect(mesh.tags).toContain("Programming");
  expect(mesh.categories).toEqual(["Workshop", "Cultural"]);
});
