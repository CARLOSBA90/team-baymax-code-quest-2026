import { Injectable, type OnModuleInit } from '@nestjs/common';
import {
  DeclaredLevel,
  EMPTY_COLLECTION_SIZE,
  FIRST_COLLECTION_INDEX,
  MIN_SKILL_WEIGHT,
  PublicCourseLevel,
  ROADMAP_RULES_VERSION,
  RoadmapGeneratorProvider,
} from '../roadmap.constants.js';
import type {
  GeneratedRoadmapPlan,
  GeneratorCandidate,
  RoadmapGenerator,
  RoadmapGeneratorContext,
} from './roadmap-generator.interface.js';
import { RoadmapGeneratorRegistry } from './roadmap-generator.registry.js';
import {
  areStacksCompatible,
  resolveTechStack,
} from '../../catalog/utils/tech-stack.util.js';
import { TechStack } from '../../catalog/constants/tech-stack.constants.js';

const LEVEL_VALUE: Readonly<Record<DeclaredLevel, PublicCourseLevel>> = {
  [DeclaredLevel.BEGINNER]: PublicCourseLevel.BEGINNER,
  [DeclaredLevel.INTERMEDIATE]: PublicCourseLevel.INTERMEDIATE,
  [DeclaredLevel.ADVANCED]: PublicCourseLevel.ADVANCED,
};

@Injectable()
export class RulesRoadmapGenerator implements RoadmapGenerator, OnModuleInit {
  readonly provider = RoadmapGeneratorProvider.RULES;
  readonly fallbackPriority = Number.MAX_SAFE_INTEGER;

  constructor(private readonly registry: RoadmapGeneratorRegistry) {}

  onModuleInit(): void {
    this.registry.register(this);
  }

  isAvailable(): boolean {
    return true;
  }

  generate(context: RoadmapGeneratorContext): Promise<GeneratedRoadmapPlan> {
    const declaredLevel = context.declaredLevel
      ? LEVEL_VALUE[context.declaredLevel]
      : null;

    // ── Step 1: Filter candidates that belong to the target category ──────────
    const categoryMatching = context.candidates.filter((candidate) =>
      candidate.skills.some(
        (skill) => skill.category === context.targetCategory,
      ),
    );

    // ── Step 2: Detect the primary tech stack ────────────────────────────────
    // The primary stack is the TechStack of the highest-weight candidate among
    // those that exactly match the target category.  If no specific stack can
    // be detected (all resolve to CROSS_CUTTING), we skip stack filtering so
    // the generator falls back to the original behaviour.
    const primaryStack = this.detectPrimaryStack(categoryMatching, context);

    // ── Step 3: Filter by stack compatibility ────────────────────────────────
    const stackFiltered =
      primaryStack === null
        ? categoryMatching
        : categoryMatching.filter((candidate) =>
            areStacksCompatible(primaryStack, resolveTechStack(candidate.slug)),
          );

    // ── Step 4: Sort and select up to maximumItems ───────────────────────────
    const sorted = [...stackFiltered].sort((left, right) => {
      // Cursos que pertenecen directamente al stack primario tienen prioridad sobre los transversales
      const leftPrimary =
        primaryStack !== null && resolveTechStack(left.slug) === primaryStack
          ? 1
          : 0;
      const rightPrimary =
        primaryStack !== null && resolveTechStack(right.slug) === primaryStack
          ? 1
          : 0;
      const primaryDiff = rightPrimary - leftPrimary;
      if (primaryDiff !== 0) return primaryDiff;

      const leftWeight = this.targetWeight(left, context.targetCategory);
      const rightWeight = this.targetWeight(right, context.targetCategory);
      const leftDistance =
        declaredLevel === null
          ? EMPTY_COLLECTION_SIZE
          : Math.abs(left.level - declaredLevel);
      const rightDistance =
        declaredLevel === null
          ? EMPTY_COLLECTION_SIZE
          : Math.abs(right.level - declaredLevel);
      return (
        rightWeight - leftWeight ||
        leftDistance - rightDistance ||
        left.level - right.level ||
        left.id.localeCompare(right.id)
      );
    });

    const AI_ASSISTANT_SLUGS = new Set([
      'claude-code-guia-completa',
      'open-code-guia-completa',
      'codex',
      'vibe-coding',
    ]);

    let hasAiAssistant = false;
    const selected: GeneratorCandidate[] = [];
    for (const candidate of sorted) {
      if (selected.length >= context.maximumItems) break;
      if (AI_ASSISTANT_SLUGS.has(candidate.slug)) {
        if (hasAiAssistant) continue; // Permite como máximo 1 herramienta de asistencia de IA
        hasAiAssistant = true;
      }
      selected.push(candidate);
    }

    return Promise.resolve({
      title: `Ruta de ${context.targetCategory.toLowerCase()}`,
      summary: `Ruta personalizada con ${selected.length} cursos para ${context.targetCategory}.`,
      items: selected.map((candidate) => ({
        courseId: candidate.id,
        reason: `Develops the ${context.targetCategory} skills identified in the assessment.`,
      })),
      provider: this.provider,
      version: ROADMAP_RULES_VERSION,
    });
  }

