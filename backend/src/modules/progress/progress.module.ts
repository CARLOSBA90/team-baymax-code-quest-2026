import { Module } from '@nestjs/common';
import { ProgressController } from './progress.controller.js';
import { ProgressService } from './progress.service.js';
import { ChallengeReviewController } from './challenges/challenge-review.controller.js';
import { ChallengeReviewService } from './challenges/challenge-review.service.js';
import { ChallengeFileStorageService } from './storage/challenge-file-storage.service.js';

@Module({
  controllers: [ProgressController, ChallengeReviewController],
  providers: [
    ProgressService,
    ChallengeReviewService,
    ChallengeFileStorageService,
  ],
})
export class ProgressModule {}
