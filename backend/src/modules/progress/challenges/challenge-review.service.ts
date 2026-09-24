import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ChallengeSubmissionStatus,
  Prisma,
} from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { ReviewChallengeDto } from '../dto/review-challenge.dto.js';
import {
  MANUAL_EVALUATOR_VERSION,
  ReviewDecision,
} from '../progress.constants.js';

@Injectable()
export class ChallengeReviewService {
  constructor(private readonly prisma: PrismaService) {}

  async review(
    userId: string | undefined,
    submissionId: string,
    dto: ReviewChallengeDto,
  ) {
    if (!userId) throw new UnauthorizedException();
    return this.prisma.$transaction(async (tx) => {
      const candidate = await tx.challengeSubmission.findUnique({
        where: { id: submissionId },
        select: { roadmapItem: { select: { roadmapId: true, id: true } } },
      });
      if (!candidate)
        throw new NotFoundException({
          statusCode: 404,
          error: 'Not Found',
          code: 'SUBMISSION_NOT_FOUND',
          message: 'Challenge submission not found.',
        });
      await tx.$queryRaw`SELECT "id" FROM "roadmap" WHERE "id" = ${candidate.roadmapItem.roadmapId} FOR UPDATE`;
      const submission = await tx.challengeSubmission.findUnique({
        where: { id: submissionId },
      });
      if (!submission) throw new NotFoundException();
      if (submission.status !== ChallengeSubmissionStatus.PENDING_REVIEW) {
        throw new ConflictException({
          statusCode: 409,
          error: 'Conflict',
          code: 'SUBMISSION_ALREADY_REVIEWED',
          message: 'Only a pending submission can be reviewed.',
        });
      }
      const now = new Date();
      const approved = dto.decision === ReviewDecision.APPROVED;
      await tx.challengeSubmission.update({
        where: { id: submissionId },
        data: {
          status: approved
            ? ChallengeSubmissionStatus.APPROVED
            : ChallengeSubmissionStatus.REJECTED,
          feedback:
            dto.feedback === undefined
              ? Prisma.JsonNull
              : { message: dto.feedback },
          evaluatorVersion: MANUAL_EVALUATOR_VERSION,
          reviewedByUserId: userId,
          evaluatedAt: now,
        },
      });
      if (approved) {
        const progress = await tx.progress.findUniqueOrThrow({
          where: { roadmapItemId: candidate.roadmapItem.id },
        });
        await tx.progress.update({
          where: { roadmapItemId: candidate.roadmapItem.id },
          data: {
            percentage: 100,
            startedAt: progress.startedAt ?? now,
            completedAt: now,
            version: { increment: 1 },
          },
        });
      }
      const percentages = await tx.progress.findMany({
        where: { roadmapItem: { roadmapId: candidate.roadmapItem.roadmapId } },
        select: { percentage: true },
      });
      const completed =
        percentages.length > 0 &&
        percentages.every((entry) => entry.percentage === 100);
      const roadmap = await tx.roadmap.update({
        where: { id: candidate.roadmapItem.roadmapId },
        data: {
          lastActivityAt: now,
          activityVersion: { increment: 1 },
          ...(completed ? { pausedAt: null } : {}),
        },
      });
      return {
        data: {
          id: submissionId,
          status: dto.decision,
          feedback: dto.feedback ?? null,
          evaluated_at: now.toISOString(),
          roadmap_id: roadmap.id,
          activity_version: roadmap.activityVersion,
        },
      };
    });
  }
}
