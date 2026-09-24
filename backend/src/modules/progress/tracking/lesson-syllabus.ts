/**
 * Syllabus copied into a roadmap item when the roadmap is generated. It is the
 * item's own snapshot: later catalog reimports do not change it, and lesson
 * progress refers to these lesson ids.
 */
export interface SyllabusLesson {
  id: string;
  title: string;
  type: string;
  freePreview: boolean;
}

export interface SyllabusSection {
  title: string;
  lessons: SyllabusLesson[];
}

export interface SyllabusSnapshot {
  sections: SyllabusSection[];
}

interface CatalogLesson {
  id: string;
  sectionOrder: number;
  sectionTitle: string;
  title: string;
  type: string;
  freePreview: boolean;
}

/** Groups catalog lessons (already ordered) into sections for the snapshot. */
export function buildSyllabusSnapshot(
  lessons: readonly CatalogLesson[],
): SyllabusSnapshot {
  const sections: SyllabusSection[] = [];
  let currentOrder: number | null = null;
  for (const lesson of lessons) {
    if (lesson.sectionOrder !== currentOrder) {
      sections.push({ title: lesson.sectionTitle, lessons: [] });
      currentOrder = lesson.sectionOrder;
    }
    sections.at(-1)!.lessons.push({
      id: lesson.id,
      title: lesson.title,
      type: lesson.type,
      freePreview: lesson.freePreview,
    });
  }
  return { sections };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/** Reads the snapshot stored in an item's contentData; null when absent. */
export function readSyllabus(contentData: unknown): SyllabusSnapshot | null {
  const syllabus = isObject(contentData) ? contentData.syllabus : null;
  if (!isObject(syllabus) || !Array.isArray(syllabus.sections)) return null;
  const sections = syllabus.sections.filter(isObject).map((section) => ({
    title: typeof section.title === 'string' ? section.title : '',
    lessons: (Array.isArray(section.lessons) ? section.lessons : [])
      .filter(isObject)
      .filter((lesson) => typeof lesson.id === 'string')
      .map((lesson) => ({
        id: lesson.id as string,
        title: typeof lesson.title === 'string' ? lesson.title : '',
        type: typeof lesson.type === 'string' ? lesson.type : 'OTHER',
        freePreview: lesson.freePreview === true,
      })),
  }));
  return sections.some((section) => section.lessons.length > 0)
    ? { sections }
    : null;
}

export function syllabusLessonIds(syllabus: SyllabusSnapshot | null): string[] {
  return (
    syllabus?.sections.flatMap((section) =>
      section.lessons.map((lesson) => lesson.id),
    ) ?? []
  );
}

/**
 * Where the student should continue: the first pending lesson from the last
 * one they marked onwards, else the first pending lesson; null when done.
 */
export function nextLesson(
  syllabus: SyllabusSnapshot,
  completedLessons: ReadonlySet<string>,
  lastLessonId?: string,
  positions: Readonly<Record<string, number>> = {},
) {
  const lessons = syllabus.sections.flatMap((section) =>
    section.lessons.map((lesson) => ({ ...lesson, section: section.title })),
  );
  const lastIndex = lessons.findIndex((lesson) => lesson.id === lastLessonId);
  const pending = (lesson: (typeof lessons)[number]) =>
    !completedLessons.has(lesson.id);
  // Start at the last marked lesson itself: if it was unmarked it is pending
  // again and is where the student continues.
  const next =
    lessons.slice(Math.max(lastIndex, 0)).find(pending) ??
    lessons.find(pending);
  return next
    ? {
        lesson_id: next.id,
        title: next.title,
        section_title: next.section,
        position: lessons.indexOf(next) + 1,
        position_seconds: positions[next.id] ?? null,
      }
    : null;
}

/** Public shape of the syllabus, with each lesson's completion. */
export function serializeSyllabus(
  syllabus: SyllabusSnapshot,
  completedLessons: ReadonlySet<string>,
  lastLessonId?: string,
  positions: Readonly<Record<string, number>> = {},
) {
  const total = syllabusLessonIds(syllabus).length;
  return {
    total_lessons: total,
    completed_lessons: syllabusLessonIds(syllabus).filter((id) =>
      completedLessons.has(id),
    ).length,
    last_lesson_id: lastLessonId ?? null,
    next_lesson: nextLesson(
      syllabus,
      completedLessons,
      lastLessonId,
      positions,
    ),
    sections: syllabus.sections.map((section) => ({
      title: section.title,
      lessons: section.lessons.map((lesson) => ({
        lesson_id: lesson.id,
        title: lesson.title,
        type: lesson.type,
        free_preview: lesson.freePreview,
        completed: completedLessons.has(lesson.id),
        position_seconds: positions[lesson.id] ?? null,
      })),
    })),
  };
}
