import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import { AdminGuard } from '../../../common/guards/admin.guard.js';
import type { Session as UserSession } from '../../auth/auth.js';
import { ReviewChallengeDto } from '../dto/review-challenge.dto.js';
import { ChallengeReviewService } from './challenge-review.service.js';

@Controller('admin/challenge-submissions')
@UseGuards(AdminGuard)
export class ChallengeReviewController {
  constructor(private readonly service: ChallengeReviewService) {}

  @Patch(':id/review')
  review(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Body() dto: ReviewChallengeDto,
  ) {
    return this.service.review(session?.user?.id, id, dto);
  }
}
