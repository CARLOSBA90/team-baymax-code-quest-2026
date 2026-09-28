import { describe, expect, it } from 'vitest';
import { SkillCategory } from '../../../generated/prisma/enums.js';
import {
  DeclaredLevel,
  RoadmapGeneratorProvider,
} from '../roadmap.constants.js';
import type { RoadmapGeneratorContext } from './roadmap-generator.interface.js';
import { RulesRoadmapGenerator } from './rules-roadmap-generator.js';
import { RoadmapGeneratorRegistry } from './roadmap-generator.registry.js';

function generator(): RulesRoadmapGenerator {
  return new RulesRoadmapGenerator(new RoadmapGeneratorRegistry());
}

function context(): RoadmapGeneratorContext {
  return {
    targetCategory: SkillCategory.BACKEND,
    goalDescription: 'Build backend APIs',
    declaredLevel: DeclaredLevel.INTERMEDIATE,
    profileScores: {},
    weeklyHours: 5,
    maximumItems: 2,
    candidates: [
      {
        id: 'cuid-advanced',
        slug: 'advanced',
        title: 'Advanced API',
        description: null,
        level: 3,
        durationHours: 4,
        skills: [{ category: SkillCategory.BACKEND, weight: 1 }],
      },
      {
        id: 'cuid-intermediate',
        slug: 'intermediate',
        title: 'Intermediate API',
        description: null,
        level: 2,
        durationHours: 3,
        skills: [{ category: SkillCategory.BACKEND, weight: 1 }],
      },
      {
        id: 'cuid-frontend',
        slug: 'frontend',
        title: 'Frontend',
        description: null,
        level: 1,
        durationHours: 2,
        skills: [{ category: SkillCategory.FRONTEND, weight: 1 }],
      },
    ],
  };
}

