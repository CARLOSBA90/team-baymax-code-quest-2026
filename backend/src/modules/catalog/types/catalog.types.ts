import type {
  CourseStatus,
  SkillCategory,
} from '../../../generated/prisma/enums.js';

export interface CourseSkillInput {
  skill: SkillCategory;
  weight: number;
}

/** Curso validado y listo para guardarse en el modelo Course. */
export interface NormalizedCourse {
  slug: string;
  title: string;
  url: string;
  description: string | null;
  imageUrl: string | null;
  level: number;
  durationHours: number | null;
  status: CourseStatus;
  skills: CourseSkillInput[];
}

export type CourseNormalization =
  { ok: true; course: NormalizedCourse } | { ok: false; problems: string[] };

/** Error de una importación; row y slug faltan si no es de una fila. */
export interface ImportError {
  row?: number;
  slug?: string;
  message: string;
}
