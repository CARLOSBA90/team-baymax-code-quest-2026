import { describe, expect, it } from 'vitest';
import { serializeRoadmapDetail } from './roadmap-detail.mapper.js';

describe('serializeRoadmapDetail', () => {
  it('projects courses without hiding mixed content', () => {
    const now = new Date('2026-09-22T17:00:00.000Z');
    const detail = serializeRoadmapDetail({
      id: 'roadmap-1',
      title: 'Backend path',
      summary: 'A path',
      generatorVersion: 'rules-courses-v1',
      generationContextSnapshot: {
        generator: {
          provider: 'RULES',
          fallbackFrom: 'NVIDIA',
          attemptedProviders: ['NVIDIA', 'RULES'],
          attemptedModels: ['model-a', 'model-b'],
        },
      },
      pausedAt: null,
      lastActivityAt: now,
      activityVersion: 2,
      createdAt: now,
      items: [
        {
          id: 'item-course',
          type: 'COURSE',
          courseId: 'course-1',
          order: 1,
          name: 'APIs',
          description: null,
          image: null,
          url: 'https://example.com/course',
          level: 1,
          estimatedMinutes: '120.00',
          reason: 'Foundation',
          contentData: { schemaVersion: 4 },
          progress: {
            percentage: 50,
            version: 1,
            updatedAt: now,
            trackingState: {},
            startedAt: null,
            completedAt: null,
          },
        },
        {
          id: 'item-media',
          type: 'MEDIA',
          courseId: null,
          order: 2,
          name: 'HTTP article',
          description: 'Read HTTP basics',
          image: null,
          url: 'https://example.com/article',
          level: null,
          estimatedMinutes: 10,
          reason: 'Reinforcement',
          contentData: { schemaVersion: 4, kind: 'ARTICLE' },
          progress: {
            percentage: 0,
            version: 0,
            updatedAt: now,
            trackingState: {},
            startedAt: null,
            completedAt: null,
          },
        },
      ],
    });

    expect(detail.progress).toBe(25);
    expect(detail.generator).toEqual({
      type: 'DETERMINISTIC',
      provider: 'RULES',
      version: 'rules-courses-v1',
      fallback_from: 'NVIDIA',
      attempted_providers: ['NVIDIA', 'RULES'],
      attempted_models: ['model-a', 'model-b'],
    });
    expect(detail.courses).toHaveLength(1);
    expect(detail.courses[0]?.id).toBe('course-1');
    expect(detail.content).toHaveLength(2);
    expect(detail.content[1]?.details).toEqual({
      schemaVersion: 4,
      kind: 'ARTICLE',
    });
  });

  it('exposes the lesson syllabus with each lesson state', () => {
    const now = new Date('2026-09-24T00:00:00.000Z');
    const detail = serializeRoadmapDetail({
      id: 'roadmap-1',
      title: 'Backend path',
      summary: 'A path',
      generatorVersion: 'nvidia:model',
      generationContextSnapshot: {},
      pausedAt: null,
      lastActivityAt: now,
      activityVersion: 1,
      createdAt: now,
      items: [
        {
          id: 'item-node',
          type: 'COURSE',
          courseId: 'course-node',
          order: 1,
          name: 'Node',
          description: null,
          image: null,
          url: 'https://example.com/node',
          level: 1,
          estimatedMinutes: 60,
          reason: 'Foundation',
          contentData: {
            schemaVersion: 4,
            tracking: { type: 'LESSONS' },
            syllabus: {
              sections: [
                {
                  title: 'Intro',
                  lessons: [
                    {
                      id: 'l1',
                      title: 'Hola',
                      type: 'VIDEO',
                      freePreview: true,
                    },
                    {
                      id: 'l2',
                      title: 'Setup',
                      type: 'TEXT',
                      freePreview: false,
                    },
                  ],
                },
              ],
            },
          },
          progress: {
            percentage: 50,
            version: 1,
            updatedAt: now,
            trackingState: { completedLessons: ['l1'], lastLessonId: 'l1' },
            startedAt: now,
            completedAt: null,
          },
        },
      ],
    });

    const course = detail.content[0]!;
    expect(course.tracking).toMatchObject({
      type: 'LESSONS',
      metadata: { total_lessons: 2 },
    });
    expect(course.syllabus).toMatchObject({
      total_lessons: 2,
      completed_lessons: 1,
      sections: [
        {
          title: 'Intro',
          lessons: [
            { lesson_id: 'l1', completed: true, free_preview: true },
            { lesson_id: 'l2', completed: false },
          ],
        },
      ],
    });
    expect(course.details).not.toHaveProperty('syllabus');
    expect(detail.next_step).toEqual({
      roadmap_item_id: 'item-node',
      name: 'Node',
      url: 'https://example.com/node',
      lesson: {
        lesson_id: 'l2',
        title: 'Setup',
        section_title: 'Intro',
        position: 2,
        position_seconds: null,
      },
    });
  });
});
