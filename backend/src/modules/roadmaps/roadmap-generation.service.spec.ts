/**
 * Integration tests for coherent roadmap generation.
 *
 * These tests exercise the full pipeline that runs during roadmap generation:
 *   RulesRoadmapGenerator (stack filtering) → orderForLearning (pedagogical ordering)
 *
 * They do NOT hit the database or the NVIDIA API; all external dependencies
 * are replaced with in-memory stubs that mimic the catalog shapes returned by
 * the generation service.
 */
import { describe, expect, it } from 'vitest';
import { SkillCategory } from '../../generated/prisma/enums.js';
import { DeclaredLevel, RoadmapGeneratorProvider } from './roadmap.constants.js';
import { PrerequisiteResolutionFailure } from './utils/roadmap-prerequisites.util.js';
import { RulesRoadmapGenerator } from './generators/rules-roadmap-generator.js';
import { RoadmapGeneratorRegistry } from './generators/roadmap-generator.registry.js';
import { orderForLearning } from './utils/roadmap-prerequisites.util.js';
import type { RoadmapGeneratorContext } from './generators/roadmap-generator.interface.js';

// ── Helpers ─────────────────────────────────────────────────────────────────

function rulesGenerator(): RulesRoadmapGenerator {
  return new RulesRoadmapGenerator(new RoadmapGeneratorRegistry());
}

function candidate(
  id: string,
  level: number,
  category: SkillCategory,
  weight = 1,
  prerequisites: string[] = [],
) {
  return {
    id,
    title: id,
    description: null,
    level,
    durationHours: 10,
    skills: [{ category, weight }],
    prerequisites,
  };
}

/** Simulates the full pipeline: generate → orderForLearning. */
async function generateAndOrder(
  context: RoadmapGeneratorContext,
  allCandidatesWithPrereqs: Array<
    ReturnType<typeof candidate>
  >,
): Promise<string[]> {
  const gen = rulesGenerator();
  const plan = await gen.generate(context);

  const selectedIds = new Set(plan.items.map((i) => i.courseId));
  const selected = allCandidatesWithPrereqs.filter((c) =>
    selectedIds.has(c.id),
  );

  const ordered = orderForLearning(
    selected,
    allCandidatesWithPrereqs,
    (c) => c.prerequisites,
    50,
  );

  return ordered.map((c) => c.id);
}

// ── Test cases ───────────────────────────────────────────────────────────────

