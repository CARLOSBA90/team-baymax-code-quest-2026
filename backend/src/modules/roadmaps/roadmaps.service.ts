import {
  ConflictException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ChallengeFileStorageService } from '../progress/storage/challenge-file-storage.service.js';
import type { FindRoadmapsQueryDto } from './dto/find-roadmaps-query.dto.js';
import type { PauseRoadmapDto } from './dto/pause-roadmap.dto.js';
import {
  DEFAULT_PAGE,
  EMPTY_COLLECTION_SIZE,
  RoadmapStatus,
  VERSION_INCREMENT,
} from './roadmap.constants.js';
import {
  serializeRoadmapDetail,
  serializeRoadmapSummary,
} from './utils/roadmap-detail.mapper.js';
import { roadmapStatusRows } from './utils/roadmap-status.query.js';

const summarySelect = {
  id: true,
  title: true,
  pausedAt: true,
  lastActivityAt: true,
  activityVersion: true,
  items: {
    select: {
      type: true,
      level: true,
      progress: { select: { percentage: true, startedAt: true } },
    },
  },
} as const;

const includeItems = {
  items: { include: { progress: true }, orderBy: { order: 'asc' as const } },
};

function conflict(code: string, message: string): ConflictException {
  return new ConflictException({
    statusCode: HttpStatus.CONFLICT,
    error: 'Conflict',
    code,
    message,
  });
}

@Injectable()
export class RoadmapsService {
  private readonly logger = new Logger(RoadmapsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly files: ChallengeFileStorageService,
  ) {}

  private requireUser(userId: string | undefined): string {
    if (!userId) throw new UnauthorizedException();
    return userId;
  }

  /**
   * Status is derived from item progress, so it is computed in SQL: counts and
   * the requested page are resolved by the database, and only that page is
   * loaded, without item content or syllabus.
   */
  async findAll(userId: string | undefined, query: FindRoadmapsQueryDto) {
    const ownerId = this.requireUser(userId);
    const rows = roadmapStatusRows(ownerId);
    const grouped = await this.prisma.$queryRaw<
      Array<{ status: RoadmapStatus; total: number }>
    >`SELECT s."status", COUNT(*)::int AS "total" FROM (${rows}) s GROUP BY s."status"`;
    const countOf = (status: RoadmapStatus) =>
      grouped.find((row) => row.status === status)?.total ??
      EMPTY_COLLECTION_SIZE;
    const counts = {
      all: grouped.reduce((sum, row) => sum + row.total, EMPTY_COLLECTION_SIZE),
      notStarted: countOf(RoadmapStatus.NOT_STARTED),
      inProgress: countOf(RoadmapStatus.IN_PROGRESS),
      paused: countOf(RoadmapStatus.PAUSED),
      completed: countOf(RoadmapStatus.COMPLETED),
    };
    const total = query.status ? countOf(query.status) : counts.all;

    const page = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT s."id" FROM (${rows}) s
      ${query.status ? Prisma.sql`WHERE s."status" = ${query.status}` : Prisma.empty}
      ORDER BY s."createdAt" DESC, s."id" DESC
      LIMIT ${query.limit} OFFSET ${(query.page - DEFAULT_PAGE) * query.limit}`;
    const ids = page.map((row) => row.id);
    const roadmaps =
      ids.length === EMPTY_COLLECTION_SIZE
        ? []
        : await this.prisma.roadmap.findMany({
            where: { id: { in: ids } },
            select: summarySelect,
          });
    const byId = new Map(roadmaps.map((roadmap) => [roadmap.id, roadmap]));

    return {
      data: ids
        .map((id) => byId.get(id))
        .filter((roadmap) => roadmap !== undefined)
        .map(serializeRoadmapSummary),
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages:
          total === EMPTY_COLLECTION_SIZE
            ? EMPTY_COLLECTION_SIZE
            : Math.ceil(total / query.limit),
      },
      counts,
    };
  }

  async findOne(userId: string | undefined, id: string) {
    const ownerId = this.requireUser(userId);
    const roadmap = await this.prisma.roadmap.findFirst({
      where: { id, userId: ownerId },
      include: includeItems,
    });
    if (!roadmap) {
      throw new NotFoundException({
        statusCode: HttpStatus.NOT_FOUND,
        error: 'Not Found',
        code: 'ROADMAP_NOT_FOUND',
        message: 'Roadmap not found.',
      });
    }
    return { data: serializeRoadmapDetail(roadmap) };
  }

  /**
   * Physical delete: the roadmap cascades to its items, their progress and
   * challenge submissions, so list counts drop it at once. Uploaded submission
   * files live outside the database and are removed after the commit.
   */
  async remove(userId: string | undefined, id: string) {
    const ownerId = this.requireUser(userId);
    const storageKeys = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "roadmap" WHERE "id" = ${id} AND "userId" = ${ownerId} FOR UPDATE`;
      const roadmap = await tx.roadmap.findFirst({
        where: { id, userId: ownerId },
        select: { id: true },
      });
      if (!roadmap) {
        throw new NotFoundException({
          statusCode: HttpStatus.NOT_FOUND,
          error: 'Not Found',
          code: 'ROADMAP_NOT_FOUND',
          message: 'Roadmap not found.',
        });
      }
      const submissions = await tx.challengeSubmission.findMany({
        where: { roadmapItem: { roadmapId: id }, storageKey: { not: null } },
        select: { storageKey: true },
      });
      await tx.roadmap.delete({ where: { id } });
      return submissions.map((submission) => submission.storageKey!);
    });
    // Best effort: the roadmap is already gone; a leftover file is only logged.
    const removals = await Promise.allSettled(
      storageKeys.map((key) => this.files.remove(key)),
    );
    const failed = removals.filter((result) => result.status === 'rejected');
    if (failed.length > 0)
      this.logger.warn(
        JSON.stringify({ roadmap_id: id, orphan_files: failed.length }),
      );
    return { message: 'Roadmap deleted.', data: { id } };
  }

  async setPaused(
    userId: string | undefined,
    id: string,
    dto: PauseRoadmapDto,
  ) {
    const ownerId = this.requireUser(userId);
    await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "roadmap" WHERE "id" = ${id} FOR UPDATE`;
      const roadmap = await tx.roadmap.findFirst({
        where: { id, userId: ownerId },
        include: includeItems,
      });
      if (!roadmap) {
        throw new NotFoundException({
          statusCode: HttpStatus.NOT_FOUND,
          error: 'Not Found',
          code: 'ROADMAP_NOT_FOUND',
          message: 'Roadmap not found.',
        });
      }
      if (roadmap.activityVersion !== dto.expectedActivityVersion) {
        throw conflict(
          'ROADMAP_VERSION_CONFLICT',
          'The roadmap version is stale.',
        );
      }
      const detail = serializeRoadmapDetail(roadmap);
      const isPaused = roadmap.pausedAt !== null;
      if (isPaused === dto.paused) return;
      if (dto.paused && detail.status !== RoadmapStatus.IN_PROGRESS) {
        throw conflict(
          'INVALID_ROADMAP_TRANSITION',
          'Only an in-progress roadmap can be paused.',
        );
      }
      if (!dto.paused && !isPaused) {
        throw conflict(
          'INVALID_ROADMAP_TRANSITION',
          'The roadmap is not paused.',
        );
      }
      await tx.roadmap.update({
        where: { id },
        data: {
          pausedAt: dto.paused ? new Date() : null,
          lastActivityAt: new Date(),
          activityVersion: { increment: VERSION_INCREMENT },
        },
      });
    });
    return this.findOne(ownerId, id);
  }
}
