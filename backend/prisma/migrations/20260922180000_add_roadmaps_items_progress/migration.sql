CREATE TYPE "RoadmapItemType" AS ENUM ('COURSE', 'MEDIA', 'CHALLENGE');

CREATE TABLE "roadmap" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "goal" JSONB,
    "weeklyHours" DECIMAL(10,2),
    "generatorVersion" TEXT NOT NULL,
    "catalogHash" TEXT NOT NULL,
    "generationContextSnapshot" JSONB NOT NULL,
    "pausedAt" TIMESTAMPTZ(3),
    "lastActivityAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activityVersion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "roadmap_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "roadmap_activity_version_check" CHECK ("activityVersion" >= 0),
    CONSTRAINT "roadmap_weekly_hours_check" CHECK ("weeklyHours" IS NULL OR ("weeklyHours" > 0 AND "weeklyHours" <= 168))
);

CREATE TABLE "roadmap_item" (
    "id" TEXT NOT NULL,
    "roadmapId" TEXT NOT NULL,
    "type" "RoadmapItemType" NOT NULL,
    "courseId" TEXT,
    "sourceKey" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "url" TEXT,
    "level" INTEGER,
    "estimatedMinutes" DECIMAL(10,2),
    "reason" TEXT NOT NULL,
    "targetSkills" "SkillCategory"[] NOT NULL,
    "contentData" JSONB NOT NULL,
    CONSTRAINT "roadmap_item_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "roadmap_item_type_course_check" CHECK (("type" = 'COURSE' AND "courseId" IS NOT NULL) OR ("type" <> 'COURSE' AND "courseId" IS NULL)),
    CONSTRAINT "roadmap_item_order_check" CHECK ("order" > 0),
    CONSTRAINT "roadmap_item_level_check" CHECK ("level" IS NULL OR "level" BETWEEN 1 AND 3),
    CONSTRAINT "roadmap_item_estimated_minutes_check" CHECK ("estimatedMinutes" IS NULL OR "estimatedMinutes" > 0)
);

CREATE TABLE "progress" (
    "roadmapItemId" TEXT NOT NULL,
    "percentage" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "progress_pkey" PRIMARY KEY ("roadmapItemId"),
    CONSTRAINT "progress_percentage_check" CHECK ("percentage" BETWEEN 0 AND 100),
    CONSTRAINT "progress_version_check" CHECK ("version" >= 0)
);

CREATE INDEX "roadmap_userId_createdAt_id_idx" ON "roadmap"("userId", "createdAt", "id");
CREATE INDEX "roadmap_assessmentId_idx" ON "roadmap"("assessmentId");
CREATE UNIQUE INDEX "roadmap_item_roadmapId_order_key" ON "roadmap_item"("roadmapId", "order");
CREATE UNIQUE INDEX "roadmap_item_roadmapId_sourceKey_key" ON "roadmap_item"("roadmapId", "sourceKey");
CREATE UNIQUE INDEX "roadmap_item_roadmapId_courseId_key" ON "roadmap_item"("roadmapId", "courseId");
CREATE INDEX "roadmap_item_courseId_idx" ON "roadmap_item"("courseId");

ALTER TABLE "roadmap" ADD CONSTRAINT "roadmap_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "roadmap" ADD CONSTRAINT "roadmap_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "roadmap_item" ADD CONSTRAINT "roadmap_item_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "roadmap"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "roadmap_item" ADD CONSTRAINT "roadmap_item_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "progress" ADD CONSTRAINT "progress_roadmapItemId_fkey" FOREIGN KEY ("roadmapItemId") REFERENCES "roadmap_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
