import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const email = process.argv[2]?.trim().toLowerCase();
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Usage: npm run auth:grant-organizer -- user@example.com");
const prisma = new PrismaClient();
try {
  const user = await prisma.user.update({ where: { email }, data: { role: "ORGANIZER" }, select: { email: true, role: true } });
  console.log(`${user.email}: ${user.role}`);
} finally { await prisma.$disconnect(); }
