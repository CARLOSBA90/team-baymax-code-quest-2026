import { SkillCategory } from '../../../generated/prisma/enums.js';

/**
 * Mapeo determinístico de la opción elegida en la pregunta de objetivo (orden 1)
 * hacia la categoría de especialidad principal del usuario.
 */
export const GOAL_BY_OPTION_ORDER: Record<number, SkillCategory> = {
  1: SkillCategory.FRONTEND,
  2: SkillCategory.BACKEND,
  3: SkillCategory.MOBILE,
  4: SkillCategory.WEB_FUNDAMENTALS,
} as const;

/**
 * Multiplicador para escalar el puntaje de las opciones (escala 1 a 5)
 * a un puntaje de diagnóstico de 5 a 25 puntos por área.
 */
export const SCORE_MULTIPLIER = 5;