describe('Roadmap generation integration', () => {
  describe('Frontend Vue roadmap', () => {
    const catalog = [
      candidate('tailwindcss-para-desarrolladores', 1, SkillCategory.FRONTEND, 0.8),
      candidate('vue-cero-a-experto', 1, SkillCategory.FRONTEND),
      candidate('vue-intermedio', 2, SkillCategory.FRONTEND, 1, ['vue-cero-a-experto']),
      candidate('nuxt', 2, SkillCategory.FRONTEND, 1, ['vue-cero-a-experto']),
      // Rival stacks – must be excluded
      candidate('astro', 1, SkillCategory.FRONTEND),
      candidate('react-de-cero', 1, SkillCategory.FRONTEND),
      candidate('angular', 1, SkillCategory.FRONTEND),
    ];

    const context: RoadmapGeneratorContext = {
      targetCategory: SkillCategory.FRONTEND,
      goalDescription: 'Quiero aprender Vue y crear apps con Nuxt',
      declaredLevel: DeclaredLevel.BEGINNER,
      profileScores: {},
      weeklyHours: 10,
      maximumItems: 6,
      candidates: catalog,
    };

    it('does not include rival stacks (Astro, React, Angular)', async () => {
      const ordered = await generateAndOrder(context, catalog);
      expect(ordered).not.toContain('astro');
      expect(ordered).not.toContain('react-de-cero');
      expect(ordered).not.toContain('angular');
    });

    it('includes Vue fundamentals and Nuxt', async () => {
      const ordered = await generateAndOrder(context, catalog);
      expect(ordered).toContain('vue-cero-a-experto');
      expect(ordered).toContain('nuxt');
    });

    it('includes cross-cutting TailwindCSS', async () => {
      const ordered = await generateAndOrder(context, catalog);
      expect(ordered).toContain('tailwindcss-para-desarrolladores');
    });

    it('places vue-cero-a-experto before nuxt (pedagogical order)', async () => {
      const ordered = await generateAndOrder(context, catalog);
      const vueIdx = ordered.indexOf('vue-cero-a-experto');
      const nuxtIdx = ordered.indexOf('nuxt');
      expect(vueIdx).toBeGreaterThanOrEqual(0);
      expect(nuxtIdx).toBeGreaterThanOrEqual(0);
      expect(vueIdx).toBeLessThan(nuxtIdx);
    });

    it('uses RULES provider', async () => {
      const gen = rulesGenerator();
      const plan = await gen.generate(context);
      expect(plan.provider).toBe(RoadmapGeneratorProvider.RULES);
    });
  });

  describe('Backend Python roadmap', () => {
    const catalog = [
      candidate('python', 1, SkillCategory.BACKEND),
      candidate('fastapi', 2, SkillCategory.BACKEND, 1, ['python']),
      candidate('django', 2, SkillCategory.BACKEND, 1, ['python']),
      candidate('sql-con-postgres', 1, SkillCategory.BACKEND, 0.8),
      // Rival backend stacks – must be excluded
      candidate('java', 1, SkillCategory.BACKEND),
      candidate('golang-fundamentos-lenguaje', 1, SkillCategory.BACKEND),
      candidate('php-moderno', 1, SkillCategory.BACKEND),
    ];

    const context: RoadmapGeneratorContext = {
      targetCategory: SkillCategory.BACKEND,
      goalDescription: 'Aprender Python, FastAPI y Django para backend',
      declaredLevel: DeclaredLevel.BEGINNER,
      profileScores: {},
      weeklyHours: 10,
      maximumItems: 6,
      candidates: catalog,
    };

    it('does not include rival backend stacks (Java, Go, PHP)', async () => {
      const ordered = await generateAndOrder(context, catalog);
      expect(ordered).not.toContain('java');
      expect(ordered).not.toContain('golang-fundamentos-lenguaje');
      expect(ordered).not.toContain('php-moderno');
    });

    it('includes Python, FastAPI and Django', async () => {
      const ordered = await generateAndOrder(context, catalog);
      expect(ordered).toContain('python');
      expect(ordered).toContain('fastapi');
      expect(ordered).toContain('django');
    });

    it('includes SQL as a cross-cutting DATABASE_CORE tool', async () => {
      const ordered = await generateAndOrder(context, catalog);
      expect(ordered).toContain('sql-con-postgres');
    });

    it('places python before fastapi and django (pedagogical order)', async () => {
      const ordered = await generateAndOrder(context, catalog);
      const pythonIdx = ordered.indexOf('python');
      const fastapiIdx = ordered.indexOf('fastapi');
      const djangoIdx = ordered.indexOf('django');
      expect(pythonIdx).toBeGreaterThanOrEqual(0);
      if (fastapiIdx >= 0) expect(pythonIdx).toBeLessThan(fastapiIdx);
      if (djangoIdx >= 0) expect(pythonIdx).toBeLessThan(djangoIdx);
    });
  });

  describe('Mobile Flutter roadmap', () => {
    const catalog = [
      candidate('dart-cero-hasta-detalles', 1, SkillCategory.MOBILE),
      candidate('flutter-movil-cero-a-experto', 2, SkillCategory.MOBILE, 1, [
        'dart-cero-hasta-detalles',
      ]),
      candidate('flutter-bloc', 3, SkillCategory.MOBILE, 1, [
        'flutter-movil-cero-a-experto',
      ]),
      candidate('riverpod-con-anotaciones', 3, SkillCategory.MOBILE, 1, [
        'flutter-movil-cero-a-experto',
      ]),
      // Rival mobile stack – must be excluded
      candidate('react-native-expo', 1, SkillCategory.MOBILE),
    ];

    const context: RoadmapGeneratorContext = {
      targetCategory: SkillCategory.MOBILE,
      goalDescription: 'Aprender Flutter y Dart para crear apps móviles',
      declaredLevel: DeclaredLevel.BEGINNER,
      profileScores: {},
      weeklyHours: 10,
      maximumItems: 6,
      candidates: catalog,
    };

    it('does not include React Native (rival mobile stack)', async () => {
      const ordered = await generateAndOrder(context, catalog);
      expect(ordered).not.toContain('react-native-expo');
    });

    it('includes Dart, Flutter and its advanced modules', async () => {
      const ordered = await generateAndOrder(context, catalog);
      expect(ordered).toContain('dart-cero-hasta-detalles');
      expect(ordered).toContain('flutter-movil-cero-a-experto');
    });

    it('places dart before flutter (prerequisite order)', async () => {
      const ordered = await generateAndOrder(context, catalog);
      const dartIdx = ordered.indexOf('dart-cero-hasta-detalles');
      const flutterIdx = ordered.indexOf('flutter-movil-cero-a-experto');
      expect(dartIdx).toBeGreaterThanOrEqual(0);
      expect(flutterIdx).toBeGreaterThanOrEqual(0);
      expect(dartIdx).toBeLessThan(flutterIdx);
    });
  });

  describe('Prerequisite resolution edge cases', () => {
    it('does not throw MISSING_REQUIRED_COURSE when a prerequisite is outside the selected courses', () => {
      // The service only includes selected courses in the `ordered` array;
      // if a prerequisite is not selected, orderForLearning should just include it.
      const vue = candidate('vue-cero-a-experto', 1, SkillCategory.FRONTEND);
      const nuxt = candidate('nuxt', 2, SkillCategory.FRONTEND, 1, ['vue-cero-a-experto']);

      expect(() =>
        orderForLearning(
          [nuxt],
          [nuxt, vue], // vue is in candidates so the prerequisite can be resolved
          (c) => c.prerequisites,
          50,
        ),
      ).not.toThrow();
    });

    it('throws MISSING_REQUIRED_COURSE when a prerequisite is not in the candidates pool', () => {
      const nuxt = candidate('nuxt', 2, SkillCategory.FRONTEND, 1, ['vue-cero-a-experto']);

      expect(() =>
        orderForLearning(
          [nuxt],
          [nuxt], // vue is missing from candidates
          (c) => c.prerequisites,
          50,
        ),
      ).toThrowError(
        expect.objectContaining({
          failure: PrerequisiteResolutionFailure.MISSING_REQUIRED_COURSE,
        }),
      );
    });
  });
});
