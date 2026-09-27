CREATE TABLE "EventSource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceType" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sourceData" TEXT NOT NULL,
    "extractedJson" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "publishedEventId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE INDEX "EventSource_status_createdAt_idx" ON "EventSource"("status", "createdAt");
