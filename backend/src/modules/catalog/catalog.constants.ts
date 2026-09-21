import { SkillCategory } from '../../generated/prisma/enums.js';

/** Nivel interno para cada valor de level aceptado en el CSV. */
export const LEVEL_BY_NAME = new Map<string, number>([
  ['beginner', 1],
  ['intermediate', 2],
  ['advanced', 3],
]);

/**
 * Tabla de normalización de tags a skills de 03-catalogo-cursos.md.
 * También acepta el nombre de cada skill como tag, como el CSV de ejemplo.
 */
export const SKILL_BY_TAG = new Map<string, SkillCategory>([
  ['nestjs', SkillCategory.BACKEND],
  ['express', SkillCategory.BACKEND],
  ['node', SkillCategory.BACKEND],
  ['backend', SkillCategory.BACKEND],
  ['react', SkillCategory.FRONTEND],
  ['vue', SkillCategory.FRONTEND],
  ['angular', SkillCategory.FRONTEND],
  ['frontend', SkillCategory.FRONTEND],
  ['typescript', SkillCategory.WEB_FUNDAMENTALS],
  ['javascript', SkillCategory.WEB_FUNDAMENTALS],
  ['web-fundamentals', SkillCategory.WEB_FUNDAMENTALS],
  ['docker', SkillCategory.DEVOPS],
  ['kubernetes', SkillCategory.DEVOPS],
  ['ci-cd', SkillCategory.DEVOPS],
  ['devops', SkillCategory.DEVOPS],
  ['sql', SkillCategory.DATABASES],
  ['postgresql', SkillCategory.DATABASES],
  ['mongodb', SkillCategory.DATABASES],
  ['databases', SkillCategory.DATABASES],
  ['flutter', SkillCategory.MOBILE],
  ['react-native', SkillCategory.MOBILE],
  ['mobile', SkillCategory.MOBILE],
  ['testing', SkillCategory.TESTING],
  ['jest', SkillCategory.TESTING],
  ['vitest', SkillCategory.TESTING],
]);

/** Columnas que el encabezado del CSV debe incluir. */
export const REQUIRED_CSV_COLUMNS = [
  'slug',
  'title',
  'url',
  'level',
  'tags',
] as const;

/** Tamaño máximo del CSV recibido como archivo multipart (1 MB). */
export const MAX_CSV_FILE_BYTES = 1024 * 1024;

/** Paginación por defecto y límite máximo de GET /catalog/courses. */
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;
