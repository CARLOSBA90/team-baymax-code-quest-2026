import {
  ConflictException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
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
  constructor(private readonly prisma: PrismaService) {}

  private requireUser(userId: string | undefined): string {
    if (!userId) throw new UnauthorizedException();
    return userId;
  }

  async findAll(userId: string | undefined, query: FindRoadmapsQueryDto) {
    const ownerId = this.requireUser(userId);
    const roadmaps = await this.prisma.roadmap.findMany({
      where: { userId: ownerId },
      include: includeItems,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
    const summaries = roadmaps.map(serializeRoadmapSummary);
    const counts = {
      all: summaries.length,
      notStarted: summaries.filter(
        (item) => item.status === RoadmapStatus.NOT_STARTED,
      ).length,
      inProgress: summaries.filter(
        (item) => item.status === RoadmapStatus.IN_PROGRESS,
      ).length,
      paused: summaries.filter((item) => item.status === RoadmapStatus.PAUSED)
        .length,
      completed: summaries.filter(
        (item) => item.status === RoadmapStatus.COMPLETED,
      ).length,
    };
    const filtered = query.status
      ? summaries.filter((item) => item.status === query.status)
      : summaries;
    const start = (query.page - DEFAULT_PAGE) * query.limit;
    return {
      data: filtered.slice(start, start + query.limit),
      meta: {
        total: filtered.length,
        page: query.page,
        limit: query.limit,
        totalPages:
          filtered.length === EMPTY_COLLECTION_SIZE
            ? EMPTY_COLLECTION_SIZE
            : Math.ceil(filtered.length / query.limit),
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
