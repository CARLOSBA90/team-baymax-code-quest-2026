import { IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';

export class ProbeGeneratorDto {
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  model?: string;
}
