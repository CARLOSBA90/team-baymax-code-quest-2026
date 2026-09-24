import { plainToInstance, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  MAX_POSITION_SECONDS,
  MAX_SUBMISSION_LANGUAGE_LENGTH,
  MAX_SUBMISSION_TEXT_LENGTH,
  SubmissionType,
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
  @MaxLength(MAX_SUBMISSION_LANGUAGE_LENGTH)
  language?: string;

  @ValidateIf(
    (value: ChallengeSubmissionDto) => value.type === SubmissionType.LINK,
  )
  @IsUrl({ protocols: ['https'], require_protocol: true })
  url?: string;
}

/** Multipart requests carry the submission as a JSON string next to the file. */
function toSubmission({ obj }: { obj: Record<string, unknown> }): unknown {
  let raw = obj.submission;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      return obj.submission;
    }
  }
  return raw && typeof raw === 'object' && !Array.isArray(raw)
    ? plainToInstance(ChallengeSubmissionDto, raw)
    : raw;
}

/**
 * The client only says which item and what happened. The backend knows the
 * item's tracking type and checks that the right fields were sent:
 * COMPLETION/READING → completed: true, LESSONS → lesson_id + completed
 * (true marks, false unmarks), VIDEO → position_seconds,
 * CHALLENGE → submission (plus a multipart file for FILE).
 */
export class TrackProgressDto {
  @IsString()
  @IsNotEmpty()
  roadmap_item_id!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  lesson_id?: string;

  @IsOptional()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  completed?: boolean;

  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(MAX_POSITION_SECONDS)
  position_seconds?: number;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Transform(toSubmission)
  submission?: ChallengeSubmissionDto;
}
