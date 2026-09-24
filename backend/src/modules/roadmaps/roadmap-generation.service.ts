import {
  Injectable,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  CourseStatus,
  PrerequisiteType,
  RoadmapItemType,
  type SkillCategory,
} from '../../generated/prisma/enums.js';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { GenerateRoadmapDto } from './dto/generate-roadmap.dto.js';
import {
  DEFAULT_RESOURCE_BUDGET,
  EMPTY_COLLECTION_SIZE,
  FIRST_ITEM_ORDER,
  HIGH_RESOURCE_BUDGET,
  HOURS_TO_MINUTES,
  INITIAL_VERSION,
  LOW_RESOURCE_BUDGET,
  LOW_WEEKLY_HOURS_LIMIT,
  MEDIUM_WEEKLY_HOURS_LIMIT,
  PROGRESS_MIN_PERCENTAGE,
  ROADMAP_MAX_ITEMS,
  ROADMAP_SNAPSHOT_VERSION,
} from './roadmap.constants.js';
import { RoadmapGeneratorOrchestrator } from './generators/roadmap-generator.orchestrator.js';
import { TrackingType } from '../progress/progress.constants.js';
import { buildSyllabusSnapshot } from '../progress/tracking/lesson-syllabus.js';
import { createCatalogHash } from './utils/catalog-fingerprint.util.js';
import { resolveGoalCategory } from './utils/roadmap-goal.util.js';
import { serializeRoadmapDetail } from './utils/roadmap-detail.mapper.js';
import {
  orderForLearning,
  PrerequisiteResolutionError,
  PrerequisiteResolutionFailure,
} from './utils/roadmap-prerequisites.util.js';

function domainError(
  code: string,
  message: string,
): UnprocessableEntityException {
  return new UnprocessableEntityException({
    statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    error: 'Unprocessable Entity',
    code,
    message,
  });
}

