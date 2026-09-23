import { describe, expect, it } from 'vitest';
import { aggregateRoadmapProgress } from './progress-aggregation.util.js';

describe('aggregateRoadmapProgress', () => {
  it.each([
    [[100, 25, 0], 41],
    [[8], 8],
    [[18], 18],
    [[42], 42],
  ])('averages %j as %i', (values, expected) => {
    expect(aggregateRoadmapProgress(values, null).progress).toBe(expected);
  });

  it('uses raw percentages to derive an in-progress status', () => {
    expect(aggregateRoadmapProgress([1, 0, 0], null)).toEqual({
      progress: 0,
      status: 'IN_PROGRESS',
    });
  });

  it('gives completion priority over pause', () => {
    expect(aggregateRoadmapProgress([100, 100], new Date()).status).toBe(
      'COMPLETED',
    );
  });

  it('returns a defensive empty state', () => {
    expect(aggregateRoadmapProgress([], null)).toEqual({
      progress: 0,
      status: 'NOT_STARTED',
    });
  });
});
