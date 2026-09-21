import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { MAX_CSV_FILE_BYTES } from './catalog.constants.js';
import { CatalogService } from './catalog.service.js';
import type { CoursesPageResponseDto } from './dto/course-response.dto.js';
import { FindCoursesQueryDto } from './dto/find-courses-query.dto.js';
import {
  ImportCatalogDto,
  type ImportResultResponseDto,
} from './dto/import-catalog.dto.js';

/** Archivo recibido por multipart; solo se usa su contenido. */
interface CsvUpload {
  buffer: Buffer;
}

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  /**
   * POST /api/v1/catalog/import
   * Requiere sesión. Recibe el CSV como texto en el campo csv (JSON) o
   * como archivo en el campo file (multipart/form-data).
   */
  @Post('import')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_CSV_FILE_BYTES } }),
  )
  importCourses(
    @UploadedFile() file: CsvUpload | undefined,
    @Body() dto: ImportCatalogDto,
  ): Promise<ImportResultResponseDto> {
    return this.catalogService.importFromCsv(
      file?.buffer.toString('utf8') ?? dto.csv,
    );
  }

  /**
   * GET /api/v1/catalog/courses
   * Público. Cursos activos paginados con page y limit, filtrables por
   * level (1 a 3) y skill (SkillCategory).
   */
  @Get('courses')
  @AllowAnonymous()
  findAll(
    @Query() query: FindCoursesQueryDto,
  ): Promise<CoursesPageResponseDto> {
    return this.catalogService.findAll(query);
  }
}
