import "dotenv/config";
import { closeSync, existsSync, mkdirSync, openSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";

const url = process.env.DATABASE_URL ?? "file:./dev.db";
if (!url.startsWith("file:./")) throw new Error("DATABASE_URL must be a relative SQLite file URL such as file:./dev.db");
// Prisma resolves the file URL relative to prisma/schema.prisma.
const prismaDirectory = resolve(process.cwd(), "prisma");
const database = resolve(prismaDirectory, url.slice("file:".length));
if (!database.startsWith(prismaDirectory + sep)) throw new Error("DATABASE_URL must stay inside prisma/");
mkdirSync(dirname(database), { recursive: true });
if (!existsSync(database)) closeSync(openSync(database, "w"));