  /**
   * Detects the primary TechStack for the roadmap.
   *
   * Heuristic (in priority order):
   *  1. If `goalDescription` explicitly names a technology, use that stack —
   *     but only when the detected stack belongs to the same domain as
   *     `targetCategory` (e.g. a Vue goal on a BACKEND roadmap is ignored).
   *  2. Otherwise, pick the TechStack of the candidate with the highest weight
   *     for the target category (excluding CROSS_CUTTING stacks, as they do
   *     not indicate a specific technology preference).
   *  3. Returns null when no concrete stack can be inferred, which disables
   *     stack filtering and preserves the original behaviour.
   */
  private detectPrimaryStack(
    candidates: readonly GeneratorCandidate[],
    context: RoadmapGeneratorContext,
  ): TechStack | null {
    // 1. Goal-based detection: check if the goal description mentions a
    //    well-known technology keyword that maps unambiguously to a stack
    //    AND belongs to the same domain as the target category.
    if (context.goalDescription) {
      const goalStack = this.stackFromGoal(context.goalDescription);
      if (goalStack !== null && this.stackMatchesCategory(goalStack, context.targetCategory)) {
        return goalStack;
      }
    }

    // 2. Catalog-based detection: pick the stack of the top-weight candidate.
    const sorted = [...candidates].sort(
      (a, b) =>
        this.targetWeight(b, context.targetCategory) -
        this.targetWeight(a, context.targetCategory),
    );
    for (const candidate of sorted) {
      const stack = resolveTechStack(candidate.slug);
      if (
        stack !== TechStack.CROSS_CUTTING &&
        stack !== TechStack.DATABASE_CORE &&
        stack !== TechStack.DEVOPS_CORE
      ) {
        return stack;
      }
    }

    return null;
  }

  /**
   * Maps technology keywords found in a free-text goal description to a
   * concrete TechStack.  Returns null when no keyword is recognised.
   *
   * IMPORTANT: more-specific patterns must appear before more-general ones
   * (e.g. React Native / Expo before React) to avoid false matches.
   */
  private stackFromGoal(goal: string): TechStack | null {
    const lower = goal.toLowerCase();

    // Mobile stacks (check before React to avoid 'react native' → REACT)
    if (/\breact[\s-]?native\b/.test(lower) || /\bexpo\b/.test(lower))
      return TechStack.REACT_NATIVE;
    if (/\bflutter\b/.test(lower) || /\bdart\b/.test(lower))
      return TechStack.FLUTTER;

    // Frontend stacks (order matters: check more specific first)
    if (/\bnuxt\b/.test(lower) || /\bvue\b/.test(lower))
      return TechStack.VUE;
    if (/\bnext\.?js\b/.test(lower) || /\breact\b/.test(lower))
      return TechStack.REACT;
    if (/\bangular\b/.test(lower)) return TechStack.ANGULAR;
    if (/\bastro\b/.test(lower)) return TechStack.ASTRO;
    if (/\bqwik\b/.test(lower)) return TechStack.QWIK;

    // Backend stacks
    if (
      /\bnest(js)?\b/.test(lower) ||
      /\bexpress\b/.test(lower) ||
      /\bnode(\.?js)?\b/.test(lower)
    )
      return TechStack.NODE;
    if (
      /\bpython\b/.test(lower) ||
      /\bdjango\b/.test(lower) ||
      /\bfastapi\b/.test(lower)
    )
      return TechStack.PYTHON;
    if (/\bjava\b/.test(lower) || /\bspring\b/.test(lower))
      return TechStack.JAVA;
    if (/\bgolang\b/.test(lower) || /\b(?<![a-z])go(?![a-z])/.test(lower))
      return TechStack.GO;
    if (/\bphp\b/.test(lower) || /\blaravel\b/.test(lower))
      return TechStack.PHP;
    if (/\b\.?net\b/.test(lower) || /\bc#\b/.test(lower))
      return TechStack.DOTNET;

    return null;
  }

  /**
   * Returns true when the given TechStack belongs to the same domain
   * (frontend / backend / mobile) as the target SkillCategory.
   *
   * Cross-cutting stacks (CROSS_CUTTING, DATABASE_CORE, DEVOPS_CORE) do not
   * belong to any specific domain and are treated as incompatible with all
   * categories for the purposes of goal-stack validation.
   */
  private stackMatchesCategory(
    stack: TechStack,
    targetCategory: RoadmapGeneratorContext['targetCategory'],
  ): boolean {
    const FRONTEND_STACKS = new Set([
      TechStack.VUE,
      TechStack.REACT,
      TechStack.ANGULAR,
      TechStack.ASTRO,
      TechStack.QWIK,
    ]);
    const BACKEND_STACKS = new Set([
      TechStack.NODE,
      TechStack.PYTHON,
      TechStack.JAVA,
      TechStack.GO,
      TechStack.PHP,
      TechStack.DOTNET,
    ]);
    const MOBILE_STACKS = new Set([TechStack.FLUTTER, TechStack.REACT_NATIVE]);

    const category = targetCategory as string;
    if (category === 'FRONTEND') return FRONTEND_STACKS.has(stack);
    if (category === 'BACKEND') return BACKEND_STACKS.has(stack);
    if (category === 'MOBILE') return MOBILE_STACKS.has(stack);
    // For other categories (WEB_FUNDAMENTALS, DEVOPS, etc.) skip goal-stack filtering.
    return false;
  }

  private targetWeight(
    candidate: GeneratorCandidate,
    targetCategory: RoadmapGeneratorContext['targetCategory'],
  ): number {
    return (
      candidate.skills.find((skill) => skill.category === targetCategory)
        ?.weight ?? MIN_SKILL_WEIGHT
    );
  }
}
