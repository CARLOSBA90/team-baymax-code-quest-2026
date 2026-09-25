import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Session } from '@thallesp/nestjs-better-auth';
import type { Response } from 'express';
import type { Session as UserSession } from '../auth/auth.js';
import { TrackProgressDto } from './dto/track-progress.dto.js';
import { MAX_CHALLENGE_FILE_BYTES } from './progress.constants.js';
import { ProgressService } from './progress.service.js';
import type { ChallengeUpload } from './storage/challenge-file.validator.js';

@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  /** Accepts JSON, or multipart when a FILE challenge submission is attached. */
  @Post('track')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_CHALLENGE_FILE_BYTES } }),
  )
  async track(
    @Session() session: UserSession,
    @Body() dto: TrackProgressDto,
    @UploadedFile() file: ChallengeUpload | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.progressService.track(
      session?.user?.id,
      dto,
      file,
    );
    response.status(result.statusCode);
    return result.body;
  }

  @Get('roadmap/:roadmapId')
  getForRoadmap(
    @Session() session: UserSession,
    @Param('roadmapId') roadmapId: string,
  ) {
    return this.progressService.getForRoadmap(session?.user?.id, roadmapId);
  }
}
