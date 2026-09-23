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
