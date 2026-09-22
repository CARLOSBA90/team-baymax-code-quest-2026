import { Test, type TestingModule } from '@nestjs/testing';
import { ImportSource, ImportStatus } from '../../generated/prisma/enums.js';
import { CatalogController } from './catalog.controller.js';
import { CatalogService } from './catalog.service.js';

describe('CatalogController', () => {
  let controller: CatalogController;
  let catalogService: {
    importFromCsv: ReturnType<typeof vi.fn>;
    findAll: ReturnType<typeof vi.fn>;
  };

  const importResponse = {
    message: 'Importación finalizada',
    data: {
      id: 'import-1',
      source: ImportSource.CSV,
      status: ImportStatus.SUCCESS,
      created: 1,
      updated: 0,
      unchanged: 0,
      errors: [],
      startedAt: new Date('2026-09-21T10:00:00.000Z'),
      finishedAt: new Date('2026-09-21T10:00:01.000Z'),
    },
  };

  beforeEach(async () => {
    catalogService = {
      importFromCsv: vi.fn().mockResolvedValue(importResponse),
      findAll: vi.fn().mockResolvedValue({
        data: [{ id: 'course-1', slug: 'nest-pro' }],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CatalogController],
      providers: [{ provide: CatalogService, useValue: catalogService }],
    }).compile();

    controller = module.get(CatalogController);
  });

  it('imports CSV text from the request body when no file is uploaded', async () => {
    const response = await controller.importCourses(undefined, {
      csv: 'body csv',
    });

    expect(catalogService.importFromCsv).toHaveBeenCalledExactlyOnceWith(
      'body csv',
    );
    expect(response).toBe(importResponse);
  });

  it('decodes an uploaded UTF-8 file and gives it precedence over body text', async () => {
    const response = await controller.importCourses(
      { buffer: Buffer.from('título desde archivo', 'utf8') },
      { csv: 'body csv' },
    );

    expect(catalogService.importFromCsv).toHaveBeenCalledExactlyOnceWith(
      'título desde archivo',
    );
    expect(response).toBe(importResponse);
  });

  it('passes undefined to the service when neither input source is present', async () => {
    await controller.importCourses(undefined, {});

    expect(catalogService.importFromCsv).toHaveBeenCalledExactlyOnceWith(
      undefined,
    );
  });

  it('delegates the complete query object and returns the service page', async () => {
    const query = { page: 2, limit: 5, level: 3 };

    const response = await controller.findAll(query);

    expect(catalogService.findAll).toHaveBeenCalledExactlyOnceWith(query);
    expect(response).toEqual({
      data: [{ id: 'course-1', slug: 'nest-pro' }],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });
  });
});
