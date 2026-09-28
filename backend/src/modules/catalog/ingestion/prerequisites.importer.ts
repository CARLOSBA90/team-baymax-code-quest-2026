import { PrerequisiteType, type PrismaClient } from '../../../generated/prisma/client.js';

/** Shape of each entry in prisma/seed/prerequisites.json. */
export interface PrerequisiteEntry {
  /** Slug of the course that depends on the prerequisite. */
  courseSlug: string;
  /** Slug of the course that must be completed first. */
  prerequisiteSlug: string;
  /** Dependency strength (defaults to REQUIRED when absent). */
  type?: 'REQUIRED' | 'RECOMMENDED';
  /** Optional human-readable note – ignored during import. */
  comment?: string;
}

export interface PrerequisiteImportResult {
  upserted: number;
  skipped: string[];
}

/**
 * Upserts canonical course prerequisites derived from `entries`.
 *
 * Each entry maps a `courseSlug` → `prerequisiteSlug` pair.  Both slugs are
 * resolved to their database IDs; entries whose slugs do not exist in the
 * catalog are silently skipped (logged in `result.skipped`).
 *
 * This function is idempotent – running it multiple times on the same dataset
 * does not duplicate rows.
 */
export async function importPrerequisites(
  prisma: PrismaClient,
  entries: readonly PrerequisiteEntry[],
): Promise<PrerequisiteImportResult> {
  // Collect all unique slugs so we can resolve them in a single query.
  const allSlugs = new Set<string>();
  for (const entry of entries) {
    allSlugs.add(entry.courseSlug);
    allSlugs.add(entry.prerequisiteSlug);
  }

  const courses = await prisma.course.findMany({
    where: { slug: { in: [...allSlugs] } },
    select: { id: true, slug: true },
  });

  const idBySlug = new Map(courses.map((c) => [c.slug, c.id]));

  const result: PrerequisiteImportResult = { upserted: 0, skipped: [] };

  for (const entry of entries) {
    const courseId = idBySlug.get(entry.courseSlug);
    const prerequisiteCourseId = idBySlug.get(entry.prerequisiteSlug);

    if (!courseId || !prerequisiteCourseId) {
      result.skipped.push(`${entry.courseSlug} → ${entry.prerequisiteSlug}`);
      continue;
    }

    const type =
      entry.type === 'RECOMMENDED'
        ? PrerequisiteType.RECOMMENDED
        : PrerequisiteType.REQUIRED;

    await prisma.coursePrerequisite.upsert({
      where: {
        courseId_prerequisiteCourseId: { courseId, prerequisiteCourseId },
      },
      update: { type },
      create: { courseId, prerequisiteCourseId, type },
    });

    result.upserted += 1;
  }

  return result;
}
