ALTER TABLE "Event" ADD COLUMN "submissionKey" TEXT;
CREATE UNIQUE INDEX "Event_submissionKey_key" ON "Event"("submissionKey");
