import { aggregateRoadmapProgress } from './progress-aggregation.util.js';
import { RoadmapItemType } from '../../../generated/prisma/enums.js';
import {
  resolveTrackingPolicy,
  serializeTrackingPolicy,
} from '../../progress/tracking/tracking-policy.resolver.js';
import {
  readSyllabus,
  serializeSyllabus,
} from '../../progress/tracking/lesson-syllabus.js';
import { readTrackingState } from '../../progress/tracking/tracking-state.js';
import {
  INITIAL_VERSION,
  EMPTY_COLLECTION_SIZE,
  PROGRESS_MAX_PERCENTAGE,
  PROGRESS_MIN_PERCENTAGE,
  PublicCourseLevel,
  RoadmapGenerationType,
  RoadmapGeneratorProvider,
} from '../roadmap.constants.js';

interface ProgressRecord {
  percentage: number;
  version: number;
  updatedAt: Date;
  trackingState: unknown;
  startedAt: Date | null;
  completedAt: Date | null;
}

interface ItemRecord {
  id: string;
  type: RoadmapItemType;
  courseId: string | null;
  order: number;
  name: string;
  description: string | null;
  image: string | null;
  url: string | null;
  level: number | null;
  estimatedMinutes: unknown;
  reason: string;
  contentData: unknown;
  progress: ProgressRecord | null;
}

export interface RoadmapRecord {
  id: string;
  title: string;
  summary: string;
  generatorVersion: string;
  generationContextSnapshot: unknown;
  pausedAt: Date | null;
  lastActivityAt: Date;
  activityVersion: number;
  createdAt: Date;
  items: ItemRecord[];
}

interface GeneratorSnapshot {
  provider?: unknown;
  fallbackFrom?: unknown;
  attemptedProviders?: unknown;
  attemptedModels?: unknown;
}

function generatorMetadata(roadmap: RoadmapRecord) {
  const context =
    roadmap.generationContextSnapshot &&
    typeof roadmap.generationContextSnapshot === 'object' &&
    !Array.isArray(roadmap.generationContextSnapshot)
      ? (roadmap.generationContextSnapshot as Record<string, unknown>)
      : {};
  const generator =
    context.generator &&
    typeof context.generator === 'object' &&
    !Array.isArray(context.generator)
      ? (context.generator as GeneratorSnapshot)
      : {};
  const provider =
    typeof generator.provider === 'string'
      ? generator.provider
      : roadmap.generatorVersion.startsWith('rules-')
        ? RoadmapGeneratorProvider.RULES
        : null;
  const attemptedProviders = Array.isArray(generator.attemptedProviders)
    ? generator.attemptedProviders.filter(
        (candidate): candidate is string => typeof candidate === 'string',
      )
    : provider
      ? [provider]
      : [];
  const attemptedModels = Array.isArray(generator.attemptedModels)
    ? generator.attemptedModels.filter(
        (candidate): candidate is string => typeof candidate === 'string',
      )
    : [];

  return {
    type:
      provider === RoadmapGeneratorProvider.RULES
        ? RoadmapGenerationType.DETERMINISTIC
        : provider
          ? RoadmapGenerationType.AI
          : RoadmapGenerationType.UNKNOWN,
    provider,
    version: roadmap.generatorVersion,
    fallback_from:
      typeof generator.fallbackFrom === 'string'
        ? generator.fallbackFrom
        : null,
    attempted_providers: attemptedProviders,
    attempted_models: attemptedModels,
  };
}

function levelName(level: number | null): string | null {
  return level === PublicCourseLevel.BEGINNER
    ? 'beginner'
    : level === PublicCourseLevel.INTERMEDIATE
      ? 'intermediate'
      : level === PublicCourseLevel.ADVANCED
        ? 'advanced'
        : null;
}

function decimalNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

/** The syllabus is exposed as `syllabus`; keep it out of the raw details. */
function withoutSyllabus(contentData: unknown): unknown {
  if (
    !contentData ||
    typeof contentData !== 'object' ||
    Array.isArray(contentData)
  )
    return contentData;
  return Object.fromEntries(
    Object.entries(contentData).filter(([key]) => key !== 'syllabus'),
  );
}

