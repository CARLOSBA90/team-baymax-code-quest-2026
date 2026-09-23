import { Type } from 'class-transformer';
import {
  Equals,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsNotEmpty,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  MAX_SUBMISSION_TEXT_LENGTH,
  SubmissionType,
  TrackingType,
} from '../progress.constants.js';

export class ChallengeSubmissionDto {
  @IsEnum(SubmissionType)
  type!: SubmissionType;

  @ValidateIf((value: ChallengeSubmissionDto) =>
    [SubmissionType.TEXT, SubmissionType.CODE].includes(value.type),
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_SUBMISSION_TEXT_LENGTH)
  content?: string;

  @ValidateIf(
    (value: ChallengeSubmissionDto) => value.type === SubmissionType.CODE,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  language?: string;

  @ValidateIf(
    (value: ChallengeSubmissionDto) => value.type === SubmissionType.LINK,
  )
  @IsUrl({ protocols: ['https'], require_protocol: true })
  url?: string;

  @ValidateIf(
    (value: ChallengeSubmissionDto) => value.type === SubmissionType.FILE,
  )
  @IsString()
  file_id?: string;
}

export class TrackPayloadDto {
  @IsEnum(TrackingType)
  type!: TrackingType;

  @ValidateIf((value: TrackPayloadDto) => value.type === TrackingType.VIDEO)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  position_seconds?: number;

  @ValidateIf((value: TrackPayloadDto) =>
    [TrackingType.READING, TrackingType.MANUAL].includes(value.type),
  )
  @IsBoolean()
  @Equals(true)
  completed?: boolean;

  @ValidateIf((value: TrackPayloadDto) => value.type === TrackingType.CHALLENGE)
  @ValidateNested()
  @Type(() => ChallengeSubmissionDto)
  submission?: ChallengeSubmissionDto;
}

export class TrackProgressDto {
  @IsUUID()
  event_id!: string;

  @ValidateNested()
  @Type(() => TrackPayloadDto)
  payload!: TrackPayloadDto;
}
