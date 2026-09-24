import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { Session as UserSession } from '../auth/auth.js';
import { GenerateRoadmapDto } from './dto/generate-roadmap.dto.js';
import { FindRoadmapsQueryDto } from './dto/find-roadmaps-query.dto.js';
import { PauseRoadmapDto } from './dto/pause-roadmap.dto.js';
import { RoadmapGenerationService } from './roadmap-generation.service.js';
import { RoadmapsService } from './roadmaps.service.js';

@Controller('roadmaps')
export class RoadmapsController {
  constructor(
    private readonly roadmapsService: RoadmapsService,
    private readonly generationService: RoadmapGenerationService,
  ) {}

  @Post('generate')
  generate(@Session() session: UserSession, @Body() dto: GenerateRoadmapDto) {
    return this.generationService.generate(session?.user?.id, dto);
  }

  @Get()
  findAll(
    @Session() session: UserSession,
    @Query() query: FindRoadmapsQueryDto,
  ) {
    return this.roadmapsService.findAll(session?.user?.id, query);
  }

  @Patch(':id/pause')
  setPaused(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Body() dto: PauseRoadmapDto,
  ) {
    return this.roadmapsService.setPaused(session?.user?.id, id, dto);
  }

  @Get(':id')
  findOne(@Session() session: UserSession, @Param('id') id: string) {
    return this.roadmapsService.findOne(session?.user?.id, id);
  }
}
