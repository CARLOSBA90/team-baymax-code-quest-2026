import { Injectable, Logger } from '@nestjs/common';
import {
  RoadmapGenerationMode,
  RoadmapGeneratorProvider,
} from '../roadmap.constants.js';
import type {
  GeneratedRoadmapPlan,
  RoadmapGeneratorContext,
} from './roadmap-generator.interface.js';
import { RoadmapGeneratorRegistry } from './roadmap-generator.registry.js';
import { GeneratorConfigurationService } from './generator-configuration.service.js';

@Injectable()
export class RoadmapGeneratorOrchestrator {
  private readonly logger = new Logger(RoadmapGeneratorOrchestrator.name);

  constructor(
    private readonly registry: RoadmapGeneratorRegistry,
    private readonly configuration: GeneratorConfigurationService,
  ) {}

  async generate(
    context: RoadmapGeneratorContext,
    mode = RoadmapGenerationMode.AUTO,
  ): Promise<GeneratedRoadmapPlan> {
    const configuredChain = this.configuration.providerChain(mode);
    const configured = configuredChain[0] ?? RoadmapGeneratorProvider.RULES;
    const chain = this.registry.resolveChain(configuredChain);
    const attemptedProviders: string[] = [];

    for (const generator of chain) {
      attemptedProviders.push(generator.provider);
      try {
        const plan = await generator.generate(context);
        return {
          ...plan,
          fallbackFrom:
            generator.provider === configured ? undefined : configured,
          attemptedProviders,
        };
      } catch (error) {
        this.logger.warn(
          `${generator.provider} roadmap generation failed: ${error instanceof Error ? error.message : 'unknown error'}`,
        );
      }
    }

    throw new Error('No registered roadmap generator could create a plan.');
  }
}
