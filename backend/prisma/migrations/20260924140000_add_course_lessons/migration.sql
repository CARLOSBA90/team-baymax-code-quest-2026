-- CreateEnum
CREATE TYPE "LessonType" AS ENUM ('VIDEO', 'TEXT', 'OTHER');

-- CreateTable
CREATE TABLE "course_lesson" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "sectionOrder" INTEGER NOT NULL,
    "sectionTitle" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "type" "LessonType" NOT NULL,
    "freePreview" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "course_lesson_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "course_lesson_courseId_order_key" ON "course_lesson"("courseId", "order");

-- AddForeignKey
ALTER TABLE "course_lesson" ADD CONSTRAINT "course_lesson_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
