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
          progress: { percentage: 50, version: 1, updatedAt: now },
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
          progress: { percentage: 0, version: 0, updatedAt: now },
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
});
