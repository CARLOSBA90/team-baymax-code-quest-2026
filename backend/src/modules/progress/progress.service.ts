import {
  ConflictException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  ChallengeSubmissionStatus,
  ChallengeSubmissionType,
  Prisma,
} from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { PROGRESS_MAX_PERCENTAGE } from '../roadmaps/roadmap.constants.js';
import { aggregateRoadmapProgress } from '../roadmaps/utils/progress-aggregation.util.js';
import type { TrackProgressDto } from './dto/track-progress.dto.js';
import type { UpdateProgressDto } from './dto/update-progress.dto.js';
import { SubmissionType, TrackingType } from './progress.constants.js';
import { ChallengeFileStorageService } from './storage/challenge-file-storage.service.js';
import { resolveTrackingPolicy } from './tracking/tracking-policy.resolver.js';
import {
  activeReceipts,
  payloadHash,
  readTrackingState,
  type TrackingState,
} from './tracking/tracking-receipts.service.js';
import { calculateVideoProgress } from './tracking/video-progress.tracker.js';

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
            percentage: item.progress?.percentage ?? 0,
            version: item.progress?.version ?? 0,
            started_at: item.progress?.startedAt?.toISOString() ?? null,
            completed_at: item.progress?.completedAt?.toISOString() ?? null,
            resume:
              typeof state.lastPositionSeconds === 'number'
                ? { position_seconds: state.lastPositionSeconds }
                : null,
            updated_at: item.progress?.updatedAt.toISOString() ?? null,
          };
        }),
      },
    };
  }

  async update(
    userId: string | undefined,
    roadmapItemId: string,
    dto: UpdateProgressDto,
  ) {
    const ownerId = this.user(userId);
    const roadmapId = await this.prisma.$transaction(async (tx) => {
      const item = await tx.roadmapItem.findFirst({
        where: { id: roadmapItemId, roadmap: { userId: ownerId } },
        select: { roadmapId: true, type: true, contentData: true },
      });
      if (!item) return this.missing();
      if (
        resolveTrackingPolicy(item.type, item.contentData).type !==
        TrackingType.MANUAL
      )
        throw conflict(
          'TRACKING_TYPE_MISMATCH',
          'This item does not accept manual percentage updates.',
        );
      await tx.$queryRaw`SELECT "id" FROM "roadmap" WHERE "id" = ${item.roadmapId} FOR UPDATE`;
      const roadmap = await tx.roadmap.findUnique({
        where: { id: item.roadmapId },
      });
      const progress = await tx.progress.findUnique({
        where: { roadmapItemId },
      });
      if (!roadmap || !progress) return this.missing();
      if (progress.version !== dto.expectedVersion)
        throw conflict(
          'PROGRESS_VERSION_CONFLICT',
          'The progress version is stale.',
        );
      if (progress.percentage === dto.percentage) return item.roadmapId;
      if (roadmap.pausedAt)
        throw conflict(
          'ROADMAP_PAUSED',
          'Resume the roadmap before changing progress.',
        );
      const now = new Date();
      const changed = await tx.progress.updateMany({
        where: { roadmapItemId, version: dto.expectedVersion },
        data: {
          percentage: dto.percentage,
          version: { increment: 1 },
          startedAt: dto.percentage > 0 ? (progress.startedAt ?? now) : null,
          completedAt: dto.percentage === 100 ? now : null,
        },
      });
      if (changed.count !== 1)
        throw conflict(
          'PROGRESS_VERSION_CONFLICT',
          'The progress version is stale.',
        );
      await tx.roadmap.update({
        where: { id: item.roadmapId },
        data: { lastActivityAt: now, activityVersion: { increment: 1 } },
      });
      return item.roadmapId;
    });
    return this.itemResponse(ownerId, roadmapId, roadmapItemId);
  }

  async uploadFile(
    userId: string | undefined,
    roadmapItemId: string,
    file:
      | { buffer: Buffer; originalname: string; mimetype: string; size: number }
      | undefined,
  ) {
    const ownerId = this.user(userId);
    if (!file) throw invalid('SUBMISSION_NOT_ALLOWED', 'A file is required.');
    const item = await this.prisma.roadmapItem.findFirst({
      where: { id: roadmapItemId, roadmap: { userId: ownerId } },
      select: { type: true, contentData: true },
    });
    if (!item) return this.missing();
    if (
      resolveTrackingPolicy(item.type, item.contentData).type !==
      TrackingType.CHALLENGE
    )
      throw conflict(
        'TRACKING_TYPE_MISMATCH',
        'Only challenge items accept files.',
      );
    const policy = resolveTrackingPolicy(item.type, item.contentData);
    if (
      policy.acceptedSubmissionTypes.length > 0 &&
      !policy.acceptedSubmissionTypes.includes(SubmissionType.FILE)
    )
      throw invalid(
        'SUBMISSION_NOT_ALLOWED',
        'This challenge does not accept file submissions.',
      );
    const stored = await this.files.save(file.buffer, file.originalname);
    const draft = await this.prisma.challengeSubmission.create({
      data: {
        roadmapItemId,
        submissionType: ChallengeSubmissionType.FILE,
        status: ChallengeSubmissionStatus.DRAFT,
        storageKey: stored.storageKey,
        originalFilename: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        checksum: stored.checksum,
      },
    });
    return {
      data: {
        file_id: draft.id,
        status: draft.status,
        original_filename: draft.originalFilename,
        mime_type: draft.mimeType,
        size_bytes: draft.sizeBytes,
      },
    };
  }

  async track(
    userId: string | undefined,
    roadmapItemId: string,
    dto: TrackProgressDto,
  ) {
    const ownerId = this.user(userId);
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
      if (policy.type !== dto.payload.type)
        throw conflict(
          'TRACKING_TYPE_MISMATCH',
          `This item requires ${policy.type} tracking.`,
        );
      if (
        dto.payload.type === TrackingType.CHALLENGE &&
        dto.payload.submission &&
        policy.acceptedSubmissionTypes.length > 0 &&
        !policy.acceptedSubmissionTypes.includes(dto.payload.submission.type)
      )
        throw invalid(
          'SUBMISSION_NOT_ALLOWED',
          'This submission type is not accepted by the challenge.',
        );
      const now = new Date();
      const state = readTrackingState(item.progress.trackingState);
      const receipts = activeReceipts(state.receipts, now);
      const hash = payloadHash(dto.payload);
      const prior = receipts.find(
        (receipt) => receipt.eventId === dto.event_id,
      );
      if (prior) {
        if (prior.payloadHash !== hash)
          throw conflict(
            'EVENT_ID_CONFLICT',
            'The event ID was already used with another payload.',
          );
        return {
          roadmapId: item.roadmapId,
          pending: dto.payload.type === TrackingType.CHALLENGE,
        };
      }
      if (dto.payload.type === TrackingType.CHALLENGE) {
        const existing = await tx.challengeSubmission.findUnique({
          where: {
            roadmapItemId_eventId: {
              roadmapItemId,
              eventId: dto.event_id,
            },
          },
        });
        if (existing) {
          if (existing.payloadHash !== hash)
            throw conflict(
              'EVENT_ID_CONFLICT',
              'The event ID was already used with another payload.',
            );
          return { roadmapId: item.roadmapId, pending: true };
        }
      }
      if (item.roadmap.pausedAt)
        throw conflict(
          'ROADMAP_PAUSED',
          'Resume the roadmap before reporting progress.',
        );
      let percentage = item.progress.percentage;
      const nextState: TrackingState = {
        ...state,
        receipts: [
          ...receipts,
          {
            eventId: dto.event_id,
            payloadHash: hash,
            processedAt: now.toISOString(),
          },
        ],
      };
      let pending = false;
      if (dto.payload.type === TrackingType.VIDEO) {
        if (!policy.durationSeconds)
          throw invalid(
            'TRACKING_METADATA_MISSING',
            'A trusted video duration is required.',
          );
        const video = calculateVideoProgress(
          dto.payload.position_seconds!,
          policy.durationSeconds,
          state.maxPositionSeconds ?? 0,
        );
        nextState.lastPositionSeconds = video.lastPositionSeconds;
        nextState.maxPositionSeconds = video.maxPositionSeconds;
        percentage = video.percentage;
      } else if (
        dto.payload.type === TrackingType.READING ||
        dto.payload.type === TrackingType.MANUAL
      ) {
        percentage = PROGRESS_MAX_PERCENTAGE;
      } else {
        await this.createSubmission(tx, item.id, dto, hash);
        pending = true;
      }
      await tx.progress.update({
        where: { roadmapItemId },
        data: {
          percentage,
          trackingState: nextState as unknown as Prisma.InputJsonValue,
          startedAt: item.progress.startedAt ?? now,
          completedAt: percentage === 100 ? now : null,
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
      return { roadmapId: item.roadmapId, pending };
    });
    return {
      statusCode: result.pending ? HttpStatus.ACCEPTED : HttpStatus.OK,
      body: await this.itemResponse(ownerId, result.roadmapId, roadmapItemId),
    };
  }

  private async createSubmission(
    tx: Prisma.TransactionClient,
    roadmapItemId: string,
    dto: TrackProgressDto,
    hash: string,
  ): Promise<void> {
    const submission = dto.payload.submission;
    if (!submission)
      throw invalid(
        'SUBMISSION_NOT_ALLOWED',
        'A challenge submission is required.',
      );
    if (submission.type === SubmissionType.FILE) {
      const draft = await tx.challengeSubmission.findFirst({
        where: {
          id: submission.file_id,
          roadmapItemId,
          status: ChallengeSubmissionStatus.DRAFT,
        },
      });
      if (!draft)
        throw invalid(
          'SUBMISSION_NOT_ALLOWED',
          'The file draft is invalid or already used.',
        );
      await tx.challengeSubmission.update({
        where: { id: draft.id },
        data: {
          eventId: dto.event_id,
          payloadHash: hash,
          status: ChallengeSubmissionStatus.PENDING_REVIEW,
        },
      });
    } else {
      await tx.challengeSubmission.create({
        data: {
          roadmapItemId,
          eventId: dto.event_id,
          payloadHash: hash,
          submissionType: submission.type as ChallengeSubmissionType,
          content: submission.content,
          language: submission.language,
          url: submission.url,
        },
      });
    }
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
        submission: submission
          ? {
              id: submission.id,
              status: submission.status,
              feedback: submission.feedback,
              created_at: submission.createdAt.toISOString(),
              evaluated_at: submission.evaluatedAt?.toISOString() ?? null,
            }
          : null,
        item: item
          ? {
              roadmap_item_id: item.roadmap_item_id,
              percentage: item.percentage,
              version: item.version,
              updated_at: item.updated_at,
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
