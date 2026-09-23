import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  MAX_DECIMAL_PLACES,
  MAX_GOAL_DESCRIPTION_LENGTH,
  MAX_TITLE_LENGTH,
  MAX_WEEKLY_HOURS,
  MIN_GOAL_DESCRIPTION_LENGTH,
  MIN_IDENTIFIER_LENGTH,
  MIN_TITLE_LENGTH,
  MIN_WEEKLY_HOURS,
  DeclaredLevel,
  RoadmapGenerationMode,
  RoadmapGoalType,
} from '../roadmap.constants.js';

export class RoadmapGoalDto {
  @IsEnum(RoadmapGoalType)
  type!: RoadmapGoalType;

  @IsString()
  @MinLength(MIN_GOAL_DESCRIPTION_LENGTH)
  @MaxLength(MAX_GOAL_DESCRIPTION_LENGTH)
  description!: string;
}

export class GenerateRoadmapDto {
  @IsOptional()
  @IsString()
  @MinLength(MIN_IDENTIFIER_LENGTH)
  assessmentId?: string;

  @IsOptional()
  @IsString()
  @MinLength(MIN_TITLE_LENGTH)
  @MaxLength(MAX_TITLE_LENGTH)
  title?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => RoadmapGoalDto)
  goal?: RoadmapGoalDto;

  @IsOptional()
  @IsEnum(DeclaredLevel)
  declaredLevel?: DeclaredLevel;

  @IsOptional()
  @IsEnum(RoadmapGenerationMode)
  generationMode?: RoadmapGenerationMode;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: MAX_DECIMAL_PLACES })
  @Min(MIN_WEEKLY_HOURS)
  @Max(MAX_WEEKLY_HOURS)
  weeklyHours?: number;
}
