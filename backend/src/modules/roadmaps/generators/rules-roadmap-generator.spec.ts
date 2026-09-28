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
        id: 'advanced',
        title: 'Advanced API',
        description: null,
        level: 3,
        durationHours: 4,
        skills: [{ category: SkillCategory.BACKEND, weight: 1 }],
      },
      {
        id: 'intermediate',
        title: 'Intermediate API',
        description: null,
        level: 2,
        durationHours: 3,
        skills: [{ category: SkillCategory.BACKEND, weight: 1 }],
      },
      {
        id: 'frontend',
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
      'intermediate',
      'advanced',
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
          id: 'vue-cero-a-experto',
          title: 'Vue: Cero a Experto',
          description: null,
          level: 1,
          durationHours: 20,
          skills: [{ category: SkillCategory.FRONTEND, weight: 1 }],
        },
        {
          id: 'nuxt',
          title: 'Nuxt Profesional',
          description: null,
          level: 2,
          durationHours: 15,
          skills: [{ category: SkillCategory.FRONTEND, weight: 1 }],
        },
        {
          id: 'astro',
          title: 'Astro',
          description: null,
          level: 1,
          durationHours: 10,
          skills: [{ category: SkillCategory.FRONTEND, weight: 1 }],
        },
        {
          id: 'react-de-cero',
          title: 'React: De cero',
          description: null,
          level: 1,
          durationHours: 20,
          skills: [{ category: SkillCategory.FRONTEND, weight: 1 }],
        },
        {
          id: 'angular',
          title: 'Angular',
          description: null,
          level: 1,
          durationHours: 20,
          skills: [{ category: SkillCategory.FRONTEND, weight: 1 }],
        },
        {
          id: 'tailwindcss-para-desarrolladores',
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
    expect(ids).toContain('vue-cero-a-experto');
    expect(ids).toContain('nuxt');
    expect(ids).not.toContain('astro');
    expect(ids).not.toContain('react-de-cero');
    expect(ids).not.toContain('angular');
    // Tailwind is CROSS_CUTTING → must be included
    expect(ids).toContain('tailwindcss-para-desarrolladores');
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
          id: 'python',
          title: 'Python: De Cero a Experto',
          description: null,
          level: 1,
          durationHours: 20,
          skills: [{ category: SkillCategory.BACKEND, weight: 1 }],
        },
        {
          id: 'fastapi',
          title: 'FastAPI',
          description: null,
          level: 2,
          durationHours: 15,
          skills: [{ category: SkillCategory.BACKEND, weight: 1 }],
        },
        {
          id: 'django',
          title: 'Django',
          description: null,
          level: 2,
          durationHours: 15,
          skills: [{ category: SkillCategory.BACKEND, weight: 1 }],
        },
        {
          id: 'java',
          title: 'Java',
          description: null,
          level: 1,
          durationHours: 20,
          skills: [{ category: SkillCategory.BACKEND, weight: 1 }],
        },
        {
          id: 'golang-fundamentos-lenguaje',
          title: 'Golang: Fundamentos',
          description: null,
          level: 1,
          durationHours: 20,
          skills: [{ category: SkillCategory.BACKEND, weight: 1 }],
        },
        {
          id: 'sql-con-postgres',
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

    expect(ids).toContain('python');
    expect(ids).toContain('fastapi');
    expect(ids).toContain('django');
    // SQL is DATABASE_CORE → compatible
    expect(ids).toContain('sql-con-postgres');
    // Java and Go are rival backend stacks
    expect(ids).not.toContain('java');
    expect(ids).not.toContain('golang-fundamentos-lenguaje');
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
          id: 'dart-cero-hasta-detalles',
          title: 'Dart',
          description: null,
          level: 1,
          durationHours: 10,
          skills: [{ category: SkillCategory.MOBILE, weight: 1 }],
        },
        {
          id: 'flutter-movil-cero-a-experto',
          title: 'Flutter: Cero a Experto',
          description: null,
          level: 2,
          durationHours: 25,
          skills: [{ category: SkillCategory.MOBILE, weight: 1 }],
        },
        {
          id: 'react-native-expo',
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

    expect(ids).toContain('dart-cero-hasta-detalles');
    expect(ids).toContain('flutter-movil-cero-a-experto');
    expect(ids).not.toContain('react-native-expo');
  });
});
