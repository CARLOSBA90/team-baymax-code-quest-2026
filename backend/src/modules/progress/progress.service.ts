import {
  ConflictException,
  HttpStatus,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  ChallengeSubmissionType,
  Prisma,
} from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { PROGRESS_MAX_PERCENTAGE } from '../roadmaps/roadmap.constants.js';
import {
  aggregateRoadmapProgress,
  truncatePercentage,
} from '../roadmaps/utils/progress-aggregation.util.js';
import type {
  ChallengeSubmissionDto,
  TrackProgressDto,
} from './dto/track-progress.dto.js';
import {
  DUPLICATE_SUBMISSION_WINDOW_MS,
  SubmissionType,
  TrackingType,
} from './progress.constants.js';
import { ChallengeFileStorageService } from './storage/challenge-file-storage.service.js';
import {
  ChallengeFileError,
  type ChallengeUpload,
  validateChallengeFile,
} from './storage/challenge-file.validator.js';
import {
  resolveTrackingPolicy,
  serializeTrackingPolicy,
} from './tracking/tracking-policy.resolver.js';
import {
  contentFingerprint,
  readTrackingState,
  type TrackingState,
} from './tracking/tracking-state.js';
import { calculateVideoProgress } from './tracking/video-progress.tracker.js';
import {
  nextLesson,
  readSyllabus,
  syllabusLessonIds,
} from './tracking/lesson-syllabus.js';

interface StoredChallengeFile {
  storageKey: string;
  checksum: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
}

const REPORT_FIELDS = [
  'lesson_id',
  'completed',
  'position_seconds',
  'submission',
] as const;
/** Accepted field sets per tracking type, each in REPORT_FIELDS order. */
const EXPECTED_FIELDS: Record<
  TrackingType,
  ReadonlyArray<ReadonlyArray<(typeof REPORT_FIELDS)[number]>>
> = {
  [TrackingType.COMPLETION]: [['completed']],
  [TrackingType.READING]: [['completed']],
  // A lesson is marked/unmarked, or its player reports the current second.
  [TrackingType.LESSONS]: [
    ['lesson_id', 'completed'],
    ['lesson_id', 'position_seconds'],
  ],
  [TrackingType.VIDEO]: [['position_seconds']],
  [TrackingType.CHALLENGE]: [['submission']],
};

const conflict = (code: string, message: string) =>
  new ConflictException({ statusCode: 409, error: 'Conflict', code, message });
const invalid = (code: string, message: string) =>
  new UnprocessableEntityException({
    statusCode: 422,
    error: 'Unprocessable Entity',
    code,
    message,
  });

