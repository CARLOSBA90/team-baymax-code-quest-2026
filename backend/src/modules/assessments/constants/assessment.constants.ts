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
 * Mapeo de la opción elegida en la pregunta de stack/framework (orden 2)
 * hacia el keyword técnico que entiende el generador de rutas.
 */
export const TECH_STACK_BY_OPTION_ORDER: Readonly<Record<number, string>> = {
  1: 'Angular',
  2: 'React',
  3: 'Vue',
  4: 'NestJS',
  5: 'Python',
  6: 'Spring Boot',
  7: 'Flutter',
  8: 'C#',
} as const;

/**
 * Mapeo de la tecnología seleccionada a su categoría principal correspondiente.
 */
export const CATEGORY_BY_TECH_STACK_OPTION: Readonly<
  Record<number, SkillCategory>
> = {
  1: SkillCategory.FRONTEND,
  2: SkillCategory.FRONTEND,
  3: SkillCategory.FRONTEND,
  4: SkillCategory.BACKEND,
  5: SkillCategory.BACKEND,
  6: SkillCategory.BACKEND,
  7: SkillCategory.MOBILE,
  8: SkillCategory.BACKEND,
} as const;

/**
 * Mapeo de la opción de disponibilidad semanal a horas de estudio estimadas.
 */
export const WEEKLY_HOURS_BY_OPTION_ORDER: Readonly<Record<number, number>> = {
  1: 2,
  2: 5,
  3: 10,
} as const;

/**
 * Multiplicador para escalar el puntaje de las opciones (escala 1 a 5)
 * a un puntaje de diagnóstico de 5 a 25 puntos por área.
 */
export const SCORE_MULTIPLIER = 5;

