import { SkillCategory } from '../../generated/prisma/enums.js';

/** Nivel interno para cada valor de level aceptado en el CSV. */
export const LEVEL_BY_NAME = new Map<string, number>([
  ['beginner', 1],
  ['intermediate', 2],
  ['advanced', 3],
]);

/**
 * Tabla de normalización de tags a skills de 03-catalogo-cursos.md, ampliada
 * con los tags del catálogo de DevTalles (IA va a BACKEND). También acepta el
 * nombre de cada skill como tag. Los tags que no están aquí se ignoran.
 */
export const SKILL_BY_TAG = new Map<string, SkillCategory>([
  ['nestjs', SkillCategory.BACKEND],
  ['express', SkillCategory.BACKEND],
  ['node', SkillCategory.BACKEND],
  ['bun', SkillCategory.BACKEND],
  ['graphql', SkillCategory.BACKEND],
  ['microservicios', SkillCategory.BACKEND],
  ['java', SkillCategory.BACKEND],
  ['spring-boot', SkillCategory.BACKEND],
  ['kafka', SkillCategory.BACKEND],
  ['go', SkillCategory.BACKEND],
  ['python', SkillCategory.BACKEND],
  ['fastapi', SkillCategory.BACKEND],
  ['django', SkillCategory.BACKEND],
  ['php', SkillCategory.BACKEND],
  ['laravel', SkillCategory.BACKEND],
  ['dotnet', SkillCategory.BACKEND],
  ['csharp', SkillCategory.BACKEND],
  ['nest', SkillCategory.BACKEND],
  ['spring', SkillCategory.BACKEND],
  ['rest', SkillCategory.BACKEND],
  ['grpc', SkillCategory.BACKEND],
  ['ai', SkillCategory.BACKEND],
  ['ia', SkillCategory.BACKEND],
  ['llm', SkillCategory.BACKEND],
  ['rag', SkillCategory.BACKEND],
  ['openai', SkillCategory.BACKEND],
  ['langchain', SkillCategory.BACKEND],
  ['mcp', SkillCategory.BACKEND],
  ['agentes', SkillCategory.BACKEND],
  ['codex', SkillCategory.BACKEND],
  ['backend', SkillCategory.BACKEND],
  ['react', SkillCategory.FRONTEND],
  ['vue', SkillCategory.FRONTEND],
  ['angular', SkillCategory.FRONTEND],
  ['nextjs', SkillCategory.FRONTEND],
  ['nuxt', SkillCategory.FRONTEND],
  ['astro', SkillCategory.FRONTEND],
  ['qwik', SkillCategory.FRONTEND],
  ['blazor', SkillCategory.FRONTEND],
  ['react-router', SkillCategory.FRONTEND],
  ['tanstack-query', SkillCategory.FRONTEND],
  ['rxjs', SkillCategory.FRONTEND],
  ['pwa', SkillCategory.FRONTEND],
  ['tailwindcss', SkillCategory.FRONTEND],
  ['tailwind', SkillCategory.FRONTEND],
  ['css', SkillCategory.FRONTEND],
  ['pinia', SkillCategory.FRONTEND],
  ['shadcn', SkillCategory.FRONTEND],
  ['frontend', SkillCategory.FRONTEND],
  ['typescript', SkillCategory.WEB_FUNDAMENTALS],
  ['javascript', SkillCategory.WEB_FUNDAMENTALS],
  ['web-fundamentals', SkillCategory.WEB_FUNDAMENTALS],
  ['git', SkillCategory.WEB_FUNDAMENTALS],
  ['github', SkillCategory.WEB_FUNDAMENTALS],
  ['docker', SkillCategory.DEVOPS],
  ['kubernetes', SkillCategory.DEVOPS],
  ['ci-cd', SkillCategory.DEVOPS],
  ['aws', SkillCategory.DEVOPS],
  ['devops', SkillCategory.DEVOPS],
  ['sql', SkillCategory.DATABASES],
  ['postgresql', SkillCategory.DATABASES],
  ['mongodb', SkillCategory.DATABASES],
  ['sql-server', SkillCategory.DATABASES],
  ['postgres', SkillCategory.DATABASES],
  ['mysql', SkillCategory.DATABASES],
  ['typeorm', SkillCategory.DATABASES],
  ['databases', SkillCategory.DATABASES],
  ['flutter', SkillCategory.MOBILE],
  ['dart', SkillCategory.MOBILE],
  ['react-native', SkillCategory.MOBILE],
  ['expo', SkillCategory.MOBILE],
  ['ios', SkillCategory.MOBILE],
  ['android', SkillCategory.MOBILE],
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
