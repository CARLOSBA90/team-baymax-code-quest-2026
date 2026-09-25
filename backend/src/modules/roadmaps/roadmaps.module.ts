import { Module } from '@nestjs/common';
import { ProgressModule } from '../progress/progress.module.js';
import { GeneratorProbeService } from './generators/generator-probe.service.js';
import { RoadmapGenerationService } from './roadmap-generation.service.js';
import { RoadmapsController } from './roadmaps.controller.js';
import { RoadmapsService } from './roadmaps.service.js';
import { NvidiaRoadmapGenerator } from './generators/nvidia-roadmap-generator.js';
import { RoadmapGeneratorOrchestrator } from './generators/roadmap-generator.orchestrator.js';
import { RulesRoadmapGenerator } from './generators/rules-roadmap-generator.js';
import { RoadmapGeneratorRegistry } from './generators/roadmap-generator.registry.js';
import { GeneratorConfigurationService } from './generators/generator-configuration.service.js';
import { GeneratorConfigurationController } from './generator-configuration.controller.js';

@Module({
  imports: [ProgressModule],
  controllers: [RoadmapsController, GeneratorConfigurationController],
  providers: [
    GeneratorProbeService,
    RoadmapsService,
    RoadmapGenerationService,
    RoadmapGeneratorRegistry,
    GeneratorConfigurationService,
    RulesRoadmapGenerator,
    NvidiaRoadmapGenerator,
    RoadmapGeneratorOrchestrator,
  ],
  exports: [RoadmapsService, RoadmapGenerationService],
})
export class RoadmapsModule {}
