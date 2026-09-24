import { describe, expect, it } from 'vitest';
import {
  aggregateRoadmapProgress,
  truncatePercentage,
} from './progress-aggregation.util.js';

describe('truncatePercentage', () => {
  it.each([
    [(1 * 100) / 390, 0.25],
    [22.5, 22.5],
    [100 / 3, 33.33],
    [0.29 * 100, 29],
    [(389 * 100) / 390, 99.74],
    [100, 100],
  ])('truncates %d to %d', (value, expected) => {
    expect(truncatePercentage(value)).toBe(expected);
  });
});

describe('aggregateRoadmapProgress', () => {
  it.each([
    [[100, 25, 0], 41.66],
    [[8], 8],
    [[0.25, 0, 0, 0, 0], 0.05],
    [[42], 42],
  ])('averages %j as %d', (values, expected) => {
    expect(aggregateRoadmapProgress(values, null).progress).toBe(expected);
  });

  it('uses raw percentages to derive an in-progress status', () => {
    expect(aggregateRoadmapProgress([1, 0, 0], null)).toEqual({
      progress: 0.33,
      status: 'IN_PROGRESS',
    });
  });

  it('is in progress once any item has activity, even at 0 %', () => {
    expect(aggregateRoadmapProgress([0, 0], null, true)).toEqual({
      progress: 0,
      status: 'IN_PROGRESS',
    });
    expect(aggregateRoadmapProgress([0, 0], null, false).status).toBe(
      'NOT_STARTED',
    );
  });

  it('never reports 100 until every item is complete', () => {
    const summary = aggregateRoadmapProgress([100, 99.99], null);
    expect(summary.progress).toBeLessThan(100);
    expect(summary.status).toBe('IN_PROGRESS');
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
