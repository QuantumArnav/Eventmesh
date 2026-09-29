import "dotenv/config";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";

if (process.env.DATABASE_URL !== "file:./auth-qa.db") throw new Error("Use only disposable auth-qa.db.");
const base = "http://127.0.0.1:3001";
const prisma = new PrismaClient();
try {
  const userA = await prisma.user.findUniqueOrThrow({ where: { email: "account-a@eventmesh.test" } });
  const userB = await prisma.user.findUniqueOrThrow({ where: { email: "account-b@eventmesh.test" } });
  const tokenA = randomBytes(32).toString("hex");
  const tokenB = randomBytes(32).toString("hex");
  for (const [userId, sessionToken] of [[userA.id, tokenA], [userB.id, tokenB]]) {
    await prisma.session.create({ data: { userId, sessionToken, expires: new Date(Date.now() + 60 * 60 * 1000) } });
  }
  async function call(path: string, token?: string, init?: RequestInit) {
    return fetch(base + path, { ...init, headers: { ...init?.headers, ...(token ? { Cookie: `authjs.session-token=${token}` } : {}), Origin: base } });
  }
  assert.equal((await call("/api/profile")).status, 401);
  const responseA = await call("/api/profile", tokenA);
  const responseB = await call("/api/profile", tokenB);
  assert.equal(responseA.status, 200);
  assert.equal(responseB.status, 200);
  const profileA = await responseA.json();
  const profileB = await responseB.json();
  assert.equal(profileA.account.id, userA.id);
  assert.equal(profileB.account.id, userB.id);
  assert.ok(!profileA.savedEventIds.some((id: string) => profileB.savedEventIds.includes(id)));
  assert.equal((await call("/api/inbox", tokenA)).status, 403);
  assert.equal((await call("/api/events", tokenA, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })).status, 403);
  assert.equal((await fetch(base + "/api/preferences", { method: "POST", headers: { Cookie: `authjs.session-token=${tokenA}`, Origin: "https://other.example", "Content-Type": "application/json" }, body: JSON.stringify({ eventId: profileA.savedEventIds[0], preference: "INTERESTED" }) })).status, 403);
  await prisma.user.update({ where: { id: userB.id }, data: { role: "ORGANIZER" } });
  assert.equal((await call("/api/inbox", tokenB)).status, 200);
  const eventId = profileA.savedEventIds[0];
  const changed = await call("/api/preferences", tokenA, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventId, preference: "INTERESTED" }) });
  assert.equal(changed.status, 200, await changed.text());
  assert.equal((await prisma.savedEvent.findUniqueOrThrow({ where: { studentId_eventId: { studentId: userA.id, eventId } } })).preference, "INTERESTED");
  assert.equal((await prisma.savedEvent.findFirstOrThrow({ where: { studentId: userB.id } })).preference, "SAVED");
  console.log("HTTP auth passed: guest 401, distinct sessions/profiles, student 403, organizer 200, isolated mutation.");
} finally { await prisma.$disconnect(); }
