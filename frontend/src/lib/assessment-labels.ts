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

/** Etapa de la narración de la espera mientras el backend genera la ruta. */
export interface AssessmentGeneratingStage {
  /** Identificador estable (keys y tests). */
  id: "saving" | "analyzing" | "building";
  /** ms desde el inicio de la espera a partir de los que se muestra esta etapa. */
  delayMs: number;
  /** Texto visible en el diálogo. */
  message: string;
  /** Texto para la live region; `null` = esta etapa no se anuncia. */
  announcement: string | null;
}

export const ASSESSMENT_GENERATING_TITLE = "Estamos creando tu ruta";

export const ASSESSMENT_GENERATING_DESCRIPTION =
  "Suele tardar menos de medio minuto. No cierres ni recargues esta página mientras la preparamos.";

export const ASSESSMENT_GENERATING_STAGES: readonly AssessmentGeneratingStage[] = [
  {
    id: "saving",
    delayMs: 0,
    message: "Guardamos tus respuestas…",
    announcement: "Estamos creando tu ruta. Guardamos tus respuestas.",
  },
  {
    id: "analyzing",
    delayMs: 7_000,
    message: "Analizamos tu perfil y tu nivel…",
    // La etapa intermedia no se anuncia: tres anuncios seguidos son ruido en un lector.
    announcement: null,
  },
  {
    id: "building",
    delayMs: 18_000,
    message: "Elegimos tus cursos y montamos la ruta…",
    announcement: "Elegimos tus cursos y montamos tu ruta. Puede tardar unos segundos más.",
  },
];

/** Etapa visible para un índice; fuera de rango se acota a la primera/última. */
export function getAssessmentGeneratingStage(index: number): AssessmentGeneratingStage {
  const last = ASSESSMENT_GENERATING_STAGES.length - 1;
  return ASSESSMENT_GENERATING_STAGES[Math.min(Math.max(index, 0), last)];
}

/**
 * Texto de la live region para un índice: el anuncio de la última etapa anunciable hasta ese
 * índice (la intermedia no anuncia, así que conserva el de la primera). `""` si ninguna tiene.
 */
export function getAssessmentGeneratingAnnouncement(index: number): string {
  const last = ASSESSMENT_GENERATING_STAGES.length - 1;
  const bounded = Math.min(Math.max(index, 0), last);
  for (let i = bounded; i >= 0; i -= 1) {
    const { announcement } = ASSESSMENT_GENERATING_STAGES[i];
    if (announcement !== null) {
      return announcement;
    }
  }
  return "";
}
