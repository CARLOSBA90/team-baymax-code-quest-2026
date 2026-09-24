CREATE TYPE "ChallengeSubmissionType" AS ENUM ('TEXT', 'CODE', 'LINK', 'FILE');
CREATE TYPE "ChallengeSubmissionStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED');

ALTER TABLE "progress"
  ADD COLUMN "trackingState" JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN "startedAt" TIMESTAMPTZ(3),
  ADD COLUMN "completedAt" TIMESTAMPTZ(3);

CREATE TABLE "challenge_submission" (
  "id" TEXT NOT NULL,
  "roadmapItemId" TEXT NOT NULL,
  "eventId" TEXT,
  "payloadHash" TEXT,
  "submissionType" "ChallengeSubmissionType" NOT NULL,
  "status" "ChallengeSubmissionStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
  "content" TEXT,
  "language" TEXT,
  "url" TEXT,
  "storageKey" TEXT,
  "originalFilename" TEXT,
  "mimeType" TEXT,
  "sizeBytes" INTEGER,
  "checksum" TEXT,
  "feedback" JSONB,
  "evaluatorVersion" TEXT,
  "reviewedByUserId" TEXT,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "evaluatedAt" TIMESTAMPTZ(3),
  CONSTRAINT "challenge_submission_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "challenge_submission_size_check" CHECK ("sizeBytes" IS NULL OR "sizeBytes" >= 0)
);

CREATE UNIQUE INDEX "challenge_submission_roadmapItemId_eventId_key" ON "challenge_submission"("roadmapItemId", "eventId");
CREATE INDEX "challenge_submission_roadmapItemId_status_createdAt_idx" ON "challenge_submission"("roadmapItemId", "status", "createdAt");
CREATE INDEX "challenge_submission_reviewedByUserId_idx" ON "challenge_submission"("reviewedByUserId");

ALTER TABLE "challenge_submission" ADD CONSTRAINT "challenge_submission_roadmapItemId_fkey" FOREIGN KEY ("roadmapItemId") REFERENCES "roadmap_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "challenge_submission" ADD CONSTRAINT "challenge_submission_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
