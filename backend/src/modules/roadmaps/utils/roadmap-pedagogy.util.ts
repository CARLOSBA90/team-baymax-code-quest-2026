/**
 * Pedagogical phase assignment for roadmap ordering.
 *
 * When two courses share the same `level` (beginner / intermediate / advanced)
 * and no prerequisite relationship forces one before the other, the ordering
 * algorithm uses this phase as a secondary sort key to produce a natural
 * learning progression:
 *
 *   Phase 1 → Language / Runtime fundamentals
 *   Phase 2 → Primary framework
 *   Phase 3 → Tooling, state management, styling, testing
 *   Phase 4 → Meta-frameworks, advanced patterns, architecture
 *
 * Courses not listed here default to Phase 3 (mid-tier tooling), which is the
 * safest fallback for unknown specialisations.
 */

export const PEDAGOGICAL_PHASE_DEFAULT = 3;

/**
 * Maps slug fragments (hyphen-delimited token sequences, matched the same way
 * as in `tech-stack.constants.ts`) to a pedagogical phase number.
 *
 * Order within this array matters: earlier entries win when a slug matches
 * multiple fragments.
 */
export const PHASE_BY_SLUG_FRAGMENT: ReadonlyArray<
  readonly [fragment: string, phase: number]
> = [
  // ── Phase 4 FIRST: specific advanced/meta entries that share a prefix with
  //    phase-1 and phase-2 entries.  They must be checked first so that, e.g.,
  //    'java-avanzado' resolves to 4 before 'java' resolves to 1.
  // ── Phase 4: Meta-frameworks, advanced patterns, architecture ─────────────
  ['nuxt', 4],
  ['nextjs', 4],
  ['astro', 4],
  ['angular-pro', 4],
  ['angular-moderno', 4],
  ['vue-intermedio', 4],
  ['react-pro', 4],
  ['nestjs-microservicios', 4],
  ['spring-boot-microservicios', 4],
  ['springboot-mvc-hexagonal', 4],
  ['spring-boot-patrones', 4],
  ['kafka', 4],
  ['go-microservicios', 4],
  ['flutter-movil-intermedio', 4],
  ['java-avanzado', 4],
  ['net-pruebascompletas', 4],
  ['netfullstack', 4],
  ['node-clean-architecture', 4],
  ['patrones-diseno', 4],
  ['python-ia-aplicada', 4],

  // ── Phase 1: Language / Runtime fundamentals ──────────────────────────────
  ['programacion-para-principiantes', 1],
  ['javascript-moderno', 1],
  ['typescript-guia-completa', 1],
  ['python', 1],
  ['java', 1],
  ['golang-fundamentos', 1],
  ['dart-cero', 1],
  ['nodejs-de-cero', 1],
  ['node-de-cero', 1],
  ['solid-clean-code', 1],
  ['git-github', 1],
  ['sql-con-postgres', 1],

  // ── Phase 2: Primary framework / Core library ─────────────────────────────
  ['vue-cero', 2],
  ['react-de-cero', 2],
  ['angular', 2],       // base angular course (comes after angular-pro / angular-moderno)
  ['flutter-movil-cero', 2],
  ['nest', 2],          // base nest course (slug = 'nest')
  ['django', 2],
  ['fastapi', 2],
  ['spring-boot', 2],   // base spring-boot slug (comes after spring-boot-microservicios etc.)
  ['laravel', 2],
  ['php-moderno', 2],
  ['golang-backend-profesional', 2],
  ['net-backend', 2],
  ['csharp', 2],

  // ── Phase 3: Tooling, state management, styling, testing ──────────────────
  // (default – all courses not matched by phase 1, 2 or 4)
];

