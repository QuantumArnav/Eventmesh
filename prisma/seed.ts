import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { addDays, todayInIsth } from "../lib/dates";
import type { Category } from "../lib/types";

const prisma = new PrismaClient();
const today = todayInIsth();
type SeedEvent = { title: string; organizer: string; description: string; day: number; start: string; end: string; venue: string; category: Category; tags: string[]; audience: number; popularity: number; deadline?: number };
// Deterministic relative demo scenario. Keep these dates relative so the guided conflict walkthrough remains usable.
const events: SeedEvent[] = [
  { title: "Milan Football Practice", organizer: "Sports Council", description: "Open practice for the inter-hostel football squad. All skill levels welcome.", day: 0, start: "17:00", end: "18:15", venue: "Sports Complex", category: "Sports", tags: ["Football", "Milan", "Fitness"], audience: 80, popularity: 78 },
  { title: "Astronomy Observation Night", organizer: "Astronomy Club", description: "Explore Saturn and the night sky through telescopes with fellow students.", day: 0, start: "20:00", end: "21:30", venue: "Academic Block Terrace", category: "Community", tags: ["Astronomy", "Science", "Stargazing"], audience: 70, popularity: 72 },
  { title: "Open Source Contribution Sprint", organizer: "Programming Club", description: "Make your first meaningful open-source contribution with guidance from club mentors.", day: 0, start: "18:30", end: "20:00", venue: "LH1", category: "Technical", tags: ["Programming", "Open Source", "GitHub"], audience: 90, popularity: 82 },
  { title: "Photography Walk", organizer: "Photography Club", description: "A golden-hour campus walk focused on composition and visual storytelling.", day: 1, start: "17:00", end: "18:30", venue: "Hostel Circle", category: "Cultural", tags: ["Photography", "Creative", "Campus"], audience: 45, popularity: 55 },
  { title: "AI Study Circle", organizer: "Lambda Club", description: "A relaxed peer session to discuss AI projects, programming ideas, and practical experiments.", day: 1, start: "18:30", end: "19:30", venue: "LH1", category: "Technical", tags: ["AI", "Programming", "Projects"], audience: 45, popularity: 61 },
  { title: "Startup Pitch Night", organizer: "E-Cell IITH", description: "Present a two-minute startup pitch and receive practical feedback.", day: 1, start: "19:00", end: "21:00", venue: "Convention Centre", category: "Talk", tags: ["Startups", "Entrepreneurship", "Pitching"], audience: 150, popularity: 87 },
  { title: "Dance Workshop", organizer: "Vibes Dance Club", description: "Learn a short routine with a beginner-friendly group session.", day: 1, start: "18:00", end: "19:30", venue: "Hostel Common Room", category: "Workshop", tags: ["Dance", "Culture", "Movement"], audience: 65, popularity: 67 },
  { title: "Lambda AI Workshop", organizer: "Lambda Club", description: "Build a small practical AI system and learn how to evaluate it responsibly.", day: 2, start: "18:00", end: "19:30", venue: "LH3", category: "Workshop", tags: ["AI", "Programming", "Machine Learning"], audience: 120, popularity: 93, deadline: 1 },
  { title: "Competitive Programming Contest", organizer: "Programming Club", description: "A two-hour problem-solving contest with live rankings and post-contest discussion.", day: 2, start: "18:00", end: "20:00", venue: "LH2", category: "Technical", tags: ["Programming", "Algorithms", "Competitive Programming"], audience: 140, popularity: 88 },
  { title: "Robotics Workshop", organizer: "Robotics Club", description: "Prototype simple robot behaviors with sensors and rapid iteration.", day: 2, start: "18:30", end: "20:00", venue: "LH3", category: "Workshop", tags: ["Robotics", "Programming", "Hardware"], audience: 95, popularity: 76 },
  { title: "Cybersecurity CTF", organizer: "Cybersecurity Club", description: "Beginner-to-intermediate capture-the-flag challenges in teams.", day: 3, start: "17:30", end: "20:30", venue: "LH1", category: "Technical", tags: ["Cybersecurity", "Programming", "CTF"], audience: 100, popularity: 81 },
  { title: "Chess Tournament", organizer: "Board Games Club", description: "Rapid chess, friendly pairings, and a simple knockout bracket.", day: 3, start: "18:00", end: "20:00", venue: "Hostel Common Room", category: "Sports", tags: ["Chess", "Games", "Strategy"], audience: 50, popularity: 54 },
  { title: "Research Talk: Sustainable Cooling", organizer: "Greenko School of Sustainability", description: "A student-friendly talk on cooling systems and campus energy use.", day: 4, start: "17:00", end: "18:15", venue: "Academic Block", category: "Talk", tags: ["Sustainability", "Research", "Energy"], audience: 85, popularity: 64 },
  { title: "Design Thinking Lab", organizer: "Design Club", description: "Practice interviewing users and sketching solutions to everyday campus problems.", day: 4, start: "18:30", end: "20:00", venue: "LH2", category: "Workshop", tags: ["Design", "Innovation", "UX"], audience: 55, popularity: 68 },
  { title: "Music Jam", organizer: "Music Club", description: "An open jam session for singers, instrumentalists, and listeners.", day: 5, start: "19:00", end: "21:00", venue: "Amphitheatre", category: "Cultural", tags: ["Music", "Performance", "Community"], audience: 110, popularity: 80 },
  { title: "Placement Preparation Circle", organizer: "Career Community", description: "Peer-led mock interviews and practical placement preparation.", day: 5, start: "18:00", end: "19:30", venue: "LH1", category: "Talk", tags: ["Placements", "Interviews", "Programming"], audience: 130, popularity: 90 },
  { title: "Inter-hostel Badminton Meetup", organizer: "Sports Council", description: "Find practice partners and play short friendly matches.", day: 6, start: "17:30", end: "19:00", venue: "Sports Complex", category: "Sports", tags: ["Badminton", "Milan", "Fitness"], audience: 70, popularity: 62 },
  { title: "Build Your First Web App", organizer: "Lambda Club", description: "A hands-on introduction to a modern full-stack workflow.", day: 6, start: "18:30", end: "20:00", venue: "LH3", category: "Workshop", tags: ["Programming", "Web", "Startups"], audience: 100, popularity: 83 },
  { title: "Campus Climate Action Forum", organizer: "Prakriti Club", description: "Discuss practical student-led sustainability projects for IITH.", day: 7, start: "18:00", end: "19:30", venue: "Convention Centre", category: "Community", tags: ["Sustainability", "Campus", "Climate"], audience: 70, popularity: 58 },
];

