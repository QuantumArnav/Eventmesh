import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";

if (process.env.CI !== "true" || process.env.DATABASE_URL !== "file:./data/dev.db") {
  throw new Error("This script is only for the CI smoke container's mounted SQLite database.");
}

const prisma = new PrismaClient();
try {
  const user = await prisma.user.create({
    data: { email: `ci-smoke-${randomBytes(8).toString("hex")}@eventmesh.test`, role: "ORGANIZER" },
  });
  const sessionToken = randomBytes(32).toString("hex");
  await prisma.session.create({
    data: { userId: user.id, sessionToken, expires: new Date(Date.now() + 60 * 60 * 1000) },
  });
  process.stdout.write(sessionToken);
} finally {
  await prisma.$disconnect();
}
