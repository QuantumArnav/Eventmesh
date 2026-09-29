import "dotenv/config";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";

if (process.env.DATABASE_URL !== "file:./auth-qa.db") {
  throw new Error("Run only with DATABASE_URL=file:./auth-qa.db after migrating that disposable database.");
}

const prisma = new PrismaClient();
try {
  const [eventX, eventY] = await prisma.event.findMany({ take: 2, orderBy: { title: "asc" }, select: { id: true } });
  assert.ok(eventX && eventY, "Seed at least two events first");
  const demoBefore = await prisma.savedEvent.count({ where: { studentId: "demo-student" } });
  const userA = await prisma.user.create({ data: { email: "account-a@eventmesh.test", role: "STUDENT" } });
  const userB = await prisma.user.create({ data: { email: "account-b@eventmesh.test", role: "STUDENT" } });
  for (const user of [userA, userB]) await prisma.studentProfile.create({ data: {
    id: user.id, userId: user.id, name: user.email!, interestsJson: "[]", categoryPreferencesJson: "[]", organizerAffinityJson: "[]",
  } });
  await prisma.studentProfile.update({ where: { userId: userA.id }, data: { interestsJson: '["Programming"]' } });
  await prisma.studentProfile.update({ where: { userId: userB.id }, data: { interestsJson: '["Music"]' } });
  await prisma.savedEvent.create({ data: { studentId: userA.id, eventId: eventX.id, preference: "MUST_ATTEND" } });
  assert.deepEqual(await prisma.savedEvent.findMany({ where: { studentId: userB.id } }), [], "B must not inherit A's save");
  await prisma.savedEvent.create({ data: { studentId: userB.id, eventId: eventY.id, preference: "INTERESTED" } });
  await prisma.savedEvent.update({ where: { studentId_eventId: { studentId: userB.id, eventId: eventY.id } }, data: { preference: "SAVED" } });
  const savedA = await prisma.savedEvent.findMany({ where: { studentId: userA.id }, select: { eventId: true, preference: true } });
  const savedB = await prisma.savedEvent.findMany({ where: { studentId: userB.id }, select: { eventId: true, preference: true } });
  assert.deepEqual(savedA, [{ eventId: eventX.id, preference: "MUST_ATTEND" }]);
  assert.deepEqual(savedB, [{ eventId: eventY.id, preference: "SAVED" }]);
  assert.equal((await prisma.studentProfile.findUniqueOrThrow({ where: { userId: userA.id } })).interestsJson, '["Programming"]');
  assert.equal((await prisma.studentProfile.findUniqueOrThrow({ where: { userId: userB.id } })).interestsJson, '["Music"]');
  assert.equal(await prisma.savedEvent.count({ where: { studentId: "demo-student" } }), demoBefore);
  console.log("Account isolation passed: saves, priorities, and interests stay separate for A, B, and the seeded demo.");
} finally {
  await prisma.$disconnect();
}
