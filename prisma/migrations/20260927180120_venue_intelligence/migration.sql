-- CreateTable
CREATE TABLE "Venue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "building" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "hasProjector" BOOLEAN NOT NULL,
    "hasAudioSystem" BOOLEAN NOT NULL,
    "hasStage" BOOLEAN NOT NULL,
    "indoor" BOOLEAN NOT NULL,
    "accessible" BOOLEAN NOT NULL,
    "latitude" REAL,
    "longitude" REAL,
    "description" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT true
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "organizer" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "venue" TEXT NOT NULL,
    "venueId" TEXT,
    "category" TEXT NOT NULL,
    "tagsJson" TEXT NOT NULL,
    "registrationDeadline" TEXT,
    "expectedAudience" INTEGER,
    "popularity" INTEGER NOT NULL DEFAULT 0,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Event_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Event" ("category", "createdAt", "date", "description", "endTime", "expectedAudience", "id", "isDemo", "organizer", "popularity", "registrationDeadline", "startTime", "tagsJson", "title", "updatedAt", "venue") SELECT "category", "createdAt", "date", "description", "endTime", "expectedAudience", "id", "isDemo", "organizer", "popularity", "registrationDeadline", "startTime", "tagsJson", "title", "updatedAt", "venue" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
CREATE INDEX "Event_date_startTime_idx" ON "Event"("date", "startTime");
CREATE INDEX "Event_category_idx" ON "Event"("category");
CREATE INDEX "Event_venueId_idx" ON "Event"("venueId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Venue_name_key" ON "Venue"("name");
