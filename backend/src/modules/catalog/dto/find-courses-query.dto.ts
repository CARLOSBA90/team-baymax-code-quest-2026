import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { SkillCategory } from '../../../generated/prisma/enums.js';
import { MAX_LIMIT } from '../catalog.constants.js';

/** Query de GET /catalog/courses: paginación y filtros opcionales. */
export class FindCoursesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_LIMIT)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3)
  level?: number;

  @IsOptional()
  @IsEnum(SkillCategory)
  skill?: SkillCategory;
}
