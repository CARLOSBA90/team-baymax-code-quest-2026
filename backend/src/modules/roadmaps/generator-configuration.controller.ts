import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { GeneratorProbeService } from './generators/generator-probe.service.js';
import { ProbeGeneratorDto } from './dto/probe-generator.dto.js';
import { AdminGuard } from '../../common/guards/admin.guard.js';
import { GeneratorConfigurationService } from './generators/generator-configuration.service.js';

@Controller('admin/roadmap-generator')
@UseGuards(AdminGuard)
export class GeneratorConfigurationController {
  constructor(
    private readonly configuration: GeneratorConfigurationService,
    private readonly probeService: GeneratorProbeService,
  ) {}

  @Post('probe')
  @HttpCode(HttpStatus.OK)
  probe(@Body() dto: ProbeGeneratorDto) {
    return this.probeService.probe(dto.model);
  }

  @Get('config')
  getConfiguration() {
    return { data: this.configuration.publicConfiguration() };
  }
}
