import type { RoadmapGeneratorContext } from './roadmap-generator.interface.js';

export const AI_CANDIDATE_LIMIT = 20;
export const AI_DESCRIPTION_LIMIT = 240;
const AI_TITLE_LIMIT = 160;
const MIN_SEARCH_TERM_LENGTH = 3;

/** Keeps the original catalog intact; only the provider context is reduced. */
export function compactGenerationContext(
  context: RoadmapGeneratorContext,
): RoadmapGeneratorContext {
  const terms = [
    ...new Set(
      (context.goalDescription ?? '').toLowerCase().match(/[\p{L}\p{N}]+/gu) ??
        [],
    ),
  ].filter((term) => term.length >= MIN_SEARCH_TERM_LENGTH);
  const score = (candidate: RoadmapGeneratorContext['candidates'][number]) => {
    const text =
      `${candidate.title} ${candidate.description ?? ''}`.toLowerCase();
    return terms.filter((term) => text.includes(term)).length;
  };
  const candidates = [...context.candidates]
    .sort(
      (a, b) =>
        score(b) - score(a) ||
        (b.skills.find((skill) => skill.category === context.targetCategory)
          ?.weight ?? 0) -
          (a.skills.find((skill) => skill.category === context.targetCategory)
            ?.weight ?? 0) ||
        a.level - b.level ||
        a.id.localeCompare(b.id),
    )
    .slice(0, Math.max(AI_CANDIDATE_LIMIT, context.maximumItems))
    .map((candidate) => ({
      ...candidate,
      title: candidate.title.slice(0, AI_TITLE_LIMIT),
      description:
        candidate.description?.slice(0, AI_DESCRIPTION_LIMIT) ?? null,
    }));
  return { ...context, candidates };
}