@Injectable()
export class ProgressService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly files: ChallengeFileStorageService,
  ) {}

  private user(userId: string | undefined): string {
    if (!userId) throw new UnauthorizedException();
    return userId;
  }

  private missing(): never {
    throw new NotFoundException({
      statusCode: 404,
      error: 'Not Found',
      code: 'ROADMAP_ITEM_NOT_FOUND',
      message: 'Roadmap item not found.',
    });
  }

  async getForRoadmap(userId: string | undefined, roadmapId: string) {
    const ownerId = this.user(userId);
    const roadmap = await this.prisma.roadmap.findFirst({
      where: { id: roadmapId, userId: ownerId },
      include: {
        items: { include: { progress: true }, orderBy: { order: 'asc' } },
      },
    });
    if (!roadmap)
      throw new NotFoundException({
        statusCode: 404,
        error: 'Not Found',
        code: 'ROADMAP_NOT_FOUND',
        message: 'Roadmap not found.',
      });
    const summary = aggregateRoadmapProgress(
      roadmap.items.map((item) => item.progress?.percentage ?? 0),
      roadmap.pausedAt,
      roadmap.items.some((item) => item.progress?.startedAt),
    );
    return {
      data: {
        roadmap_id: roadmap.id,
        progress: summary.progress,
        status: summary.status,
        last_activity: roadmap.lastActivityAt.toISOString(),
        activity_version: roadmap.activityVersion,
        items: roadmap.items.map((item) => {
          const state = readTrackingState(item.progress?.trackingState);
          return {
            roadmap_item_id: item.id,
            tracking: serializeTrackingPolicy(
              resolveTrackingPolicy(item.type, item.contentData),
            ),
            percentage: item.progress?.percentage ?? 0,
            version: item.progress?.version ?? 0,
            started_at: item.progress?.startedAt?.toISOString() ?? null,
            completed_at: item.progress?.completedAt?.toISOString() ?? null,
            resume:
              typeof state.lastPositionSeconds === 'number'
                ? { position_seconds: state.lastPositionSeconds }
                : null,
            lessons: this.lessonSummary(item.contentData, state),
            updated_at: item.progress?.updatedAt.toISOString() ?? null,
          };
        }),
      },
    };
  }

  /**
   * Single entry point for reporting progress on any roadmap content. The
   * client sends the item and what happened; the backend resolves the item's
   * tracking type, validates the report, deduplicates and computes progress.
   */
  async track(
    userId: string | undefined,
    dto: TrackProgressDto,
    file?: ChallengeUpload,
  ) {
    const ownerId = this.user(userId);
    const roadmapItemId = dto.roadmap_item_id;
    const fileSubmission = dto.submission?.type === SubmissionType.FILE;
    if (fileSubmission && !file)
      throw invalid(
        'SUBMISSION_NOT_ALLOWED',
        'A FILE submission requires an attached file.',
      );
    if (file && !fileSubmission)
      throw invalid(
        'SUBMISSION_NOT_ALLOWED',
        'Files are only accepted with a FILE submission.',
      );
    // Storage cannot join the SQL transaction, so the file is written first
    // and removed again if no submission ends up referencing it.
    const stored = file
      ? await this.storeFile(ownerId, roadmapItemId, file)
      : null;
    let fileKept = false;
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const candidate = await tx.roadmapItem.findFirst({
          where: { id: roadmapItemId, roadmap: { userId: ownerId } },
          select: { roadmapId: true },
        });
        if (!candidate) return this.missing();
        await tx.$queryRaw`SELECT "id" FROM "roadmap" WHERE "id" = ${candidate.roadmapId} FOR UPDATE`;
        const item = await tx.roadmapItem.findUnique({
          where: { id: roadmapItemId },
          include: { progress: true, roadmap: true },
        });
        if (!item?.progress || item.roadmap.userId !== ownerId)
          return this.missing();
        const policy = resolveTrackingPolicy(item.type, item.contentData);
        this.assertReportMatches(policy.type, dto);
        if (item.roadmap.pausedAt)
          throw conflict(
            'ROADMAP_PAUSED',
            'Resume the roadmap before reporting progress.',
          );
        const now = new Date();
        const state = readTrackingState(item.progress.trackingState);
        const nextState: TrackingState = { ...state };
        let percentage = item.progress.percentage;
        let pending = false;
        if (policy.type === TrackingType.VIDEO) {
          if (!policy.enabled || !policy.durationSeconds)
            throw invalid(
              'TRACKING_METADATA_MISSING',
              'A trusted video duration is required.',
            );
          const video = calculateVideoProgress(
            dto.position_seconds!,
            policy.durationSeconds,
            state.maxPositionSeconds ?? 0,
          );
          nextState.lastPositionSeconds = video.lastPositionSeconds;
          nextState.maxPositionSeconds = video.maxPositionSeconds;
          percentage = video.percentage;
        } else if (policy.type === TrackingType.CHALLENGE) {
          const submission = dto.submission!;
          if (!policy.acceptedSubmissionTypes.includes(submission.type))
            throw invalid(
              'SUBMISSION_NOT_ALLOWED',
              'This submission type is not accepted by the challenge.',
            );
          if (
            submission.type === SubmissionType.CODE &&
            !policy.allowedLanguages.includes(
              submission.language?.trim().toLowerCase() ?? '',
            )
          )
            throw invalid(
              'SUBMISSION_NOT_ALLOWED',
              'This programming language is not accepted by the challenge.',
            );
          // A retried request carries the same content: recognise it by its
          // fingerprint instead of asking the client for an idempotency key.
          const fingerprint = contentFingerprint({
            submission,
            file_checksum: stored?.checksum ?? null,
          });
          const duplicate = await tx.challengeSubmission.findFirst({
            where: {
              roadmapItemId,
              payloadHash: fingerprint,
              createdAt: {
                gte: new Date(now.getTime() - DUPLICATE_SUBMISSION_WINDOW_MS),
              },
            },
            select: { id: true },
          });
          if (duplicate)
            return {
              roadmapId: item.roadmapId,
              pending: true,
              fileKept: false,
            };
          await this.createSubmission(
            tx,
            item.id,
            submission,
            fingerprint,
            stored,
          );
          pending = true;
        } else if (policy.type === TrackingType.LESSONS) {
          if (!policy.enabled)
            throw invalid(
              'SYLLABUS_MISSING',
              'This course has no syllabus to track.',
            );
          const lessonId = dto.lesson_id!;
          if (!policy.lessonIds.includes(lessonId))
            throw invalid(
              'LESSON_NOT_IN_ITEM',
              'The lesson does not belong to this course.',
            );
          const done = new Set(state.completedLessons ?? []);
          if (dto.position_seconds !== undefined) {
            // Playback report: remember the second to resume this lesson.
            nextState.lessonPositions = {
              ...state.lessonPositions,
              [lessonId]: dto.position_seconds,
            };
            nextState.lastLessonId = lessonId;
          } else if (dto.completed) {
            done.add(lessonId);
            nextState.lastLessonId = lessonId;
          } else done.delete(lessonId);
          nextState.completedLessons = policy.lessonIds.filter((id) =>
            done.has(id),
          );
          percentage = truncatePercentage(
            (nextState.completedLessons.length * PROGRESS_MAX_PERCENTAGE) /
              policy.lessonIds.length,
          );
        } else {
          if (dto.completed !== true)
            throw invalid(
              'TRACKING_REPORT_MISMATCH',
              `This ${policy.type} item expects "completed": true.`,
            );
          percentage = PROGRESS_MAX_PERCENTAGE;
        }
        // Marking a completed item again, repeating a lesson state or the same
        // position is a no-op: nothing is written and no version changes.
        const changed =
          pending ||
          percentage !== item.progress.percentage ||
          nextState.lastPositionSeconds !== state.lastPositionSeconds ||
          nextState.lastLessonId !== state.lastLessonId ||
          (dto.lesson_id !== undefined &&
            nextState.lessonPositions?.[dto.lesson_id] !==
              state.lessonPositions?.[dto.lesson_id]) ||
          (nextState.completedLessons?.length ?? 0) !==
            (state.completedLessons?.length ?? 0);
        if (!changed)
          return { roadmapId: item.roadmapId, pending, fileKept: false };
        await tx.progress.update({
          where: { roadmapItemId },
          data: {
            percentage,
            trackingState: nextState as unknown as Prisma.InputJsonValue,
            startedAt: item.progress.startedAt ?? now,
            completedAt:
              percentage === PROGRESS_MAX_PERCENTAGE
                ? (item.progress.completedAt ?? now)
                : null,
            version: { increment: 1 },
          },
        });
        const percentages = await tx.progress.findMany({
          where: { roadmapItem: { roadmapId: item.roadmapId } },
          select: { percentage: true },
        });
        const completed =
          percentages.length > 0 &&
          percentages.every((entry) => entry.percentage === 100);
        await tx.roadmap.update({
          where: { id: item.roadmapId },
          data: {
            lastActivityAt: now,
            activityVersion: { increment: 1 },
            ...(completed ? { pausedAt: null } : {}),
          },
        });
        return {
          roadmapId: item.roadmapId,
          pending,
          fileKept: stored !== null,
        };
      });
      fileKept = result.fileKept;
      return {
        statusCode: result.pending ? HttpStatus.ACCEPTED : HttpStatus.OK,
        body: await this.itemResponse(ownerId, result.roadmapId, roadmapItemId),
      };
    } finally {
      if (stored && !fileKept) await this.files.remove(stored.storageKey);
    }
  }

  /** Completed/total lessons for items tracked by syllabus; null otherwise. */
  private lessonSummary(contentData: unknown, state: TrackingState) {
    const syllabus = readSyllabus(contentData);
    const ids = syllabusLessonIds(syllabus);
    if (!syllabus || ids.length === 0) return null;
    const done = new Set(state.completedLessons ?? []);
    return {
      completed: ids.filter((id) => done.has(id)).length,
      total: ids.length,
      last_lesson_id: state.lastLessonId ?? null,
      next_lesson: nextLesson(
        syllabus,
        done,
        state.lastLessonId,
        state.lessonPositions,
      ),
    };
  }

  /** The report must carry exactly the fields that the item's tracking uses. */
  private assertReportMatches(type: TrackingType, dto: TrackProgressDto) {
    const accepted = EXPECTED_FIELDS[type];
    const sent = REPORT_FIELDS.filter((field) => dto[field] !== undefined);
    if (!accepted.some((fields) => fields.join() === sent.join()))
      throw invalid(
        'TRACKING_REPORT_MISMATCH',
        `This ${type} item expects ${accepted
          .map((fields) => fields.map((field) => `"${field}"`).join(' + '))
          .join(' or ')}.`,
      );
  }

  /** Validates ownership, policy and content before writing the file. */
  private async storeFile(
    ownerId: string,
    roadmapItemId: string,
    file: ChallengeUpload,
  ): Promise<StoredChallengeFile> {
    const item = await this.prisma.roadmapItem.findFirst({
      where: { id: roadmapItemId, roadmap: { userId: ownerId } },
      select: { type: true, contentData: true },
    });
    if (!item) return this.missing();
    const policy = resolveTrackingPolicy(item.type, item.contentData);
    if (policy.type !== TrackingType.CHALLENGE)
      throw conflict(
        'TRACKING_TYPE_MISMATCH',
        'Only challenge items accept files.',
      );
    if (!policy.acceptedSubmissionTypes.includes(SubmissionType.FILE))
      throw invalid(
        'SUBMISSION_NOT_ALLOWED',
        'This challenge does not accept file submissions.',
      );
    const fileError = validateChallengeFile(file, policy);
    if (fileError === ChallengeFileError.TOO_LARGE)
      throw new PayloadTooLargeException({
        statusCode: 413,
        error: 'Payload Too Large',
        code: fileError,
        message: 'The file exceeds the size allowed by this challenge.',
      });
    if (fileError)
      throw invalid(fileError, 'The file is not accepted by this challenge.');
    const saved = await this.files.save(file.buffer, file.originalname);
    return {
      ...saved,
      originalFilename: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
    };
  }

  private async createSubmission(
    tx: Prisma.TransactionClient,
    roadmapItemId: string,
    submission: ChallengeSubmissionDto,
    fingerprint: string,
    stored: StoredChallengeFile | null,
  ): Promise<void> {
    await tx.challengeSubmission.create({
      data: {
        roadmapItemId,
        payloadHash: fingerprint,
        submissionType: submission.type as ChallengeSubmissionType,
        content: submission.content,
        language: submission.language,
        url: submission.url,
        ...(stored && {
          storageKey: stored.storageKey,
          originalFilename: stored.originalFilename,
          mimeType: stored.mimeType,
          sizeBytes: stored.sizeBytes,
          checksum: stored.checksum,
        }),
      },
    });
  }

  private async itemResponse(
    userId: string,
    roadmapId: string,
    roadmapItemId: string,
  ) {
    const roadmap = await this.getForRoadmap(userId, roadmapId);
    const item = roadmap.data.items.find(
      (entry) => entry.roadmap_item_id === roadmapItemId,
    );
    const submission = await this.prisma.challengeSubmission.findFirst({
      where: { roadmapItemId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        feedback: true,
        createdAt: true,
        evaluatedAt: true,
      },
    });
    return {
      data: {
        roadmap_item_id: roadmapItemId,
        progress: item?.percentage ?? 0,
        status:
          item?.percentage === 100
            ? 'COMPLETED'
            : item?.started_at
              ? 'IN_PROGRESS'
              : 'NOT_STARTED',
        completed: item?.percentage === 100,
        progress_version: item?.version ?? 0,
        resume: item?.resume ?? null,
        lessons: item?.lessons ?? null,
        submission: submission
          ? {
              id: submission.id,
              status: submission.status,
              feedback: submission.feedback,
              created_at: submission.createdAt.toISOString(),
              evaluated_at: submission.evaluatedAt?.toISOString() ?? null,
            }
          : null,
        roadmap: {
          id: roadmap.data.roadmap_id,
          progress: roadmap.data.progress,
          status: roadmap.data.status,
          last_activity: roadmap.data.last_activity,
          activity_version: roadmap.data.activity_version,
        },
      },
    };
  }
}
