import {
  buildSyllabusSnapshot,
  nextLesson,
  readSyllabus,
  serializeSyllabus,
  syllabusLessonIds,
} from './lesson-syllabus.js';

const lesson = (id: string, sectionOrder: number, sectionTitle: string) => ({
  id,
  sectionOrder,
  sectionTitle,
  title: `Lección ${id}`,
  type: 'VIDEO',
  freePreview: id === 'l1',
});

describe('lesson syllabus', () => {
  const snapshot = buildSyllabusSnapshot([
    lesson('l1', 1, 'Introducción'),
    lesson('l2', 1, 'Introducción'),
    lesson('l3', 2, 'Fundamentos'),
  ]);

  it('groups ordered catalog lessons into sections', () => {
    expect(snapshot.sections.map((section) => section.title)).toEqual([
      'Introducción',
      'Fundamentos',
    ]);
    expect(syllabusLessonIds(snapshot)).toEqual(['l1', 'l2', 'l3']);
  });

  it('reads back the snapshot stored in contentData', () => {
    expect(readSyllabus({ syllabus: snapshot })).toEqual(snapshot);
    expect(readSyllabus({})).toBeNull();
    expect(readSyllabus({ syllabus: { sections: [] } })).toBeNull();
  });

  it('serializes lesson completion, counters and where to continue', () => {
    const result = serializeSyllabus(
      snapshot,
      new Set(['l2', 'unknown']),
      'l2',
    );
    expect(result.total_lessons).toBe(3);
    expect(result.completed_lessons).toBe(1);
    expect(result.last_lesson_id).toBe('l2');
    expect(result.next_lesson?.lesson_id).toBe('l3');
    expect(result.sections[0].lessons).toEqual([
      {
        lesson_id: 'l1',
        title: 'Lección l1',
        type: 'VIDEO',
        free_preview: true,
        completed: false,
        position_seconds: null,
      },
      {
        lesson_id: 'l2',
        title: 'Lección l2',
        type: 'VIDEO',
        free_preview: false,
        completed: true,
        position_seconds: null,
      },
    ]);
  });

  describe('nextLesson', () => {
    it('starts at the first lesson when nothing is marked', () => {
      expect(nextLesson(snapshot, new Set())).toEqual({
        lesson_id: 'l1',
        title: 'Lección l1',
        section_title: 'Introducción',
        position: 1,
        position_seconds: null,
      });
    });

    it('continues after the last marked lesson, across sections', () => {
      expect(nextLesson(snapshot, new Set(['l1', 'l2']), 'l2')?.lesson_id).toBe(
        'l3',
      );
    });

    it('goes back to earlier gaps after the last lesson of the course', () => {
      expect(nextLesson(snapshot, new Set(['l3']), 'l3')?.lesson_id).toBe('l1');
    });

    it('returns to the last lesson when it was unmarked', () => {
      expect(nextLesson(snapshot, new Set(['l1']), 'l2')?.lesson_id).toBe('l2');
    });

    it('includes the second where the student stopped', () => {
      expect(
        nextLesson(snapshot, new Set(['l1']), 'l2', { l2: 312 }),
      ).toMatchObject({ lesson_id: 'l2', position_seconds: 312 });
    });

    it('is null when every lesson is done', () => {
      expect(
        nextLesson(snapshot, new Set(['l1', 'l2', 'l3']), 'l3'),
      ).toBeNull();
    });
  });
});