type AnnouncementEvent = { title: string; organizer: string; description: string; date: string; startTime: string; endTime: string; venue: string; category: Category; tags: string[] };
// Static events adapted from IITH announcements received in 2026. These are demo listings, not an official or live calendar.
// Announcements without a verified end time or a single-day slot are omitted because Event requires both.
const announcementEvents: AnnouncementEvent[] = [
  {
    title: "Water Conservation and Rainwater Harvesting",
    organizer: "Office of Dean Students / SHS Campaign",
    description: "A special talk by Prof. K. B. V. N. Phanindra on water conservation and rainwater harvesting as part of the Swachhata Hi Seva Campaign 2026.",
    date: "2026-09-29", startTime: "16:00", endTime: "17:00", venue: "Senate Hall", category: "Talk",
    tags: ["Sustainability", "Water", "Environment", "Campus"],
  },
  {
    title: "Study, Research and Career Opportunities in Saxony, Germany",
    organizer: "Office of International Relations",
    description: "An online seminar featuring representatives from universities and industry in Saxony covering study, research and career opportunities in microelectronics, semiconductor technologies, communication networks and cybersecurity.",
    date: "2026-10-07", startTime: "15:30", endTime: "16:30", venue: "Online", category: "Talk",
    tags: ["Germany", "Research", "Semiconductors", "Cybersecurity", "International"],
  },
  {
    title: "Insights from a Successful JSPS Postdoctoral Fellowship Application",
    organizer: "Department of Materials Science and Metallurgical Engineering",
    description: "An interaction with Dr. Pankaj Ojha sharing practical experience from a successful JSPS postdoctoral fellowship application.",
    date: "2026-10-07", startTime: "15:30", endTime: "16:30", venue: "MSME Conference Room 110", category: "Talk",
    tags: ["Research", "Fellowship", "PhD", "Japan", "Career"],
  },
];

// Invented capacities and facilities for the hackathon demo; never treat these as official IITH inventory.
const demoVenues = [
  { name: "LH1", building: "Lecture Hall Complex", area: "Academic zone", capacity: 160, type: "Lecture hall", hasProjector: true, hasAudioSystem: true, hasStage: false, indoor: true, accessible: true },
  { name: "LH2", building: "Lecture Hall Complex", area: "Academic zone", capacity: 150, type: "Lecture hall", hasProjector: true, hasAudioSystem: true, hasStage: false, indoor: true, accessible: true },
  { name: "LH3", building: "Lecture Hall Complex", area: "Academic zone", capacity: 120, type: "Lecture hall", hasProjector: true, hasAudioSystem: true, hasStage: false, indoor: true, accessible: true },
  { name: "Convention Centre", building: "Convention Centre", area: "Central zone", capacity: 350, type: "Multipurpose auditorium", hasProjector: true, hasAudioSystem: true, hasStage: true, indoor: true, accessible: true },
  { name: "Academic Block Seminar Hall", building: "Academic Block", area: "Academic zone", capacity: 75, type: "Seminar hall", hasProjector: true, hasAudioSystem: true, hasStage: false, indoor: true, accessible: true },
  { name: "Sports Complex", building: "Sports Complex", area: "Sports zone", capacity: 200, type: "Sports facility", hasProjector: false, hasAudioSystem: true, hasStage: false, indoor: false, accessible: true },
  { name: "Hostel Common Room", building: "Hostel area", area: "Residential zone", capacity: 85, type: "Common room", hasProjector: false, hasAudioSystem: true, hasStage: false, indoor: true, accessible: true },
] as const;