describe('RulesRoadmapGenerator', () => {
  it('selects matching courses deterministically and prioritizes the declared level', async () => {
    const rulesGenerator = generator();

    const first = await rulesGenerator.generate(context());
    const second = await rulesGenerator.generate(context());

    expect(first).toEqual(second);
    expect(first.provider).toBe(RoadmapGeneratorProvider.RULES);
    expect(first.items.map(({ courseId }) => courseId)).toEqual([
      'cuid-intermediate',
      'cuid-advanced',
    ]);
  });

  it('returns no items when the catalog does not match the target skill', async () => {
    const rulesGenerator = generator();
    const input = context();
    input.targetCategory = SkillCategory.MOBILE;

    const result = await rulesGenerator.generate(input);

    expect(result.items).toEqual([]);
  });

  // ── Stack coherence tests ────────────────────────────────────────────────

  it('excludes rival frontend stacks when goal specifies Vue', async () => {
    const rulesGenerator = generator();
    const input: RoadmapGeneratorContext = {
      targetCategory: SkillCategory.FRONTEND,
      goalDescription: 'Quiero aprender Vue y crear apps con Nuxt',
      declaredLevel: DeclaredLevel.BEGINNER,
      profileScores: {},
      weeklyHours: 10,
      maximumItems: 10,
      candidates: [
        {
          id: 'cuid-vue',
          slug: 'vue-cero-a-experto',
          title: 'Vue: Cero a Experto',
          description: null,
          level: 1,
          durationHours: 20,
          skills: [{ category: SkillCategory.FRONTEND, weight: 1 }],
        },
        {
          id: 'cuid-nuxt',
          slug: 'nuxt',
          title: 'Nuxt Profesional',
          description: null,
          level: 2,
          durationHours: 15,
          skills: [{ category: SkillCategory.FRONTEND, weight: 1 }],
        },
        {
          id: 'cuid-astro',
          slug: 'astro',
          title: 'Astro',
          description: null,
          level: 1,
          durationHours: 10,
          skills: [{ category: SkillCategory.FRONTEND, weight: 1 }],
        },
        {
          id: 'cuid-react',
          slug: 'react-de-cero',
          title: 'React: De cero',
          description: null,
          level: 1,
          durationHours: 20,
          skills: [{ category: SkillCategory.FRONTEND, weight: 1 }],
        },
        {
          id: 'cuid-angular',
          slug: 'angular',
          title: 'Angular',
          description: null,
          level: 1,
          durationHours: 20,
          skills: [{ category: SkillCategory.FRONTEND, weight: 1 }],
        },
        {
          id: 'cuid-tailwind',
          slug: 'tailwindcss-para-desarrolladores',
          title: 'TailwindCSS',
          description: null,
          level: 1,
          durationHours: 8,
          skills: [{ category: SkillCategory.FRONTEND, weight: 0.7 }],
        },
      ],
    };

    const result = await rulesGenerator.generate(input);
    const ids = result.items.map(({ courseId }) => courseId);

    // Vue and Nuxt must be included; rivals must be excluded
    expect(ids).toContain('cuid-vue');
    expect(ids).toContain('cuid-nuxt');
    expect(ids).not.toContain('cuid-astro');
    expect(ids).not.toContain('cuid-react');
    expect(ids).not.toContain('cuid-angular');
    // Tailwind is CROSS_CUTTING → must be included
    expect(ids).toContain('cuid-tailwind');
  });

  it('excludes rival backend stacks when goal specifies Python', async () => {
    const rulesGenerator = generator();
    const input: RoadmapGeneratorContext = {
      targetCategory: SkillCategory.BACKEND,
      goalDescription: 'Quiero aprender Python con FastAPI y Django',
      declaredLevel: DeclaredLevel.BEGINNER,
      profileScores: {},
      weeklyHours: 10,
      maximumItems: 10,
      candidates: [
        {
          id: 'cuid-python',
          slug: 'python',
          title: 'Python: De Cero a Experto',
          description: null,
          level: 1,
          durationHours: 20,
          skills: [{ category: SkillCategory.BACKEND, weight: 1 }],
        },
        {
          id: 'cuid-fastapi',
          slug: 'fastapi',
          title: 'FastAPI',
          description: null,
          level: 2,
          durationHours: 15,
          skills: [{ category: SkillCategory.BACKEND, weight: 1 }],
        },
        {
          id: 'cuid-django',
          slug: 'django',
          title: 'Django',
          description: null,
          level: 2,
          durationHours: 15,
          skills: [{ category: SkillCategory.BACKEND, weight: 1 }],
        },
        {
          id: 'cuid-java',
          slug: 'java',
          title: 'Java',
          description: null,
          level: 1,
          durationHours: 20,
          skills: [{ category: SkillCategory.BACKEND, weight: 1 }],
        },
        {
          id: 'cuid-golang',
          slug: 'golang-fundamentos-lenguaje',
          title: 'Golang: Fundamentos',
          description: null,
          level: 1,
          durationHours: 20,
          skills: [{ category: SkillCategory.BACKEND, weight: 1 }],
        },
        {
          id: 'cuid-sql',
          slug: 'sql-con-postgres',
          title: 'SQL con PostgreSQL',
          description: null,
          level: 1,
          durationHours: 10,
          skills: [{ category: SkillCategory.BACKEND, weight: 0.7 }],
        },
      ],
    };

    const result = await rulesGenerator.generate(input);
    const ids = result.items.map(({ courseId }) => courseId);

    expect(ids).toContain('cuid-python');
    expect(ids).toContain('cuid-fastapi');
    expect(ids).toContain('cuid-django');
    // SQL is DATABASE_CORE → compatible
    expect(ids).toContain('cuid-sql');
    // Java and Go are rival backend stacks
    expect(ids).not.toContain('cuid-java');
    expect(ids).not.toContain('cuid-golang');
  });

  it('excludes rival mobile stack when goal specifies Flutter', async () => {
    const rulesGenerator = generator();
    const input: RoadmapGeneratorContext = {
      targetCategory: SkillCategory.MOBILE,
      goalDescription: 'Quiero aprender Flutter para crear apps móviles',
      declaredLevel: DeclaredLevel.BEGINNER,
      profileScores: {},
      weeklyHours: 10,
      maximumItems: 10,
      candidates: [
        {
          id: 'cuid-dart',
          slug: 'dart-cero-hasta-detalles',
          title: 'Dart',
          description: null,
          level: 1,
          durationHours: 10,
          skills: [{ category: SkillCategory.MOBILE, weight: 1 }],
        },
        {
          id: 'cuid-flutter',
          slug: 'flutter-movil-cero-a-experto',
          title: 'Flutter: Cero a Experto',
          description: null,
          level: 2,
          durationHours: 25,
          skills: [{ category: SkillCategory.MOBILE, weight: 1 }],
        },
        {
          id: 'cuid-rn',
          slug: 'react-native-expo',
          title: 'React Native con Expo',
          description: null,
          level: 1,
          durationHours: 20,
          skills: [{ category: SkillCategory.MOBILE, weight: 1 }],
        },
      ],
    };

    const result = await rulesGenerator.generate(input);
    const ids = result.items.map(({ courseId }) => courseId);

    expect(ids).toContain('cuid-dart');
    expect(ids).toContain('cuid-flutter');
    expect(ids).not.toContain('cuid-rn');
  });

  it('detects React Native goal before React (regex ordering bug regression)', async () => {
    // 'react native' in goal must NOT resolve to REACT stack.
    // If it did, flutter-movil-cero-a-experto would pass the filter
    // (FLUTTER is not a REACT rival), mixing both mobile stacks.
    const rulesGenerator = generator();
    const input: RoadmapGeneratorContext = {
      targetCategory: SkillCategory.MOBILE,
      goalDescription: 'Quiero aprender React Native con Expo para móviles',
      declaredLevel: DeclaredLevel.BEGINNER,
      profileScores: {},
      weeklyHours: 10,
      maximumItems: 10,
      candidates: [
        {
          id: 'cuid-rn',
          slug: 'react-native-expo',
          title: 'React Native con Expo',
          description: null,
          level: 1,
          durationHours: 20,
          skills: [{ category: SkillCategory.MOBILE, weight: 1 }],
        },
        {
          id: 'cuid-flutter',
          slug: 'flutter-movil-cero-a-experto',
          title: 'Flutter: Cero a Experto',
          description: null,
          level: 2,
          durationHours: 25,
          skills: [{ category: SkillCategory.MOBILE, weight: 1 }],
        },
      ],
    };

    const result = await rulesGenerator.generate(input);
    const ids = result.items.map(({ courseId }) => courseId);

    expect(ids).toContain('cuid-rn');
    expect(ids).not.toContain('cuid-flutter');
  });

  it('ignores cross-domain goal (Vue goal on BACKEND roadmap) and falls back to catalog-based detection', async () => {
    // goalDescription mentions Vue (FRONTEND stack) but targetCategory = BACKEND.
    // The goal should be ignored and catalog-based detection should run instead.
    const rulesGenerator = generator();
    const input: RoadmapGeneratorContext = {
      targetCategory: SkillCategory.BACKEND,
      goalDescription: 'Me gusta Vue pero quiero trabajar en backend',
      declaredLevel: DeclaredLevel.BEGINNER,
      profileScores: {},
      weeklyHours: 10,
      maximumItems: 10,
      candidates: [
        {
          id: 'cuid-python',
          slug: 'python',
          title: 'Python',
          description: null,
          level: 1,
          durationHours: 20,
          skills: [{ category: SkillCategory.BACKEND, weight: 1 }],
        },
        {
          id: 'cuid-java',
          slug: 'java',
          title: 'Java',
          description: null,
          level: 1,
          durationHours: 20,
          skills: [{ category: SkillCategory.BACKEND, weight: 0.9 }],
        },
      ],
    };

    const result = await rulesGenerator.generate(input);
    const ids = result.items.map(({ courseId }) => courseId);

    // Both courses must pass: goal-stack (VUE) is cross-domain, so catalog-based
    // detection wins (PYTHON). JAVA is a PYTHON rival, so it would be excluded.
    // But since goal is ignored and catalog detection returns PYTHON,
    // java IS a rival and is excluded.
    expect(ids).toContain('cuid-python');
    expect(ids).not.toContain('cuid-java');
  });
});
