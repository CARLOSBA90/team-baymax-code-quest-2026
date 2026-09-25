import type { RoadmapGeneratorContext } from './roadmap-generator.interface.js';

export const AI_CANDIDATE_LIMIT = 20;
export const AI_DESCRIPTION_LIMIT = 240;
const AI_TITLE_LIMIT = 160;
const MIN_SEARCH_TERM_LENGTH = 3;
/** Common goal words that match most descriptions and would add noise. */
const STOP_WORDS = new Set([
  'con',
  'para',
  'por',
  'que',
  'una',
  'uno',
  'los',
  'las',
  'del',
  'como',
  'quiero',
  'aprender',
  'aprende',
  'saber',
  'ser',
  'hacer',
  'crear',
  'mas',
  'desde',
  'cero',
  'curso',
  'cursos',
  'the',
  'and',
  'with',
  'for',
  'learn',
]);

/** Keeps the original catalog intact; only the provider context is reduced. */
export function compactGenerationContext(
  context: RoadmapGeneratorContext,
): RoadmapGeneratorContext {
  const terms = [
    ...new Set(
      (context.goalDescription ?? '').toLowerCase().match(/[\p{L}\p{N}]+/gu) ??
        [],
    ),
  ].filter(
    (term) => term.length >= MIN_SEARCH_TERM_LENGTH && !STOP_WORDS.has(term),
  );
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
