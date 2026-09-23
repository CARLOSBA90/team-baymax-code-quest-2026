import { IsBoolean, IsInt, Min } from 'class-validator';
import { INITIAL_VERSION } from '../roadmap.constants.js';

export class PauseRoadmapDto {
  @IsBoolean()
  paused!: boolean;

  @IsInt()
  @Min(INITIAL_VERSION)
  expectedActivityVersion!: number;
}
