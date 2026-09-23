import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_PAGE,
  MIN_PAGE_SIZE,
  RoadmapStatus,
} from '../roadmap.constants.js';

export class FindRoadmapsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(MIN_PAGE)
  page = DEFAULT_PAGE;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(MIN_PAGE_SIZE)
  @Max(MAX_PAGE_SIZE)
  limit = DEFAULT_PAGE_SIZE;

  @IsOptional()
  @IsEnum(RoadmapStatus)
  status?: RoadmapStatus;
}
