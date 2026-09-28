/**
 * Sub-ecosystem classification for the catalog courses.
 *
 * Each value groups courses that share the same underlying language, runtime
 * or framework ecosystem. Courses that are useful across multiple stacks are
 * labelled CROSS_CUTTING; DevOps and Database tooling follow the same rule.
 *
 * Compatibility rules:
 *  - A course is compatible with the chosen primary stack if it belongs to
 *    that same stack OR is CROSS_CUTTING / DATABASE_CORE / DEVOPS_CORE.
 *  - Frontend stacks (VUE, REACT, ANGULAR, ASTRO, QWIK) are mutually rival.
 *  - Backend stacks (NODE, PYTHON, JAVA, GO, PHP, DOTNET) are mutually rival.
 *  - Mobile stacks (FLUTTER, REACT_NATIVE) are mutually rival.
 */
export enum TechStack {
  // ── Frontend ─────────────────────────────────────────────────────────────
  VUE = 'VUE',
  REACT = 'REACT',
  ANGULAR = 'ANGULAR',
  ASTRO = 'ASTRO',
  QWIK = 'QWIK',

  // ── Backend ───────────────────────────────────────────────────────────────
  NODE = 'NODE',
  PYTHON = 'PYTHON',
  JAVA = 'JAVA',
  GO = 'GO',
  PHP = 'PHP',
  DOTNET = 'DOTNET',

  // ── Mobile ────────────────────────────────────────────────────────────────
  FLUTTER = 'FLUTTER',
  REACT_NATIVE = 'REACT_NATIVE',

  // ── Transversal / shared ──────────────────────────────────────────────────
  DEVOPS_CORE = 'DEVOPS_CORE',
  DATABASE_CORE = 'DATABASE_CORE',
  CROSS_CUTTING = 'CROSS_CUTTING',
}

/**
 * Groups of rival stacks: choosing one stack from a group implies that all
 * other stacks in the same group are incompatible with the roadmap.
 */
export const RIVAL_GROUPS: ReadonlyArray<ReadonlySet<TechStack>> = [
  // Frontend rivals
  new Set([
    TechStack.VUE,
    TechStack.REACT,
    TechStack.ANGULAR,
    TechStack.ASTRO,
    TechStack.QWIK,
  ]),
  // Backend rivals
  new Set([
    TechStack.NODE,
    TechStack.PYTHON,
    TechStack.JAVA,
    TechStack.GO,
    TechStack.PHP,
    TechStack.DOTNET,
  ]),
  // Mobile rivals
  new Set([TechStack.FLUTTER, TechStack.REACT_NATIVE]),
];

/**
 * Maps course slugs (or slug fragments) to their primary TechStack.
 * The slug-based lookup has higher priority than the tag-based lookup.
 */
export const STACK_BY_SLUG_FRAGMENT: ReadonlyArray<
  readonly [fragment: string, stack: TechStack]
> = [
  // Vue ecosystem
  ['vue', TechStack.VUE],
  ['nuxt', TechStack.VUE],
  ['pinia', TechStack.VUE],

  // React Native ecosystem (must come before React to avoid false matches)
  ['react-native', TechStack.REACT_NATIVE],
  ['expo', TechStack.REACT_NATIVE],

  // React ecosystem
  ['react', TechStack.REACT],
  ['nextjs', TechStack.REACT],
  ['next-js', TechStack.REACT],
  ['tanstack', TechStack.REACT],
  ['react-router', TechStack.REACT],
  ['shadcn', TechStack.REACT],

  // Angular ecosystem
  ['angular', TechStack.ANGULAR],
  ['rxjs', TechStack.ANGULAR],

  // Astro
  ['astro', TechStack.ASTRO],

  // Qwik
  ['qwik', TechStack.QWIK],

  // Node / NestJS ecosystem
  ['nestjs', TechStack.NODE],
  ['nest', TechStack.NODE],     // slug = 'nest' (base NestJS course)
  ['express', TechStack.NODE],
  ['node', TechStack.NODE],
  ['bun', TechStack.NODE],
  ['graphql', TechStack.NODE],

  // Python ecosystem
  ['python', TechStack.PYTHON],
  ['fastapi', TechStack.PYTHON],
  ['django', TechStack.PYTHON],

  // Java ecosystem
  ['java', TechStack.JAVA],
  ['springboot', TechStack.JAVA], // slug fragment for 'springboot-mvc-hexagonal' etc.
  ['spring', TechStack.JAVA],
  ['kafka', TechStack.JAVA],

  // Go ecosystem
  ['golang', TechStack.GO],
  ['go-backend', TechStack.GO],
  ['go-microservicios', TechStack.GO],
  ['go-micro', TechStack.GO],

  // PHP ecosystem
  ['php', TechStack.PHP],
  ['laravel', TechStack.PHP],

  // .NET ecosystem
  ['netfullstack', TechStack.DOTNET], // exact slug 'netfullstack' – must come before 'net'
  ['net', TechStack.DOTNET],          // covers 'net-backend', 'net-pruebascompletas', etc.
  ['dotnet', TechStack.DOTNET],
  ['csharp', TechStack.DOTNET],
  ['blazor', TechStack.DOTNET],

  // Flutter / Dart ecosystem
  ['flutter', TechStack.FLUTTER],
  ['dart', TechStack.FLUTTER],
  ['riverpod', TechStack.FLUTTER],
  ['bloc', TechStack.FLUTTER],


  // DevOps
  ['docker', TechStack.DEVOPS_CORE],
  ['kubernetes', TechStack.DEVOPS_CORE],
  ['ci-cd', TechStack.DEVOPS_CORE],
  ['aws', TechStack.DEVOPS_CORE],
  ['devops', TechStack.DEVOPS_CORE],

  // Databases
  ['sql', TechStack.DATABASE_CORE],
  ['postgresql', TechStack.DATABASE_CORE],
  ['postgres', TechStack.DATABASE_CORE],
  ['mongodb', TechStack.DATABASE_CORE],
  ['mysql', TechStack.DATABASE_CORE],
  ['typeorm', TechStack.DATABASE_CORE],
  ['prisma', TechStack.DATABASE_CORE],

  // Cross-cutting (applies to everyone)
  ['typescript', TechStack.CROSS_CUTTING],
  ['javascript', TechStack.CROSS_CUTTING],
  ['git', TechStack.CROSS_CUTTING],
  ['github', TechStack.CROSS_CUTTING],
  ['testing', TechStack.CROSS_CUTTING],
  ['jest', TechStack.CROSS_CUTTING],
  ['vitest', TechStack.CROSS_CUTTING],
  ['tailwind', TechStack.CROSS_CUTTING],
  ['css', TechStack.CROSS_CUTTING],
  ['pwa', TechStack.CROSS_CUTTING],
];
