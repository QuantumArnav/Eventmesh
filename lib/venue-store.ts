import { prisma } from "./db";
import type { VenueData } from "./venue-matcher";

export async function listVenues(): Promise<VenueData[]> {
  return prisma.venue.findMany({ orderBy: { name: "asc" }, select: {
    id: true, name: true, building: true, area: true, capacity: true, type: true,
    hasProjector: true, hasAudioSystem: true, hasStage: true, indoor: true,
    accessible: true, description: true, isDemo: true,
  } });
}
