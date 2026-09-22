import { BadRequestException } from '@nestjs/common';
import { CsvError, parse } from 'csv-parse/sync';
import { REQUIRED_CSV_COLUMNS } from '../catalog.constants.js';
import type {
  CatalogIngestionAdapter,
  RawCourse,
} from './catalog-ingestion.interface.js';

type CsvRecord = Partial<Record<string, string>>;

/** Lee cursos desde el contenido de un CSV con encabezado. */
export class CsvCatalogAdapter implements CatalogIngestionAdapter {
  constructor(private readonly content: string) {}

  /** Devuelve una fila cruda por curso; la fila 1 es el encabezado. */
  async fetchCourses(): Promise<RawCourse[]> {
    return this.parseRecords().map((record, index) => ({
      row: index + 2,
      slug: record.slug ?? '',
      title: record.title ?? '',
      url: record.url ?? '',
      description: record.description ?? '',
      level: record.level ?? '',
      tags: record.tags ?? '',
      durationHours: record.durationHours ?? '',
      imageUrl: record.imageUrl ?? '',
    }));
  }

  /** Parsea el CSV y convierte los errores de formato en 400. */
  private parseRecords(): CsvRecord[] {
    try {
      return parse<CsvRecord>(this.content, {
        bom: true,
        columns: (header: string[]) => this.readHeader(header),
        relax_column_count: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch (error) {
      if (error instanceof CsvError) {
        throw new BadRequestException(`El CSV no es válido: ${error.message}`);
      }
      throw error;
    }
  }

  /** Valida que el encabezado traiga las columnas obligatorias. */
  private readHeader(header: string[]): string[] {
    const columns = header.map((column) => column.trim());
    const missing = REQUIRED_CSV_COLUMNS.filter(
      (column) => !columns.includes(column),
    );

    if (missing.length > 0) {
      throw new BadRequestException(
        `Faltan columnas obligatorias en el CSV: ${missing.join(', ')}`,
      );
    }

    return columns;
  }
}
