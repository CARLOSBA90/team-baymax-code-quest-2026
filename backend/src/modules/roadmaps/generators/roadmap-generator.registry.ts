import { Injectable } from '@nestjs/common';
import { RoadmapGeneratorProvider } from '../roadmap.constants.js';
import type { RoadmapGenerator } from './roadmap-generator.interface.js';

@Injectable()
export class RoadmapGeneratorRegistry {
  private readonly generators = new Map<string, RoadmapGenerator>();

  register(generator: RoadmapGenerator): void {
    const provider = generator.provider.trim().toUpperCase();
    if (this.generators.has(provider)) {
      throw new Error(`Roadmap generator ${provider} is already registered.`);
    }
    this.generators.set(provider, generator);
  }

  resolveChain(configuredProviders: string[]): RoadmapGenerator[] {
    const requested = configuredProviders.map((provider) =>
      provider.toUpperCase(),
    );
    const rules = this.generators.get(RoadmapGeneratorProvider.RULES);
    if (
      requested.length === 1 &&
      requested[0] === RoadmapGeneratorProvider.RULES
    ) {
      return rules?.isAvailable() ? [rules] : [];
    }
    const available = [...this.generators.values()]
      .filter((generator) => generator.isAvailable())
      .sort(
        (left, right) =>
          left.fallbackPriority - right.fallbackPriority ||
          left.provider.localeCompare(right.provider),
      );
    const chain = requested
      .map((provider) => this.generators.get(provider))
      .filter((generator): generator is RoadmapGenerator =>
        Boolean(
          generator?.isAvailable() &&
          generator.provider !== RoadmapGeneratorProvider.RULES,
        ),
      );
    chain.push(
      ...available.filter(
        (generator) =>
          !chain.includes(generator) &&
          generator.provider !== RoadmapGeneratorProvider.RULES,
      ),
    );

    if (rules?.isAvailable() && !chain.includes(rules)) chain.push(rules);
    return chain;
  }
}
