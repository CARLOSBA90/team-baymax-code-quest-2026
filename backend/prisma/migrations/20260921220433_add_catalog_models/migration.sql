-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING_REVIEW');

-- CreateEnum
CREATE TYPE "PrerequisiteType" AS ENUM ('REQUIRED', 'RECOMMENDED');

-- CreateEnum
CREATE TYPE "ImportSource" AS ENUM ('CSV', 'SCRAPER', 'MANUAL');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('RUNNING', 'SUCCESS', 'FAILED', 'PARTIAL');

-- CreateTable
CREATE TABLE "course" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "level" INTEGER NOT NULL,
    "durationHours" INTEGER,
    "status" "CourseStatus" NOT NULL DEFAULT 'ACTIVE',
    "sourceUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_skill" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "skill" "SkillCategory" NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "course_skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_prerequisite" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "prerequisiteCourseId" TEXT NOT NULL,
    "type" "PrerequisiteType" NOT NULL DEFAULT 'REQUIRED',

    CONSTRAINT "course_prerequisite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_import" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "source" "ImportSource" NOT NULL,
    "status" "ImportStatus" NOT NULL DEFAULT 'RUNNING',
    "created" INTEGER NOT NULL DEFAULT 0,
    "updated" INTEGER NOT NULL DEFAULT 0,
    "errors" TEXT,

    CONSTRAINT "catalog_import_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "course_slug_key" ON "course"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "course_skill_courseId_skill_key" ON "course_skill"("courseId", "skill");

-- CreateIndex
CREATE UNIQUE INDEX "course_prerequisite_courseId_prerequisiteCourseId_key" ON "course_prerequisite"("courseId", "prerequisiteCourseId");

-- AddForeignKey
ALTER TABLE "course_skill" ADD CONSTRAINT "course_skill_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_prerequisite" ADD CONSTRAINT "course_prerequisite_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_prerequisite" ADD CONSTRAINT "course_prerequisite_prerequisiteCourseId_fkey" FOREIGN KEY ("prerequisiteCourseId") REFERENCES "course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

