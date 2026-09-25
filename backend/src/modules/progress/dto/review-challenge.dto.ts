import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ReviewDecision } from '../progress.constants.js';

export class ReviewChallengeDto {
  @IsEnum(ReviewDecision)
  decision!: ReviewDecision;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  feedback?: string;
}
