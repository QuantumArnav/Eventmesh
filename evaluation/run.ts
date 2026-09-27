import { analyzeConflict } from "../lib/conflict-engine";
import { detectDuplicates } from "../lib/duplicate-detector";
import { extractTextLocally } from "../lib/ai/event-extractor";
import { optimizeSchedule } from "../lib/schedule-optimizer";
import { rankVenues, type VenueData } from "../lib/venue-matcher";
import type { EventData, EventInput, StudentData } from "../lib/types";

const base: EventInput = { title: "Lambda AI Workshop", organizer: "Lambda Club", description: "Hands-on AI workshop for campus students.", date: "2026-09-29", startTime: "18:00", endTime: "19:30", venue: "LH3", category: "Workshop", tags: ["AI", "Programming"], registrationDeadline: null, expectedAudience: 80 };
const event = (id: string, changes: Partial<EventData> = {}): EventData => ({ id, ...base, popularity: 70, isDemo: true, ...changes });
const duplicateCases = [
  { label: "exact", expected: true, row: event("a") },
  { label: "title suffix", expected: true, row: event("b", { title: "Lambda AI Workshop 2026" }) },
  { label: "same event typo", expected: true, row: event("c", { title: "Lambda AI Workshp" }) },
  { label: "same event, different room", expected: true, row: event("d", { venue: "LH2" }) },
  { label: "next month", expected: false, row: event("e", { date: "2026-10-29" }) },
  { label: "unrelated sports event", expected: false, row: event("f", { title: "Football Practice", organizer: "Sports Council", category: "Sports", tags: ["Football"], venue: "Sports Complex" }) },
  { label: "different organizer and month", expected: false, row: event("g", { title: "Robotics Meetup", organizer: "Robotics Club", date: "2026-10-04", tags: ["Robotics"] }) },
  { label: "same title next day", expected: false, row: event("h", { date: "2026-09-30" }) },
];
const duplicateResults = duplicateCases.map((item) => ({ ...item, predicted: detectDuplicates(base, [item.row]).length > 0 }));
const tp = duplicateResults.filter((item) => item.expected && item.predicted).length;
const fp = duplicateResults.filter((item) => !item.expected && item.predicted).length;
const fn = duplicateResults.filter((item) => item.expected && !item.predicted).length;
const precision = tp + fp ? tp / (tp + fp) : 0;
const recall = tp + fn ? tp / (tp + fn) : 0;
const f1 = precision + recall ? 2 * precision * recall / (precision + recall) : 0;

const announcements = [
  { text: "Lambda Club is hosting the Lambda AI Workshop on 29 September 2026 from 6 PM to 7:30 PM in LH3.", title: "Lambda AI Workshop", date: "2026-09-29", venue: "LH3", startTime: "18:00", organizer: "Lambda Club" },
  { text: "Programming Club is hosting the Coding Contest on 30 September 2026 from 5 PM to 7 PM in LH2.", title: "Coding Contest", date: "2026-09-30", venue: "LH2", startTime: "17:00", organizer: "Programming Club" },
  { text: "Robotics Club is hosting the Robotics Workshop on 1 October 2026 from 6 PM to 8 PM in LH1.", title: "Robotics Workshop", date: "2026-10-01", venue: "LH1", startTime: "18:00", organizer: "Robotics Club" },
  { text: "Sports Council is hosting the Football Meetup on 2 October 2026 at 5 PM in Sports Complex.", title: "Football Meetup", date: "2026-10-02", venue: "Sports Complex", startTime: "17:00", organizer: "Sports Council" },
  { text: "Lambda Club is hosting the AI Agents Workshop on 3 October 2026 from 7 PM to 8 PM in Convention Centre.", title: "AI Agents Workshop", date: "2026-10-03", venue: "Convention Centre", startTime: "19:00", organizer: "Lambda Club" },
  { text: "Programming Club is hosting the Open Source Session on 4 October 2026 from 4 PM to 5 PM in LH3.", title: "Open Source Session", date: "2026-10-04", venue: "LH3", startTime: "16:00", organizer: "Programming Club" },
  { text: "Robotics Club is hosting the Sensor Hackathon on 5 October 2026 from 6 PM to 9 PM in Academic Block.", title: "Sensor Hackathon", date: "2026-10-05", venue: "Academic Block", startTime: "18:00", organizer: "Robotics Club" },
  { text: "Lambda Club is hosting the Design Seminar on 6 October 2026 at 6 PM in LH2.", title: "Design Seminar", date: "2026-10-06", venue: "LH2", startTime: "18:00", organizer: "Lambda Club" },
  { text: "Lambda Club is hosting the AI Workshop tomorrow at 6 PM in LH3.", title: "AI Workshop", date: null, venue: "LH3", startTime: "18:00", organizer: "Lambda Club" },
  { text: "Programming Club is hosting the Algorithms Contest on 8 October 2026 at 6 PM in LH.", title: "Algorithms Contest", date: "2026-10-08", venue: null, startTime: "18:00", organizer: "Programming Club" },
  { text: "Robotics Club is hosting the Robotics Meetup on 9 October 2026 at 7 PM in LH1.", title: "Robotics Meetup", date: "2026-10-09", venue: "LH1", startTime: "19:00", organizer: "Robotics Club" },
  { text: "Lambda Club is hosting the Machine Learning Talk on 10 October 2026 at 5 PM in LH3.", title: "Machine Learning Talk", date: "2026-10-10", venue: "LH3", startTime: "17:00", organizer: "Lambda Club" },
  { text: "Notice: Prakriti Club presents Campus Climate Forum, 11 October 2026 at 6 PM, Seminar Hall.", title: "Campus Climate Forum", date: "2026-10-11", venue: "Seminar Hall", startTime: "18:00", organizer: "Prakriti Club" },
  { text: "E-Cell announces Startup Pitch Night on 12 October 2026 at 7 PM in Auditorium.", title: "Startup Pitch Night", date: "2026-10-12", venue: "Auditorium", startTime: "19:00", organizer: "E-Cell" },
  { text: "Sports Council: Chess Tournament on 13 October 2026 from 5 PM to 7 PM in Hostel Common Room.", title: "Chess Tournament", date: "2026-10-13", venue: "Hostel Common Room", startTime: "17:00", organizer: "Sports Council" },
];
const fields = ["title", "date", "venue", "startTime", "organizer"] as const;
const extractionAccuracy = Object.fromEntries(fields.map((field) => [field, {
  correct: announcements.filter((sample) => extractTextLocally(sample.text)[field] === sample[field]).length,
  total: announcements.length,
}]));