export function serializeRoadmapDetail(roadmap: RoadmapRecord) {
  const ordered = [...roadmap.items].sort((a, b) => a.order - b.order);
  const summary = aggregateRoadmapProgress(
    ordered.map((item) => item.progress?.percentage ?? PROGRESS_MIN_PERCENTAGE),
    roadmap.pausedAt,
    ordered.some((item) => item.progress?.startedAt),
  );
  const content = ordered.map((item) => {
    const state = readTrackingState(item.progress?.trackingState);
    const syllabus = readSyllabus(item.contentData);
    return {
      roadmap_item_id: item.id,
      type: item.type,
      order: item.order,
      course_id: item.courseId,
      name: item.name,
      description: item.description,
      image: item.image,
      url: item.url,
      level: levelName(item.level),
      estimated_minutes: decimalNumber(item.estimatedMinutes),
      reason: item.reason,
      details: withoutSyllabus(item.contentData),
      progress: item.progress?.percentage ?? PROGRESS_MIN_PERCENTAGE,
      progress_version: item.progress?.version ?? INITIAL_VERSION,
      tracking: serializeTrackingPolicy(
        resolveTrackingPolicy(item.type, item.contentData),
      ),
      resume:
        typeof state.lastPositionSeconds === 'number'
          ? { position_seconds: state.lastPositionSeconds }
          : null,
      syllabus: syllabus
        ? serializeSyllabus(
            syllabus,
            new Set(state.completedLessons ?? []),
            state.lastLessonId,
            state.lessonPositions,
          )
        : null,
      started_at: item.progress?.startedAt?.toISOString() ?? null,
      completed_at: item.progress?.completedAt?.toISOString() ?? null,
    };
  });

  return {
    id: roadmap.id,
    name: roadmap.title,
    summary: roadmap.summary,
    generator: generatorMetadata(roadmap),
    status: summary.status,
    progress: summary.progress,
    last_activity: roadmap.lastActivityAt.toISOString(),
    paused_at: roadmap.pausedAt?.toISOString() ?? null,
    activity_version: roadmap.activityVersion,
    courses: content
      .filter((item) => item.type === RoadmapItemType.COURSE)
      .map((item) => ({
        id: item.course_id,
        roadmap_item_id: item.roadmap_item_id,
        name: item.name,
        description: item.description,
        image: item.image,
      })),
    content,
    next_step: nextStep(content),
  };
}

/**
 * "Continue here": the first unfinished item in roadmap order and, for a
 * course with a syllabus, the lesson to resume. Null when everything is done.
 */
function nextStep(
  content: ReadonlyArray<{
    roadmap_item_id: string;
    name: string;
    url: string | null;
    progress: number;
    syllabus: { next_lesson: unknown } | null;
  }>,
) {
  const item = content.find(
    (entry) => entry.progress < PROGRESS_MAX_PERCENTAGE,
  );
  return item
    ? {
        roadmap_item_id: item.roadmap_item_id,
        name: item.name,
        url: item.url,
        lesson: item.syllabus?.next_lesson ?? null,
      }
    : null;
}

/** Fields the roadmap list needs: no item content or syllabus. */
export interface RoadmapSummaryRecord {
  id: string;
  title: string;
  pausedAt: Date | null;
  lastActivityAt: Date;
  activityVersion: number;
  items: Array<{
    type: RoadmapItemType;
    level: number | null;
    progress: { percentage: number; startedAt: Date | null } | null;
  }>;
}

export function serializeRoadmapSummary(roadmap: RoadmapSummaryRecord) {
  const summary = aggregateRoadmapProgress(
    roadmap.items.map(
      (item) => item.progress?.percentage ?? PROGRESS_MIN_PERCENTAGE,
    ),
    roadmap.pausedAt,
    roadmap.items.some((item) => item.progress?.startedAt),
  );
  const levels = roadmap.items.map((item) => item.level);
  return {
    id: roadmap.id,
    name: roadmap.title,
    status: summary.status,
    progress: summary.progress,
    last_activity: roadmap.lastActivityAt.toISOString(),
    paused_at: roadmap.pausedAt?.toISOString() ?? null,
    activity_version: roadmap.activityVersion,
    total_items: roadmap.items.length,
    total_courses: roadmap.items.filter(
      (item) => item.type === RoadmapItemType.COURSE,
    ).length,
    level:
      levels.length > EMPTY_COLLECTION_SIZE &&
      levels.every((level) => level !== null)
        ? levelName(Math.max(...(levels as number[])))
        : null,
  };
}
