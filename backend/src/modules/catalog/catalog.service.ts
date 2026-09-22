import { BadRequestException, Injectable } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client.js';
import {
  CourseStatus,
  ImportSource,
  ImportStatus,
} from '../../generated/prisma/enums.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { DEFAULT_LIMIT, DEFAULT_PAGE } from './catalog.constants.js';
import type { CoursesPageResponseDto } from './dto/course-response.dto.js';
import type { FindCoursesQueryDto } from './dto/find-courses-query.dto.js';
import type { ImportResultResponseDto } from './dto/import-catalog.dto.js';
import type {
  CatalogIngestionAdapter,
  RawCourse,
} from './ingestion/catalog-ingestion.interface.js';
import { CsvCatalogAdapter } from './ingestion/csv.adapter.js';
import type { ImportError, NormalizedCourse } from './types/catalog.types.js';
import {
  hasCourseChanges,
  normalizeCourse,
} from './utils/course-normalizer.util.js';

interface UpsertCounts {
  created: number;
  updated: number;
  unchanged: number;
}

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Importa cursos desde el contenido de un CSV y registra la operación
   * en CatalogImport con sus conteos y errores.
   */
  async importFromCsv(
    content: string | undefined,
  ): Promise<ImportResultResponseDto> {
    if (!content?.trim()) {
      throw new BadRequestException(
        'Envía el CSV en el campo csv o como archivo en el campo file',
      );
    }

    return this.runImport(new CsvCatalogAdapter(content), ImportSource.CSV);
  }

  /**
   * Lista paginada de cursos activos con sus skills, filtrable por nivel
   * y por skill. Devuelve { data, meta } como espera el frontend.
   */
  async findAll(query: FindCoursesQueryDto): Promise<CoursesPageResponseDto> {
    const page = query.page ?? DEFAULT_PAGE;
    const limit = query.limit ?? DEFAULT_LIMIT;
    const where: Prisma.CourseWhereInput = { status: CourseStatus.ACTIVE };
    if (query.level !== undefined) where.level = query.level;
    if (query.skill !== undefined) {
      where.skills = { some: { skill: query.skill } };
    }

    const [total, courses] = await this.prisma.$transaction([
      this.prisma.course.count({ where }),
      this.prisma.course.findMany({
        where,
        orderBy: [{ level: 'asc' }, { title: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          slug: true,
          title: true,
          url: true,
          description: true,
          level: true,
          durationHours: true,
          skills: {
            select: { skill: true, weight: true },
            orderBy: { weight: 'desc' },
          },
        },
      }),
    ]);

    return {
      data: courses,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Marca INACTIVE los cursos cuyo slug no está en la lista y devuelve cuántos
   * cambió. Con una lista vacía no hace nada para no apagar todo el catálogo.
   */
  async deactivateMissing(slugs: string[]): Promise<number> {
    if (slugs.length === 0) return 0;

    const { count } = await this.prisma.course.updateMany({
      where: {
        slug: { notIn: slugs },
        status: { not: CourseStatus.INACTIVE },
      },
      data: { status: CourseStatus.INACTIVE },
    });

    return count;
  }

  /**
   * Ejecuta la importación con cualquier adaptador. Si algo falla, la fila
   * de CatalogImport queda en FAILED y el error se propaga.
   */
  private async runImport(
    adapter: CatalogIngestionAdapter,
    source: ImportSource,
  ): Promise<ImportResultResponseDto> {
    const { id, startedAt } = await this.prisma.catalogImport.create({
      data: { source },
      select: { id: true, startedAt: true },
    });

    try {
      const { courses, errors } = this.normalizeAll(
        await adapter.fetchCourses(),
      );
      const counts = await this.upsertCourses(courses, startedAt);
      const status = this.resolveStatus(courses.length, errors.length);
      const finishedAt = new Date();

      await this.prisma.catalogImport.update({
        where: { id },
        data: {
          status,
          created: counts.created,
          updated: counts.updated,
          errors: errors.length > 0 ? JSON.stringify(errors) : null,
          finishedAt,
        },
      });

      return {
        message: `Importación finalizada: ${counts.created} creados, ${counts.updated} actualizados, ${counts.unchanged} sin cambios, ${errors.length} con errores`,
        data: { id, source, status, ...counts, errors, startedAt, finishedAt },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.prisma.catalogImport.update({
        where: { id },
        data: {
          status: ImportStatus.FAILED,
          errors: JSON.stringify([{ message }]),
          finishedAt: new Date(),
        },
      });
      throw error;
    }
  }

  /**
   * Normaliza las filas y deduplica por slug: se conserva la primera
   * aparición y las repetidas se reportan como error.
   */
  private normalizeAll(rawCourses: RawCourse[]): {
    courses: NormalizedCourse[];
    errors: ImportError[];
  } {
    if (rawCourses.length === 0) {
      throw new BadRequestException('El CSV no contiene cursos');
    }

    const courses: NormalizedCourse[] = [];
    const errors: ImportError[] = [];
    const rowBySlug = new Map<string, number>();

    for (const raw of rawCourses) {
      const result = normalizeCourse(raw);
      if (!result.ok) {
        errors.push({
          row: raw.row,
          slug: raw.slug || undefined,
          message: result.problems.join('; '),
        });
        continue;
      }

      const { slug } = result.course;
      const firstRow = rowBySlug.get(slug);
      if (firstRow !== undefined) {
        errors.push({
          row: raw.row,
          slug,
          message: `slug duplicado, ya definido en la fila ${firstRow}`,
        });
        continue;
      }

      rowBySlug.set(slug, raw.row);
      courses.push(result.course);
    }

    return { courses, errors };
  }

  /**
   * Hace upsert por slug y reemplaza las skills de cada curso. Los cursos
   * sin cambios no se escriben, así reimportar el mismo CSV es idempotente.
   */
  private async upsertCourses(
    courses: NormalizedCourse[],
    importedAt: Date,
  ): Promise<UpsertCounts> {
    const stored = await this.prisma.course.findMany({
      where: { slug: { in: courses.map((course) => course.slug) } },
      select: {
        slug: true,
        title: true,
        url: true,
        description: true,
        level: true,
        durationHours: true,
        status: true,
        skills: { select: { skill: true, weight: true } },
      },
    });
    const storedBySlug = new Map(stored.map((course) => [course.slug, course]));
    const counts: UpsertCounts = { created: 0, updated: 0, unchanged: 0 };

    for (const course of courses) {
      const current = storedBySlug.get(course.slug);
      if (current && !hasCourseChanges(current, course)) {
        counts.unchanged++;
        continue;
      }

      const { skills, ...fields } = course;
      await this.prisma.course.upsert({
        where: { slug: course.slug },
        create: {
          ...fields,
          sourceUpdatedAt: importedAt,
          skills: { create: skills },
        },
        update: {
          ...fields,
          sourceUpdatedAt: importedAt,
          skills: { deleteMany: {}, create: skills },
        },
      });

      if (current) counts.updated++;
      else counts.created++;
    }

    return counts;
  }

  private resolveStatus(validCount: number, errorCount: number): ImportStatus {
    if (errorCount === 0) return ImportStatus.SUCCESS;
    return validCount > 0 ? ImportStatus.PARTIAL : ImportStatus.FAILED;
  }
}
