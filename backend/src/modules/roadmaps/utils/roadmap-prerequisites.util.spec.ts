import { describe, expect, it } from 'vitest';
import {
  orderForLearning,
  orderWithRequiredPrerequisites,
  PrerequisiteResolutionError,
  PrerequisiteResolutionFailure,
} from './roadmap-prerequisites.util.js';

interface Candidate {
  id: string;
  prerequisites: string[];
}

const resolve = (
  selected: Candidate[],
  candidates: Candidate[],
  maximum = 50,
) =>
  orderWithRequiredPrerequisites(
    selected,
    candidates,
    (candidate) => candidate.prerequisites,
    maximum,
  );

describe('orderWithRequiredPrerequisites', () => {
  it('orders required prerequisites before their dependent course', () => {
    const foundation = { id: 'foundation', prerequisites: [] };
    const advanced = { id: 'advanced', prerequisites: ['foundation'] };

    expect(
      resolve([advanced], [advanced, foundation]).map(({ id }) => id),
    ).toEqual(['foundation', 'advanced']);
  });

  it('allows exactly the configured maximum', () => {
    const candidates = Array.from({ length: 50 }, (_, index) => ({
      id: `course-${index + 1}`,
      prerequisites: index === 0 ? [] : [`course-${index}`],
    }));

    expect(resolve([candidates.at(-1)!], candidates)).toHaveLength(50);
  });

  it('rejects a linear chain that exceeds the configured maximum', () => {
    const candidates = Array.from({ length: 51 }, (_, index) => ({
      id: `course-${index + 1}`,
      prerequisites: index === 0 ? [] : [`course-${index}`],
    }));

    expect(() => resolve([candidates.at(-1)!], candidates)).toThrowError(
      expect.objectContaining<Partial<PrerequisiteResolutionError>>({
        failure: PrerequisiteResolutionFailure.LIMIT_EXCEEDED,
      }),
    );
  });

  it('rejects cycles', () => {
    const candidates = [
      { id: 'a', prerequisites: ['b'] },
      { id: 'b', prerequisites: ['a'] },
    ];

    expect(() => resolve([candidates[0]!], candidates)).toThrowError(
      expect.objectContaining<Partial<PrerequisiteResolutionError>>({
        failure: PrerequisiteResolutionFailure.CYCLE,
      }),
    );
  });
});

describe('orderForLearning', () => {
  const course = (id: string, level: number, prerequisites: string[] = []) => ({
    id,
    level,
    prerequisites,
  });
  const order = (selected: ReturnType<typeof course>[], all = selected) =>
    orderForLearning(
      selected,
      all,
      (candidate) => candidate.prerequisites,
      50,
    ).map(({ id }) => id);

  it('moves lower levels first and keeps the generator order within a level', () => {
    expect(
      order([
        course('node', 1),
        course('fastapi', 2),
        course('openai', 2),
        course('graphql', 1),
        course('nest', 1),
      ]),
    ).toEqual(['node', 'graphql', 'nest', 'fastapi', 'openai']);
  });

  it('still places a required prerequisite before its dependent course', () => {
    const nest = course('nest', 2);
    const graphql = course('graphql', 1, ['nest']);

    expect(order([graphql, nest])).toEqual(['nest', 'graphql']);
  });
});
