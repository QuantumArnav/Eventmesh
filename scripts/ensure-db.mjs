import "dotenv/config";
import { closeSync, existsSync, mkdirSync, openSync } from "node:fs";
import { resolve } from "node:path";

const url = process.env.DATABASE_URL ?? "file:./dev.db";
if (!url.startsWith("file:./")) throw new Error("DATABASE_URL must be a relative SQLite file URL such as file:./dev.db");
// Prisma resolves the file URL relative to prisma/schema.prisma.
const database = resolve(process.cwd(), "prisma", url.slice("file:".length));
mkdirSync(resolve(process.cwd(), "prisma"), { recursive: true });
if (!existsSync(database)) closeSync(openSync(database, "w"));