@Injectable()
export class RoadmapGenerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly generator: RoadmapGeneratorOrchestrator,
  ) {}

  async generate(userId: string | undefined, dto: GenerateRoadmapDto) {
    if (!userId) throw new UnauthorizedException();

    const captured = await this.prisma.$transaction(
      async (tx) => {
        const assessment = dto.assessmentId
          ? await tx.assessment.findFirst({
              where: { id: dto.assessmentId, userId },
            })
          : await tx.assessment.findFirst({
              where: { userId, completedAt: { not: null } },
              orderBy: [
                { completedAt: 'desc' },
                { createdAt: 'desc' },
                { id: 'desc' },
              ],
            });

        if (!assessment) {
          throw new NotFoundException({
            statusCode: HttpStatus.NOT_FOUND,
            error: 'Not Found',
            code: 'ASSESSMENT_NOT_FOUND',
            message: 'No completed assessment was found for this user.',
          });
        }
        if (!assessment.completedAt) {
          throw domainError(
            'ASSESSMENT_REQUIRED',
            'The selected assessment is not complete.',
          );
        }

        const courses = await tx.course.findMany({
          where: { status: CourseStatus.ACTIVE },
          include: { skills: true, prerequisites: true },
          orderBy: { id: 'asc' },
        });
        return { assessment, courses };
      },
      { isolationLevel: 'RepeatableRead' },
    );

    if (captured.courses.length === EMPTY_COLLECTION_SIZE) {
      throw domainError('CATALOG_EMPTY', 'There are no active courses.');
    }

    const targetCategory = dto.goal
      ? resolveGoalCategory(dto.goal.description)
      : captured.assessment.goalCategory;
    if (!targetCategory) {
      throw domainError(
        dto.goal ? 'GOAL_UNSUPPORTED' : 'GOAL_REQUIRED',
        dto.goal
          ? 'The goal does not map to one supported skill category.'
          : 'A goal is required to generate the roadmap.',
      );
    }

    const budget =
      dto.weeklyHours === undefined
        ? DEFAULT_RESOURCE_BUDGET
        : dto.weeklyHours < LOW_WEEKLY_HOURS_LIMIT
          ? LOW_RESOURCE_BUDGET
          : dto.weeklyHours <= MEDIUM_WEEKLY_HOURS_LIMIT
            ? DEFAULT_RESOURCE_BUDGET
            : HIGH_RESOURCE_BUDGET;
    const canonicalCatalog = captured.courses.map((course) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      url: course.url,
      image: course.imageUrl,
      level: course.level,
      durationHours: course.durationHours,
      skills: [...course.skills]
        .map((skill) => ({ category: skill.skill, weight: skill.weight }))
        .sort((a, b) => a.category.localeCompare(b.category)),
      prerequisites: [...course.prerequisites]
        .map((relation) => ({
          courseId: relation.prerequisiteCourseId,
          type: relation.type,
        }))
        .sort((a, b) => a.courseId.localeCompare(b.courseId)),
    }));
    const generatorCandidates = canonicalCatalog
      .filter((course) =>
        course.skills.some((skill) => skill.category === targetCategory),
      )
      .map((course) => ({
        id: course.id,
        title: course.title,
        description: course.description,
        level: course.level,
        durationHours: course.durationHours,
        skills: course.skills,
      }));
    if (generatorCandidates.length === EMPTY_COLLECTION_SIZE) {
      throw domainError(
        'NO_MATCHING_COURSES',
        'No active courses match the roadmap goal.',
      );
    }

    const generatedPlan = await this.generator.generate(
      {
        targetCategory,
        goalDescription: dto.goal?.description ?? null,
        declaredLevel: dto.declaredLevel ?? null,
        profileScores: this.readProfileScores(
          captured.assessment.profileScores,
        ),
        weeklyHours: dto.weeklyHours ?? null,
        maximumItems: budget,
        candidates: generatorCandidates,
      },
      dto.generationMode,
    );

    if (generatedPlan.items.length === EMPTY_COLLECTION_SIZE) {
      throw domainError(
        'NO_MATCHING_COURSES',
        'No active courses match the roadmap goal.',
      );
    }

    const coursesById = new Map(
      captured.courses.map((course) => [course.id, course]),
    );
    const selectedCourses = generatedPlan.items.map((item) => {
      const course = coursesById.get(item.courseId);
      if (!course) {
        throw domainError(
          'NO_MATCHING_COURSES',
          'The generator selected a course outside the captured catalog.',
        );
      }
      return course;
    });
    const generatedReasons = new Map(
      generatedPlan.items.map((item) => [item.courseId, item.reason]),
    );

    let ordered: typeof selectedCourses;
    try {
      ordered = orderForLearning(
        selectedCourses,
        captured.courses,
        (course) =>
          course.prerequisites
            .filter((relation) => relation.type === PrerequisiteType.REQUIRED)
            .map((relation) => relation.prerequisiteCourseId),
        ROADMAP_MAX_ITEMS,
      );
    } catch (error) {
      if (!(error instanceof PrerequisiteResolutionError)) throw error;
      const messageByFailure: Record<PrerequisiteResolutionFailure, string> = {
        [PrerequisiteResolutionFailure.CYCLE]:
          'A required prerequisite cycle was detected.',
        [PrerequisiteResolutionFailure.LIMIT_EXCEEDED]: `The roadmap exceeds the maximum of ${ROADMAP_MAX_ITEMS} items.`,
        [PrerequisiteResolutionFailure.MISSING_REQUIRED_COURSE]:
          'An active required prerequisite is missing.',
      };
      throw domainError('NO_MATCHING_COURSES', messageByFailure[error.failure]);
    }

    // Each course copies its syllabus so progress can be tracked per lesson.
    const lessons = await this.prisma.courseLesson.findMany({
      where: { courseId: { in: ordered.map((course) => course.id) } },
      orderBy: [{ courseId: 'asc' }, { order: 'asc' }],
    });
    const syllabusByCourse = new Map(
      ordered.map((course) => [
        course.id,
        buildSyllabusSnapshot(
          lessons.filter((lesson) => lesson.courseId === course.id),
        ),
      ]),
    );

    const catalogHash = createCatalogHash(canonicalCatalog);
    const now = new Date();
    const title = dto.title?.trim() || generatedPlan.title;
    const summary = generatedPlan.summary;

    const roadmap = await this.prisma.roadmap.create({
      data: {
        userId,
        assessmentId: captured.assessment.id,
        title,
        summary,
        goal: dto.goal
          ? { type: dto.goal.type, description: dto.goal.description }
          : undefined,
        weeklyHours: dto.weeklyHours,
        generatorVersion: generatedPlan.version,
        catalogHash,
        generationContextSnapshot: {
          schemaVersion: ROADMAP_SNAPSHOT_VERSION,
          assessment: {
            id: captured.assessment.id,
            version: captured.assessment.version,
            goalCategory: captured.assessment.goalCategory,
            profileScores: captured.assessment.profileScores,
          },
          targetCategory,
          declaredLevel: dto.declaredLevel ?? null,
          generator: {
            provider: generatedPlan.provider,
            version: generatedPlan.version,
            fallbackFrom: generatedPlan.fallbackFrom ?? null,
            attemptedProviders: generatedPlan.attemptedProviders ?? [
              generatedPlan.provider,
            ],
            attemptedModels: generatedPlan.attemptedModels ?? [],
          },
          catalogHash,
          candidates: canonicalCatalog,
        },
        lastActivityAt: now,
        items: {
          create: ordered.map((course, index) => ({
            type: RoadmapItemType.COURSE,
            courseId: course.id,
            sourceKey: `course:${course.id}`,
            order: index + FIRST_ITEM_ORDER,
            name: course.title,
            description: course.description,
            image: course.imageUrl,
            url: course.url,
            level: course.level,
            estimatedMinutes:
              course.durationHours === null
                ? undefined
                : course.durationHours * HOURS_TO_MINUTES,
            reason:
              generatedReasons.get(course.id) ??
              `Builds the required foundation for ${targetCategory}.`,
            targetSkills: course.skills.map(
              (skill) => skill.skill,
            ) as SkillCategory[],
            contentData: {
              schemaVersion: ROADMAP_SNAPSHOT_VERSION,
              durationHours: course.durationHours,
              skills: course.skills.map((skill) => ({
                category: skill.skill,
                weight: skill.weight,
              })),
              ...(syllabusByCourse.get(course.id)?.sections.length && {
                tracking: { type: TrackingType.LESSONS },
                syllabus: syllabusByCourse.get(
                  course.id,
                ) as unknown as Prisma.InputJsonObject,
              }),
            },
            progress: {
              create: {
                percentage: PROGRESS_MIN_PERCENTAGE,
                version: INITIAL_VERSION,
              },
            },
          })),
        },
      },
      include: { items: { include: { progress: true } } },
    });

    return { data: serializeRoadmapDetail(roadmap) };
  }

  private readProfileScores(value: unknown): Record<string, number> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value).filter(
        (entry): entry is [string, number] =>
          typeof entry[1] === 'number' && Number.isFinite(entry[1]),
      ),
    );
  }
}