const conflictCases = [
  { label: "full venue overlap", row: event("v"), expected: "VENUE" },
  { label: "partial venue overlap", row: event("p", { startTime: "19:00", endTime: "20:00" }), expected: "VENUE" },
  { label: "similar audience, other room", row: event("s", { venue: "LH2" }), expected: "AUDIENCE" },
  { label: "different audience, other room", row: event("u", { venue: "LH2", tags: ["Football"], category: "Sports" }), expected: "AUDIENCE" },
  { label: "back-to-back", row: event("b", { startTime: "19:30", endTime: "20:30" }), expected: "NONE" },
  { label: "different day", row: event("d", { date: "2026-09-30" }), expected: "NONE" },
];
const conflictCorrect = conflictCases.filter((item) => (analyzeConflict(base, item.row)?.kind ?? "NONE") === item.expected).length;

const student: StudentData = { id: "demo", name: "Arnav", interests: ["AI", "Programming"], categoryPreferences: ["Workshop"], organizerAffinity: ["Lambda Club"] };
const plan = optimizeSchedule([
  { event: event("long", { startTime: "17:00", endTime: "21:00" }), preference: "MUST_ATTEND" },
  { event: event("early", { startTime: "17:00", endTime: "19:00" }), preference: "SAVED" },
  { event: event("late", { startTime: "19:00", endTime: "21:00" }), preference: "SAVED" },
], student);

const venue = (name: string, capacity: number, hasProjector = true): VenueData => ({ id: name, name, building: "Demo", area: "Academic zone", capacity, type: "Lecture hall", hasProjector, hasAudioSystem: true, hasStage: false, indoor: true, accessible: true, description: null, isDemo: true });
const venueCases = [
  { label: "ideal fit", request: {}, venues: [venue("ideal", 100), venue("huge", 500)], expectedTop: "ideal" },
  { label: "too small", request: {}, venues: [venue("small", 60), venue("ideal", 100)], expectedTop: "ideal" },
  { label: "missing projector", request: { projector: true }, venues: [venue("bare", 100, false), venue("equipped", 100)], expectedTop: "equipped" },
  { label: "venue collision", request: {}, venues: [venue("busy", 100), venue("clear", 100)], existing: [event("busy", { venue: "busy" })], expectedTop: "clear" },
  { label: "oversized room", request: {}, venues: [venue("huge", 500), venue("ideal", 100)], expectedTop: "ideal" },
];
const venueCorrect = venueCases.filter((item) => rankVenues({ date: base.date, startTime: base.startTime, endTime: base.endTime, expectedAudience: 80, category: "Workshop", ...item.request }, item.venues, item.existing ?? [])[0]?.venue.name === item.expectedTop).length;

console.log(JSON.stringify({ duplicate: { cases: duplicateCases.length, tp, fp, fn, precision, recall, f1, errors: duplicateResults.filter((item) => item.expected !== item.predicted).map((item) => item.label) }, extraction: { samples: announcements.length, fields: extractionAccuracy, method: "offline local text parser only" }, conflict: { correct: conflictCorrect, total: conflictCases.length }, schedule: { selected: plan.selected.map((item) => item.event.id), optimumBeatsGreedy: plan.selected.map((item) => item.event.id).join(",") === "early,late" }, venue: { correct: venueCorrect, total: venueCases.length } }, null, 2));
