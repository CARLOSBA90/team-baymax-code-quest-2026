import { aggregateRoadmapProgress } from './progress-aggregation.util.js';
import { RoadmapItemType } from '../../../generated/prisma/enums.js';
import {
  INITIAL_VERSION,
  EMPTY_COLLECTION_SIZE,
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

export function serializeRoadmapDetail(roadmap: RoadmapRecord) {
  const ordered = [...roadmap.items].sort((a, b) => a.order - b.order);
  const summary = aggregateRoadmapProgress(
    ordered.map((item) => item.progress?.percentage ?? PROGRESS_MIN_PERCENTAGE),
    roadmap.pausedAt,
  );
  const content = ordered.map((item) => {
    const state =
      item.progress?.trackingState &&
      typeof item.progress.trackingState === 'object' &&
      !Array.isArray(item.progress.trackingState)
        ? (item.progress.trackingState as Record<string, unknown>)
        : {};
    const data =
      item.contentData &&
      typeof item.contentData === 'object' &&
      !Array.isArray(item.contentData)
        ? (item.contentData as Record<string, unknown>)
        : {};
    const configuredTracking =
      data.tracking &&
      typeof data.tracking === 'object' &&
      !Array.isArray(data.tracking)
        ? (data.tracking as Record<string, unknown>)
        : {};
    const trackingType =
      typeof configuredTracking.type === 'string'
        ? configuredTracking.type
        : item.type === RoadmapItemType.CHALLENGE
          ? 'CHALLENGE'
          : 'MANUAL';
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
      details: item.contentData,
      progress: item.progress?.percentage ?? PROGRESS_MIN_PERCENTAGE,
      progress_version: item.progress?.version ?? INITIAL_VERSION,
      tracking: {
        type: trackingType,
        report_interval_seconds: trackingType === 'VIDEO' ? 15 : null,
      },
      resume:
        typeof state.lastPositionSeconds === 'number'
          ? { position_seconds: state.lastPositionSeconds }
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
  };
}

export function serializeRoadmapSummary(roadmap: RoadmapRecord) {
  const detail = serializeRoadmapDetail(roadmap);
  const levels = roadmap.items.map((item) => item.level);
  return {
    id: detail.id,
    name: detail.name,
    status: detail.status,
    progress: detail.progress,
    last_activity: detail.last_activity,
    paused_at: detail.paused_at,
    activity_version: detail.activity_version,
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
