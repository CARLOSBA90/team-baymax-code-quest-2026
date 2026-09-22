import { BadRequestException } from '@nestjs/common';
import {
  CourseStatus,
  ImportSource,
  ImportStatus,
  SkillCategory,
} from '../../generated/prisma/enums.js';
import type { PrismaService } from '../../prisma/prisma.service.js';
import { CatalogService } from './catalog.service.js';

const HEADER = 'slug,title,url,description,level,tags,durationHours';
const STARTED_AT = new Date('2026-09-21T10:00:00.000Z');

const csv = (...rows: string[]) => [HEADER, ...rows].join('\n');

describe('CatalogService', () => {
  let service: CatalogService;
  let prismaMock: {
    catalogImport: {
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    course: {
      findMany: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
      upsert: ReturnType<typeof vi.fn>;
    };
    $transaction: ReturnType<typeof vi.fn>;
  };

  const upsertedCourse = (call = 0) =>
    prismaMock.course.upsert.mock.calls[call][0];
  const importUpdate = () => prismaMock.catalogImport.update.mock.calls[0][0];

  beforeEach(() => {
    prismaMock = {
      catalogImport: {
        create: vi.fn().mockResolvedValue({
          id: 'import-1',
          startedAt: STARTED_AT,
        }),
        update: vi.fn().mockResolvedValue({}),
      },
      course: {
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn(),
        upsert: vi.fn().mockResolvedValue({}),
      },
      $transaction: vi.fn((operations: Promise<unknown>[]) =>
        Promise.all(operations),
      ),
    };
    service = new CatalogService(prismaMock as unknown as PrismaService);
  });

  describe('importFromCsv', () => {
    it.each([undefined, '', '   \n'])(
      'rejects empty content (%j) without recording an import',
      async (content) => {
        await expect(service.importFromCsv(content)).rejects.toThrow(
          BadRequestException,
        );
        expect(prismaMock.catalogImport.create).not.toHaveBeenCalled();
      },
    );

    it('creates the course and records a successful CatalogImport', async () => {
      const result = await service.importFromCsv(
        csv(
          'nest-pro,Nest Pro,https://example.com/nest,Curso de Nest,intermediate,"nestjs,backend,typescript",20',
        ),
      );

      expect(prismaMock.catalogImport.create).toHaveBeenCalledExactlyOnceWith({
        data: { source: ImportSource.CSV },
        select: { id: true, startedAt: true },
      });
      const fields = {
        slug: 'nest-pro',
        title: 'Nest Pro',
        url: 'https://example.com/nest',
        description: 'Curso de Nest',
        level: 2,
        durationHours: 20,
        status: CourseStatus.ACTIVE,
        sourceUpdatedAt: STARTED_AT,
      };
      const skills = [
        { skill: SkillCategory.BACKEND, weight: 0.67 },
        { skill: SkillCategory.WEB_FUNDAMENTALS, weight: 0.33 },
      ];
      expect(prismaMock.course.upsert).toHaveBeenCalledExactlyOnceWith({
        where: { slug: 'nest-pro' },
        create: { ...fields, skills: { create: skills } },
        update: { ...fields, skills: { deleteMany: {}, create: skills } },
      });
      expect(importUpdate()).toEqual({
        where: { id: 'import-1' },
        data: {
          status: ImportStatus.SUCCESS,
          created: 1,
          updated: 0,
          errors: null,
          finishedAt: expect.any(Date),
        },
      });
      expect(result.data).toMatchObject({
        id: 'import-1',
        source: ImportSource.CSV,
        status: ImportStatus.SUCCESS,
        created: 1,
        updated: 0,
        unchanged: 0,
        errors: [],
      });
      expect(result.message).toContain('1 creados');
    });

    describe('tag normalization', () => {
      it('weights each skill by its share of the recognized tags', async () => {
        await service.importFromCsv(
          csv(
            'full,Full,https://example.com/full,,advanced,"nestjs,node,react,postgresql",',
          ),
        );

        expect(upsertedCourse().create.skills.create).toEqual([
          { skill: SkillCategory.BACKEND, weight: 0.5 },
          { skill: SkillCategory.DATABASES, weight: 0.25 },
          { skill: SkillCategory.FRONTEND, weight: 0.25 },
        ]);
      });

      it('ignores case, spaces, repeated tags and unknown tags', async () => {
        await service.importFromCsv(
          csv(
            'mix,Mix,https://example.com/mix,,beginner," React , REACT,jquery, vitest",',
          ),
        );

        expect(upsertedCourse().create.skills.create).toEqual([
          { skill: SkillCategory.FRONTEND, weight: 0.5 },
          { skill: SkillCategory.TESTING, weight: 0.5 },
        ]);
      });

      it.each([
        ['backend', SkillCategory.BACKEND],
        ['web-fundamentals', SkillCategory.WEB_FUNDAMENTALS],
        ['ci-cd', SkillCategory.DEVOPS],
        ['react-native', SkillCategory.MOBILE],
        ['mongodb', SkillCategory.DATABASES],
        ['spring-boot', SkillCategory.BACKEND],
        ['nextjs', SkillCategory.FRONTEND],
        ['dart', SkillCategory.MOBILE],
        ['sql-server', SkillCategory.DATABASES],
        ['aws', SkillCategory.DEVOPS],
      ])('maps the tag %s to %s', async (tag, skill) => {
        await service.importFromCsv(
          csv(`one,One,https://example.com/one,,beginner,${tag},`),
        );

        expect(upsertedCourse().create.skills.create).toEqual([
          { skill, weight: 1 },
        ]);
      });

      it('leaves a course without recognized tags in PENDING_REVIEW', async () => {
        await service.importFromCsv(
          csv(
            'cobol,Cobol,https://example.com/cobol,,beginner,"cobol,mainframe",',
          ),
        );

        expect(upsertedCourse().create).toMatchObject({
          status: CourseStatus.PENDING_REVIEW,
          skills: { create: [] },
        });
      });

      it.each([
        ['beginner', 1],
        ['intermediate', 2],
        ['Advanced', 3],
      ])('maps level %s to %i', async (level, expected) => {
        await service.importFromCsv(
          csv(`lvl,Lvl,https://example.com/lvl,,${level},node,`),
        );

        expect(upsertedCourse().create.level).toBe(expected);
      });
    });

    describe('validation', () => {
      it('reports invalid rows with their number and imports the rest as PARTIAL', async () => {
        const result = await service.importFromCsv(
          csv(
            'ok,Ok,https://example.com/ok,,beginner,node,',
            'bad,,ftp://example.com/bad,,expert,node,2.5',
          ),
        );

        expect(prismaMock.course.upsert).toHaveBeenCalledOnce();
        expect(result.data.status).toBe(ImportStatus.PARTIAL);
        expect(result.data.errors).toEqual([
          {
            row: 3,
            slug: 'bad',
            message: expect.stringMatching(/title.*url.*level.*durationHours/),
          },
        ]);
        expect(JSON.parse(importUpdate().data.errors)).toEqual(
          result.data.errors,
        );
      });

      it('marks the import FAILED when no row is valid', async () => {
        const result = await service.importFromCsv(
          csv('Not A Slug,Title,https://example.com,,beginner,node,'),
        );

        expect(prismaMock.course.upsert).not.toHaveBeenCalled();
        expect(result.data.status).toBe(ImportStatus.FAILED);
        expect(result.data.errors[0].message).toContain('slug');
      });

      it('rejects a CSV without required columns and records FAILED', async () => {
        await expect(
          service.importFromCsv('slug,title\nnest,Nest'),
        ).rejects.toThrow(
          'Faltan columnas obligatorias en el CSV: url, level, tags',
        );

        expect(importUpdate().data).toMatchObject({
          status: ImportStatus.FAILED,
          errors: expect.stringContaining('url, level, tags'),
        });
      });

      it('rejects a CSV with only the header', async () => {
        await expect(service.importFromCsv(HEADER)).rejects.toThrow(
          'El CSV no contiene cursos',
        );
        expect(importUpdate().data.status).toBe(ImportStatus.FAILED);
      });

      it('records FAILED and rethrows when the database fails', async () => {
        prismaMock.course.upsert.mockRejectedValueOnce(new Error('db down'));

        await expect(
          service.importFromCsv(
            csv('ok,Ok,https://example.com/ok,,beginner,node,'),
          ),
        ).rejects.toThrow('db down');

        expect(importUpdate().data).toEqual({
          status: ImportStatus.FAILED,
          errors: JSON.stringify([{ message: 'db down' }]),
          finishedAt: expect.any(Date),
        });
      });
    });

    describe('dedupe and upsert', () => {
      it('keeps the first row of a repeated slug and reports the others', async () => {
        const result = await service.importFromCsv(
          csv(
            'nest-pro,Primera,https://example.com/1,,beginner,nestjs,',
            'nest-pro,Segunda,https://example.com/2,,beginner,nestjs,',
            'NEST-PRO,Tercera,https://example.com/3,,beginner,nestjs,',
          ),
        );

        expect(prismaMock.course.upsert).toHaveBeenCalledOnce();
        expect(upsertedCourse().create.title).toBe('Primera');
        expect(result.data.status).toBe(ImportStatus.PARTIAL);
        expect(result.data.errors).toEqual([
          {
            row: 3,
            slug: 'nest-pro',
            message: 'slug duplicado, ya definido en la fila 2',
          },
          {
            row: 4,
            slug: 'nest-pro',
            message: 'slug duplicado, ya definido en la fila 2',
          },
        ]);
      });

      it('skips unchanged courses and counts created and updated ones', async () => {
        const stored = {
          title: 'A',
          url: 'https://example.com/a',
          description: null,
          level: 1,
          durationHours: null,
          status: CourseStatus.ACTIVE,
          skills: [{ skill: SkillCategory.BACKEND, weight: 1 }],
        };
        prismaMock.course.findMany.mockResolvedValue([
          { slug: 'same', ...stored },
          { slug: 'changed', ...stored },
        ]);

        const result = await service.importFromCsv(
          csv(
            'same,A,https://example.com/a,,beginner,node,',
            'changed,A,https://example.com/a,,beginner,"node,react",',
            'new,A,https://example.com/a,,beginner,node,',
          ),
        );

        expect(prismaMock.course.findMany).toHaveBeenCalledExactlyOnceWith(
          expect.objectContaining({
            where: { slug: { in: ['same', 'changed', 'new'] } },
          }),
        );
        expect(
          prismaMock.course.upsert.mock.calls.map(([args]) => args.where.slug),
        ).toEqual(['changed', 'new']);
        expect(result.data).toMatchObject({
          status: ImportStatus.SUCCESS,
          created: 1,
          updated: 1,
          unchanged: 1,
        });
        expect(importUpdate().data).toMatchObject({ created: 1, updated: 1 });
      });
    });
  });

  describe('findAll', () => {
    const select = {
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
    };

    it('uses page 1 and limit 20 by default and lists only ACTIVE courses', async () => {
      const courses = [{ id: 'c-1', slug: 'nest-pro', skills: [] }];
      prismaMock.course.count.mockResolvedValue(45);
      prismaMock.course.findMany.mockResolvedValue(courses);

      const result = await service.findAll({});

      const where = { status: CourseStatus.ACTIVE };
      expect(prismaMock.course.count).toHaveBeenCalledExactlyOnceWith({
        where,
      });
      expect(prismaMock.course.findMany).toHaveBeenCalledExactlyOnceWith({
        where,
        orderBy: [{ level: 'asc' }, { title: 'asc' }],
        skip: 0,
        take: 20,
        select,
      });
      expect(result).toEqual({
        data: courses,
        meta: { total: 45, page: 1, limit: 20, totalPages: 3 },
      });
    });

    it('computes skip and totalPages from page and limit', async () => {
      prismaMock.course.count.mockResolvedValue(12);
      prismaMock.course.findMany.mockResolvedValue([]);

      const result = await service.findAll({ page: 3, limit: 5 });

      expect(prismaMock.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 5 }),
      );
      expect(result.meta).toEqual({
        total: 12,
        page: 3,
        limit: 5,
        totalPages: 3,
      });
    });

    it('filters by level and skill', async () => {
      prismaMock.course.count.mockResolvedValue(0);
      prismaMock.course.findMany.mockResolvedValue([]);

      await service.findAll({ level: 2, skill: SkillCategory.BACKEND });

      const where = {
        status: CourseStatus.ACTIVE,
        level: 2,
        skills: { some: { skill: SkillCategory.BACKEND } },
      };
      expect(prismaMock.course.count).toHaveBeenCalledExactlyOnceWith({
        where,
      });
      expect(prismaMock.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where }),
      );
    });

    it('returns totalPages 0 when there are no courses', async () => {
      prismaMock.course.count.mockResolvedValue(0);
      prismaMock.course.findMany.mockResolvedValue([]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result).toEqual({
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
      });
    });
  });
});
