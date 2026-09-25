import type { RoadmapGeneratorContext } from './roadmap-generator.interface.js';

type Candidate = RoadmapGeneratorContext['candidates'][number];

/** Minimum length for a truncated title to count as the same course. */
const MIN_TITLE_PREFIX_LENGTH = 12;

/**
 * Small models mix up long, similar IDs (cuid). The prompt uses short aliases
 * (c1, c2…) that are translated back to real course IDs on the server.
 */
export function courseReference(index: number): string {
  return `c${index + 1}`;
}

export function referencedCandidates(candidates: readonly Candidate[]) {
  const byReference = new Map<string, Candidate>();
  const promptCandidates = candidates.map(({ id, ...candidate }, index) => {
    const ref = courseReference(index);
    byReference.set(ref, { id, ...candidate });
    return { ref, ...candidate };
  });
  return { byReference, promptCandidates };
}

function normalizeTitle(title: string): string {
  return title
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

/**
 * The model repeats the title of each course it selects; a mismatch means it
 * attached the reason of one course to the reference of another.
 */
export function titlesMatch(returned: string, expected: string): boolean {
  const left = normalizeTitle(returned);
  const right = normalizeTitle(expected);
  if (!left || !right) return false;
  if (left === right) return true;
  const [shorter, longer] =
    left.length < right.length ? [left, right] : [right, left];
  return (
    shorter.length >= MIN_TITLE_PREFIX_LENGTH && longer.startsWith(shorter)
  );
}
