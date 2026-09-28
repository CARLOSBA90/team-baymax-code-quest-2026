import {
  PEDAGOGICAL_PHASE_DEFAULT,
  PHASE_BY_SLUG_FRAGMENT,
} from './roadmap-pedagogy.util.js';

export enum PrerequisiteResolutionFailure {
  CYCLE = 'CYCLE',
  LIMIT_EXCEEDED = 'LIMIT_EXCEEDED',
  MISSING_REQUIRED_COURSE = 'MISSING_REQUIRED_COURSE',
}

export class PrerequisiteResolutionError extends Error {
  constructor(readonly failure: PrerequisiteResolutionFailure) {
    super(failure);
    this.name = 'PrerequisiteResolutionError';
  }
}

interface Identifiable {
  id: string;
}

export function orderWithRequiredPrerequisites<T extends Identifiable>(
  selected: readonly T[],
  candidates: readonly T[],
  getRequiredIds: (candidate: T) => readonly string[],
  maximumItems: number,
): T[] {
  const candidatesById = new Map(
    candidates.map((candidate) => [candidate.id, candidate]),
  );
  const ordered: T[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  const visit = (candidateId: string): void => {
    if (visited.has(candidateId)) return;
    if (visiting.has(candidateId)) {
      throw new PrerequisiteResolutionError(
        PrerequisiteResolutionFailure.CYCLE,
      );
    }
    if (visited.size + visiting.size >= maximumItems) {
      throw new PrerequisiteResolutionError(
        PrerequisiteResolutionFailure.LIMIT_EXCEEDED,
      );
    }

    const candidate = candidatesById.get(candidateId);
    if (!candidate) {
      throw new PrerequisiteResolutionError(
        PrerequisiteResolutionFailure.MISSING_REQUIRED_COURSE,
      );
    }

    visiting.add(candidateId);
    [...getRequiredIds(candidate)]
      .sort((left, right) => left.localeCompare(right))
      .forEach(visit);
    visiting.delete(candidateId);
    visited.add(candidateId);
    ordered.push(candidate);
  };

  selected.forEach((candidate) => visit(candidate.id));
  return ordered;
}

/**
 * Resolves the pedagogical phase (1–4) for a course slug.
 *
 * Uses the same token-sequence matching as `tech-stack.util.ts`:
 *  - Split slug and fragment by hyphens.
 *  - A fragment matches when its tokens appear as a contiguous sub-sequence
 *    of the slug's tokens.
 *  - Returns PEDAGOGICAL_PHASE_DEFAULT (3) when no fragment matches.
 */
export function resolvePhase(slug: string): number {
  const slugTokens = slug.toLowerCase().split('-');
  for (const [fragment, phase] of PHASE_BY_SLUG_FRAGMENT) {
    const fragTokens = fragment.toLowerCase().split('-');
    if (containsTokenSequence(slugTokens, fragTokens)) return phase;
  }
  return PEDAGOGICAL_PHASE_DEFAULT;
}

function containsTokenSequence(
  haystack: readonly string[],
  needle: readonly string[],
): boolean {
  if (needle.length === 0) return true;
  for (let i = 0; i <= haystack.length - needle.length; i++) {
    let match = true;
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) {
        match = false;
        break;
      }
    }
    if (match) return true;
  }
  return false;
}

/**
 * Learning order with pedagogical phase tie-breaking.
 *
 * Sort priority:
 *   1. Prerequisite relationships (topological, via DFS).
 *   2. Course `level` ascending (beginner before advanced).
 *   3. Pedagogical phase ascending (fundamentals before meta-frameworks).
 *   4. Alphabetical by id (deterministic fallback).
 */
export function orderForLearning<
  T extends Identifiable & { level: number; slug?: string },
>(
  selected: readonly T[],
  candidates: readonly T[],
  getRequiredIds: (candidate: T) => readonly string[],
  maximumItems: number,
): T[] {
  return orderWithRequiredPrerequisites(
    [...selected].sort((left, right) => {
      const levelDiff = left.level - right.level;
      if (levelDiff !== 0) return levelDiff;
      const leftKey = left.slug ?? left.id;
      const rightKey = right.slug ?? right.id;
      const phaseDiff = resolvePhase(leftKey) - resolvePhase(rightKey);
      if (phaseDiff !== 0) return phaseDiff;
      return left.id.localeCompare(right.id);
    }),
    candidates,
    getRequiredIds,
    maximumItems,
  );
}

