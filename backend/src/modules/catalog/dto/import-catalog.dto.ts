import { IsOptional, IsString } from 'class-validator';
import type {
  ImportSource,
  ImportStatus,
} from '../../../generated/prisma/enums.js';
import type { ImportError } from '../types/catalog.types.js';

/** Cuerpo de POST /catalog/import cuando el CSV llega como texto. */
export class ImportCatalogDto {
  @IsOptional()
  @IsString()
  csv?: string;
}

export interface ImportResultDto {
  id: string;
  source: ImportSource;
  status: ImportStatus;
  created: number;
  updated: number;
  unchanged: number;
  errors: ImportError[];
  startedAt: Date;
  finishedAt: Date;
}

export interface ImportResultResponseDto {
  message: string;
  data: ImportResultDto;
}
