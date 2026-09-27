import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { addDays, todayInIsth } from "../lib/dates";
import type { Category } from "../lib/types";

const prisma = new PrismaClient();
const today = todayInIsth();
type SeedEvent = { title: string; organizer: string; description: string; day: number; start: string; end: string; venue: string; category: Category; tags: string[]; audience: number; popularity: number; deadline?: number };
const events: SeedEvent[] = [
  { title: "Milan Football Practice", organizer: "Sports Council", description: "Open practice for the inter-hostel football squad. All skill levels welcome.", day: 0, start: "17:00", end: "18:15", venue: "Sports Complex", category: "Sports", tags: ["Football", "Milan", "Fitness"], audience: 80, popularity: 78 },
  { title: "Astronomy Observation Night", organizer: "Astronomy Club", description: "Explore Saturn and the night sky through telescopes with fellow students.", day: 0, start: "20:00", end: "21:30", venue: "Academic Block Terrace", category: "Community", tags: ["Astronomy", "Science", "Stargazing"], audience: 70, popularity: 72 },
  { title: "Open Source Contribution Sprint", organizer: "Programming Club", description: "Make your first meaningful open-source contribution with guidance from club mentors.", day: 0, start: "18:30", end: "20:00", venue: "LH1", category: "Technical", tags: ["Programming", "Open Source", "GitHub"], audience: 90, popularity: 82 },
  { title: "Photography Walk", organizer: "Photography Club", description: "A golden-hour campus walk focused on composition and visual storytelling.", day: 1, start: "17:00", end: "18:30", venue: "Hostel Circle", category: "Cultural", tags: ["Photography", "Creative", "Campus"], audience: 45, popularity: 55 },
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

async function main() {
  await prisma.studentProfile.upsert({ where: { id: "demo-student" }, update: {}, create: {
    id: "demo-student", name: "Arnav", interestsJson: JSON.stringify(["AI", "Machine Learning", "Programming", "Football", "Startups"]),
    categoryPreferencesJson: JSON.stringify(["Technical", "Workshop", "Sports"]), organizerAffinityJson: JSON.stringify(["Lambda Club", "Programming Club"]),
  } });
  if (await prisma.event.count()) { console.log("Events already present; seed skipped to preserve data."); return; }
  const seededIds = new Map<string, string>();
  for (const event of events) {
    const created = await prisma.event.create({ data: {
      title: event.title, organizer: event.organizer, description: event.description,
      date: addDays(today, event.day), startTime: event.start, endTime: event.end, venue: event.venue,
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
  console.log(`Seeded ${events.length} clearly labeled demo events and a six-event student plan starting ${today}.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
