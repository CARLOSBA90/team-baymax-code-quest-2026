import {
  CourseStatus,
  type SkillCategory,
} from '../../../generated/prisma/enums.js';
import { LEVEL_BY_NAME, SKILL_BY_TAG } from '../catalog.constants.js';
import type { RawCourse } from '../ingestion/catalog-ingestion.interface.js';
import type {
  CourseNormalization,
  CourseSkillInput,
  NormalizedCourse,
} from '../types/catalog.types.js';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DURATION_PATTERN = /^[1-9]\d*$/;
const DIACRITICS = /[̀-ͯ]/g;

/** Lleva un slug a minúsculas, sin tildes y con guiones en lugar de _. */
export function normalizeSlug(value: string): string {
  return value
    .trim()
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .toLowerCase()
    .replace(/_/g, '-');
}

/**
 * Convierte los tags en skills internas con peso de 0 a 1: la fracción de
 * tags reconocidos que apunta a cada skill. Los tags desconocidos se ignoran.
 */
export function normalizeTags(tags: string): CourseSkillInput[] {
  const uniqueTags = new Set(
    tags
      .split(',')
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean),
  );
  const counts = new Map<SkillCategory, number>();

  for (const tag of uniqueTags) {
    const skill = SKILL_BY_TAG.get(tag);
    if (skill) counts.set(skill, (counts.get(skill) ?? 0) + 1);
  }

  const total = [...counts.values()].reduce((sum, count) => sum + count, 0);

  return [...counts]
    .map(([skill, count]) => ({
      skill,
      weight: Math.round((count / total) * 100) / 100,
    }))
    .sort((a, b) => b.weight - a.weight || a.skill.localeCompare(b.skill));
}

/**
 * Valida una fila cruda y la lleva al formato de Course. Sin skills
 * reconocidas queda en PENDING_REVIEW; una duración inválida queda en null.
 */
export function normalizeCourse(raw: RawCourse): CourseNormalization {
  const problems: string[] = [];
  const slug = normalizeSlug(raw.slug);
  const title = raw.title.trim();
  const url = raw.url.trim();
  const level = LEVEL_BY_NAME.get(raw.level.trim().toLowerCase());
  const imageUrl = raw.imageUrl.trim();
  const duration = raw.durationHours.trim();
  const durationHours = DURATION_PATTERN.test(duration)
    ? Number(duration)
    : null;

  if (!SLUG_PATTERN.test(slug)) {
    problems.push('slug vacío o inválido (solo minúsculas, números y guiones)');
  }
  if (!title) problems.push('title es obligatorio');
  if (!isHttpUrl(url)) problems.push('url debe ser una URL http o https');
  if (level === undefined) {
    problems.push('level debe ser beginner, intermediate o advanced');
  }
  if (imageUrl && !isHttpUrl(imageUrl)) {
    problems.push('imageUrl debe ser una URL http o https');
  }

  if (problems.length > 0 || level === undefined) {
    return { ok: false, problems };
  }

  const skills = normalizeTags(raw.tags);

  return {
    ok: true,
    course: {
      slug,
      title,
      url,
      description: raw.description.trim() || null,
      imageUrl: imageUrl || null,
      level,
      durationHours,
      status:
        skills.length > 0 ? CourseStatus.ACTIVE : CourseStatus.PENDING_REVIEW,
      skills,
    },
  };
}

/** true si algún campo o skill del curso importado difiere del guardado. */
export function hasCourseChanges(
  stored: NormalizedCourse,
  incoming: NormalizedCourse,
): boolean {
  const fields = [
    'title',
    'url',
    'description',
    'imageUrl',
    'level',
    'durationHours',
    'status',
  ] as const;

  return (
    fields.some((field) => stored[field] !== incoming[field]) ||
    skillsKey(stored.skills) !== skillsKey(incoming.skills)
  );
}

function skillsKey(skills: CourseSkillInput[]): string {
  return skills
    .map(({ skill, weight }) => `${skill}:${weight}`)
    .sort()
    .join('|');
}

function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}