async function seedAnnouncementEvents(venueIds: Map<string, string>) {
  let added = 0;
  for (const event of announcementEvents) {
    const duplicate = await prisma.event.findFirst({ where: { title: event.title, date: event.date, organizer: event.organizer }, select: { id: true } });
    if (duplicate) continue;
    await prisma.event.create({ data: {
      title: event.title, organizer: event.organizer, description: event.description,
      date: event.date, startTime: event.startTime, endTime: event.endTime,
      venue: event.venue, venueId: venueIds.get(event.venue), category: event.category,
      tagsJson: JSON.stringify(event.tags), expectedAudience: null, isDemo: true,
    } });
    added++;
  }
  return added;
}

async function main() {
  for (const venue of demoVenues) await prisma.venue.upsert({
    where: { name: venue.name }, update: {}, create: { ...venue, description: "Illustrative venue profile for EventMesh demos; verify capacity, facilities and booking with campus staff.", isDemo: true },
  });
  const venueIds = new Map((await prisma.venue.findMany({ select: { id: true, name: true } })).map((venue) => [venue.name, venue.id]));
  for (const venue of demoVenues) await prisma.event.updateMany({ where: { venue: venue.name, venueId: null }, data: { venueId: venueIds.get(venue.name) } });
  await prisma.studentProfile.upsert({ where: { id: "demo-student" }, update: {}, create: {
    id: "demo-student", name: "Arnav", interestsJson: JSON.stringify(["AI", "Machine Learning", "Programming", "Football", "Startups"]),
    categoryPreferencesJson: JSON.stringify(["Technical", "Workshop", "Sports"]), organizerAffinityJson: JSON.stringify(["Lambda Club", "Programming Club"]),
  } });
  if (await prisma.event.count()) {
    const added = events.find((event) => event.title === "AI Study Circle")!;
    if (!await prisma.event.findFirst({ where: { title: added.title, isDemo: true } })) {
      await prisma.event.create({ data: { title: added.title, organizer: added.organizer, description: added.description, date: addDays(today, added.day), startTime: added.start, endTime: added.end, venue: added.venue, venueId: venueIds.get(added.venue), category: added.category, tagsJson: JSON.stringify(added.tags), expectedAudience: added.audience, popularity: added.popularity, isDemo: true } });
      console.log("Added one missing demo search event; existing events and choices preserved.");
    } else console.log("Relative demo events already present; seed skipped to preserve data.");
    console.log(`Added ${await seedAnnouncementEvents(venueIds)} announcement-based demo events; existing choices preserved.`);
    return;
  }
  const seededIds = new Map<string, string>();
  for (const event of events) {
    const created = await prisma.event.create({ data: {
      title: event.title, organizer: event.organizer, description: event.description,
      date: addDays(today, event.day), startTime: event.start, endTime: event.end, venue: event.venue, venueId: venueIds.get(event.venue),
      category: event.category, tagsJson: JSON.stringify(event.tags), registrationDeadline: event.deadline === undefined ? null : addDays(today, event.deadline),
      expectedAudience: event.audience, popularity: event.popularity, isDemo: true,
    } });
    seededIds.set(event.title, created.id);
  }
  for (const [title, preference] of [
    ["Milan Football Practice", "SAVED"], ["Open Source Contribution Sprint", "SAVED"],
    ["Astronomy Observation Night", "SAVED"], ["Startup Pitch Night", "INTERESTED"],
    ["Lambda AI Workshop", "MUST_ATTEND"], ["Competitive Programming Contest", "INTERESTED"],
  ]) {
    const eventId = seededIds.get(title);
    if (eventId) await prisma.savedEvent.create({ data: { studentId: "demo-student", eventId, preference } });
  }
  const announcementCount = await seedAnnouncementEvents(venueIds);
  console.log(`Seeded ${events.length} relative demo events and ${announcementCount} announcement-based demo events, plus a six-event student plan starting ${today}.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
