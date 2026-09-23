import { IsInt, Max, Min } from 'class-validator';
import {
  INITIAL_VERSION,
  PROGRESS_MAX_PERCENTAGE,
  PROGRESS_MIN_PERCENTAGE,
} from '../../roadmaps/roadmap.constants.js';

export class UpdateProgressDto {
  @IsInt()
  @Min(PROGRESS_MIN_PERCENTAGE)
  @Max(PROGRESS_MAX_PERCENTAGE)
  percentage!: number;

  @IsInt()
  @Min(INITIAL_VERSION)
  expectedVersion!: number;
}
