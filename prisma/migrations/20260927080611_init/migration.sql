-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "organizer" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "venue" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tagsJson" TEXT NOT NULL,
    "registrationDeadline" TEXT,
    "expectedAudience" INTEGER,
    "popularity" INTEGER NOT NULL DEFAULT 0,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "StudentProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "interestsJson" TEXT NOT NULL,
    "categoryPreferencesJson" TEXT NOT NULL,
    "organizerAffinityJson" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "SavedEvent" (
    "studentId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "savedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("studentId", "eventId"),
    CONSTRAINT "SavedEvent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SavedEvent_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Event_date_startTime_idx" ON "Event"("date", "startTime");

-- CreateIndex
CREATE INDEX "Event_category_idx" ON "Event"("category");
