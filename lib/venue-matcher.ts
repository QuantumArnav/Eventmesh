import { minutes } from "./dates";
import type { EventData } from "./types";

export type VenueData = {
  id: string;
  name: string;
  building: string;
  area: string;
  capacity: number;
  type: string;
  hasProjector: boolean;
  hasAudioSystem: boolean;
  hasStage: boolean;
  indoor: boolean;
  accessible: boolean;
  description: string | null;
  isDemo: boolean;
};

export type VenueRequest = {
  date: string;
  startTime: string;
  endTime: string;
  expectedAudience: number;
  category: string;
  preferredArea?: string;
  projector?: boolean;
  audioSystem?: boolean;
  stage?: boolean;
  accessible?: boolean;
};

export type VenueMatch = { venue: VenueData; score: number; reasons: string[]; warnings: string[]; available: boolean };

export function rankVenues(request: VenueRequest, venues: VenueData[], events: EventData[]): VenueMatch[] {
  return venues.map((venue) => {
    const reasons: string[] = [];
    const warnings: string[] = [];
    const occupancy = request.expectedAudience / venue.capacity;
    let capacity = 0;
    if (occupancy > 1) warnings.push(`Too small by ${request.expectedAudience - venue.capacity} seats (demo estimate).`);
    else if (occupancy >= 0.55 && occupancy <= 0.9) { capacity = 30; reasons.push("Audience fits comfortably without excessive unused space."); }
    else if (occupancy < 0.55) { capacity = Math.max(5, Math.round(30 * occupancy / 0.55)); warnings.push("Consider a smaller room to avoid excess empty space."); }
    else { capacity = 23; warnings.push("Near capacity; allow room for walk-ins."); }

    const needs = [
      [request.projector, venue.hasProjector, "projector"],
      [request.audioSystem, venue.hasAudioSystem, "audio system"],
      [request.stage, venue.hasStage, "stage"],
      [request.accessible, venue.accessible, "accessible entry"],
    ] as const;
    const required = needs.filter(([needed]) => needed);
    const missing = required.filter(([, available]) => !available).map(([, , label]) => label);
    const facilities = required.length ? Math.round(25 * (required.length - missing.length) / required.length) : 25;
    if (missing.length) warnings.push(`Missing requested: ${missing.join(", ")}.`);
    else reasons.push(required.length ? "All requested facilities are listed." : "No special facilities requested.");

    const sameDay = events.filter((event) => event.date === request.date);
    const overlapping = sameDay.filter((event) => minutes(event.startTime) < minutes(request.endTime) && minutes(event.endTime) > minutes(request.startTime));
    const collision = overlapping.some((event) => event.venue.toLowerCase() === venue.name.toLowerCase());
    if (collision) warnings.push("Listed event already overlaps at this venue; availability is unconfirmed.");
    else reasons.push("No collision in the EventMesh calendar; confirm booking separately.");
    const availability = collision ? 0 : 25;

    const typeFit = request.category === "Sports" ? /sport|outdoor|court/i.test(venue.type) : request.category === "Cultural" ? /performance|multi|common/i.test(venue.type) : /lecture|seminar|multi/i.test(venue.type);
    const suitability = typeFit ? 10 : 4;
    if (typeFit) reasons.push(`Venue type suits ${request.category.toLowerCase()} events.`);
    else warnings.push("Venue type is a less natural fit for this event.");

    const nearby = overlapping.filter((event) => event.venue.toLowerCase() !== venue.name.toLowerCase() && event.expectedAudience && event.expectedAudience >= 80).length;
    const pressure = Math.max(0, 10 - nearby * 3);
    if (nearby) warnings.push(`${nearby} large listed event${nearby > 1 ? "s" : ""} at the same time may create local pressure.`);
    else reasons.push("No large concurrent listed events.");
    if (request.preferredArea && request.preferredArea !== "Any" && venue.area !== request.preferredArea) warnings.push(`Outside preferred ${request.preferredArea.toLowerCase()} area.`);
    const areaPenalty = request.preferredArea && request.preferredArea !== "Any" && venue.area !== request.preferredArea ? 8 : 0;
    return { venue, score: Math.max(0, capacity + facilities + availability + suitability + pressure - areaPenalty), reasons, warnings, available: !collision };
  }).sort((a, b) => b.score - a.score || a.venue.name.localeCompare(b.venue.name));
}
