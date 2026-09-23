import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Session } from '@thallesp/nestjs-better-auth';
import type { Response } from 'express';
import { MAX_CHALLENGE_FILE_BYTES } from './progress.constants.js';

interface ChallengeUpload {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}
import type { Session as UserSession } from '../auth/auth.js';
import { UpdateProgressDto } from './dto/update-progress.dto.js';
import { TrackProgressDto } from './dto/track-progress.dto.js';
import { ProgressService } from './progress.service.js';

@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Post(':roadmapItemId/files')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_CHALLENGE_FILE_BYTES } }),
  )
  uploadFile(
    @Session() session: UserSession,
    @Param('roadmapItemId') roadmapItemId: string,
    @UploadedFile() file: ChallengeUpload | undefined,
  ) {
    return this.progressService.uploadFile(
      session?.user?.id,
      roadmapItemId,
      file,
    );
  }

  @Post(':roadmapItemId/track')
  async track(
    @Session() session: UserSession,
    @Param('roadmapItemId') roadmapItemId: string,
    @Body() dto: TrackProgressDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.progressService.track(
      session?.user?.id,
      roadmapItemId,
      dto,
    );
    response.status(result.statusCode);
    return result.body;
  }

  @Patch(':roadmapItemId')
  update(
    @Session() session: UserSession,
    @Param('roadmapItemId') roadmapItemId: string,
    @Body() dto: UpdateProgressDto,
  ) {
    return this.progressService.update(session?.user?.id, roadmapItemId, dto);
  }

  @Get('roadmap/:roadmapId')
  getForRoadmap(
    @Session() session: UserSession,
    @Param('roadmapId') roadmapId: string,
  ) {
    return this.progressService.getForRoadmap(session?.user?.id, roadmapId);
  }
}
