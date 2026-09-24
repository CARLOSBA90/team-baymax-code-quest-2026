import {
  LessonType,
  type PrismaClient,
} from '../../../generated/prisma/client.js';
import { normalizeSlug } from '../utils/course-normalizer.util.js';

/** Syllabus entry as exported by scripts/scrape-devtalles.ts --solo-temario. */
export interface ScrapedSyllabus {
  slug: string;
  temario: Array<{
    titulo: string;
    lecciones: Array<{
      titulo: string;
      tipo: 'VIDEO' | 'TEXTO' | 'OTRO';
      pruebaGratis?: boolean;
    }>;
  }>;
}

export interface LessonRow {
  sectionOrder: number;
  sectionTitle: string;
  order: number;
  title: string;
  type: LessonType;
  freePreview: boolean;
}

export interface SyllabusImportResult {
  courses: number;
  lessons: number;
  unknownSlugs: string[];
}

const LESSON_TYPES: Record<string, LessonType> = {
  VIDEO: LessonType.VIDEO,
  TEXTO: LessonType.TEXT,
  OTRO: LessonType.OTHER,
};

/** Flattens sections into lessons numbered 1..n across the whole course. */
export function toLessonRows(entry: ScrapedSyllabus): LessonRow[] {
  const rows: LessonRow[] = [];
  entry.temario.forEach((section, sectionIndex) => {
    for (const lesson of section.lecciones) {
      const title = lesson.titulo.trim();
      if (!title) continue;
      rows.push({
        sectionOrder: sectionIndex + 1,
        sectionTitle: section.titulo.trim(),
        order: rows.length + 1,
        title,
        type: LESSON_TYPES[lesson.tipo] ?? LessonType.OTHER,
        freePreview: lesson.pruebaGratis === true,
      });
    }
  });
  return rows;
}

/**
 * Replaces each course's syllabus with the scraped one (two queries per
 * course). Existing roadmaps are not affected: they keep their own copy of the
 * syllabus, so catalog lesson ids do not need to survive a reimport.
 */
export async function importSyllabus(
  prisma: PrismaClient,
  entries: readonly ScrapedSyllabus[],
): Promise<SyllabusImportResult> {
  const result: SyllabusImportResult = {
    courses: 0,
    lessons: 0,
    unknownSlugs: [],
  };
  for (const entry of entries) {
    const course = await prisma.course.findUnique({
      where: { slug: normalizeSlug(entry.slug) },
      select: { id: true },
    });
    if (!course) {
      result.unknownSlugs.push(entry.slug);
      continue;
    }
    const rows = toLessonRows(entry);
    await prisma.$transaction([
      prisma.courseLesson.deleteMany({ where: { courseId: course.id } }),
      prisma.courseLesson.createMany({
        data: rows.map((row) => ({ courseId: course.id, ...row })),
      }),
    ]);
    result.courses += 1;
    result.lessons += rows.length;
  }
  return result;
}
