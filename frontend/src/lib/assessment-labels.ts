import type { SkillCategory } from "@/types";

export const DEFAULT_ASSESSMENT_HELPER_TEXT = "Elige una opción.";

export const SKILL_CATEGORY_LABELS: Record<SkillCategory, string> = {
  WEB_FUNDAMENTALS: "Fundamentos",
  FRONTEND: "Frontend",
  BACKEND: "Backend",
  DEVOPS: "DevOps",
  DATABASES: "Bases de datos",
  MOBILE: "Desarrollo móvil",
  TESTING: "Testing",
};

export function getSkillCategoryLabel(category: SkillCategory): string {
  return SKILL_CATEGORY_LABELS[category];
}

const COUNT_WORDS: Record<number, string> = {
  2: "Dos",
  3: "Tres",
  4: "Cuatro",
  5: "Cinco",
  6: "Seis",
  7: "Siete",
  8: "Ocho",
  9: "Nueve",
  10: "Diez",
};

const SUBTITLE_SUFFIX =
  "Con tus respuestas elegimos los cursos de DevTalles y el orden en que te conviene tomarlos.";

/**
 * Subtítulo de la página del cuestionario. Sin recuento (carga, error o lista vacía)
 * devuelve un texto neutro, sin número.
 */
export function getAssessmentSubtitle(count?: number): string {
  if (count === undefined || count < 1) {
    return `Unas preguntas rápidas. ${SUBTITLE_SUFFIX}`;
  }
  if (count === 1) {
    return `Una pregunta rápida. ${SUBTITLE_SUFFIX}`;
  }
  const countLabel = COUNT_WORDS[count] ?? String(count);
  return `${countLabel} preguntas rápidas. ${SUBTITLE_SUFFIX}`;
}
