import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SkillCategory } from '../../../generated/prisma/enums.js';
import { FindCoursesQueryDto } from './find-courses-query.dto.js';
import { ImportCatalogDto } from './import-catalog.dto.js';

const invalidProperties = async (value: object): Promise<string[]> =>
  (await validate(plainToInstance(FindCoursesQueryDto, value))).map(
    ({ property }) => property,
  );

describe('catalog DTOs', () => {
  describe('FindCoursesQueryDto', () => {
    it('accepts an empty query because every filter has a service default', async () => {
      await expect(invalidProperties({})).resolves.toEqual([]);
    });

    it('transforms numeric query strings and accepts enum skills', async () => {
      const dto = plainToInstance(FindCoursesQueryDto, {
        page: '2',
        limit: '100',
        level: '3',
        skill: SkillCategory.BACKEND,
      });

      await expect(validate(dto)).resolves.toEqual([]);
      expect(dto).toMatchObject({
        page: 2,
        limit: 100,
        level: 3,
        skill: SkillCategory.BACKEND,
      });
    });

    it.each([
      [{ page: '0' }, 'page'],
      [{ page: '1.5' }, 'page'],
      [{ limit: '0' }, 'limit'],
      [{ limit: '101' }, 'limit'],
      [{ limit: 'not-a-number' }, 'limit'],
      [{ level: '0' }, 'level'],
      [{ level: '4' }, 'level'],
      [{ skill: 'UNKNOWN' }, 'skill'],
    ])('rejects out-of-contract query %j', async (query, property) => {
      await expect(invalidProperties(query)).resolves.toContain(property);
    });
  });

  describe('ImportCatalogDto', () => {
    it.each([{}, { csv: '' }, { csv: 'slug,title' }])(
      'accepts optional string input %j',
      async (value) => {
        const errors = await validate(plainToInstance(ImportCatalogDto, value));

        expect(errors).toEqual([]);
      },
    );

    it.each([{ csv: 123 }, { csv: {} }, { csv: ['row'] }])(
      'rejects non-string CSV input %j',
      async (value) => {
        const errors = await validate(plainToInstance(ImportCatalogDto, value));

        expect(errors.map(({ property }) => property)).toEqual(['csv']);
      },
    );
  });
});
