import { BadRequestException } from '@nestjs/common';
import { CsvCatalogAdapter } from './csv.adapter.js';

const HEADER = 'slug,title,url,description,level,tags,durationHours,imageUrl';

describe('CsvCatalogAdapter', () => {
  it('parses a BOM, trims unquoted fields, and preserves quoted CSV content', async () => {
    const content = [
      `\uFEFF ${HEADER}`,
      ' nest-pro ,"Nest, Pro", https://example.com/nest ,"Dice ""hola""", intermediate ,"nestjs,typescript", 20 , https://example.com/nest.png ',
    ].join('\n');

    await expect(
      new CsvCatalogAdapter(content).fetchCourses(),
    ).resolves.toEqual([
      {
        row: 2,
        slug: 'nest-pro',
        title: 'Nest, Pro',
        url: 'https://example.com/nest',
        description: 'Dice "hola"',
        level: 'intermediate',
        tags: 'nestjs,typescript',
        durationHours: '20',
        imageUrl: 'https://example.com/nest.png',
      },
    ]);
  });

  it('accepts only the required columns and defaults optional fields to empty strings', async () => {
    const content = [
      'slug,title,url,level,tags',
      'node,Node,https://example.com/node,beginner,node',
    ].join('\n');

    await expect(
      new CsvCatalogAdapter(content).fetchCourses(),
    ).resolves.toEqual([
      {
        row: 2,
        slug: 'node',
        title: 'Node',
        url: 'https://example.com/node',
        description: '',
        level: 'beginner',
        tags: 'node',
        durationHours: '',
        imageUrl: '',
      },
    ]);
  });

  it('skips empty lines and numbers the returned records from the header', async () => {
    const content = [
      HEADER,
      '',
      'first,First,https://example.com/first,,beginner,node,1',
      '',
      'second,Second,https://example.com/second,,advanced,react,2',
    ].join('\n');

    const courses = await new CsvCatalogAdapter(content).fetchCourses();

    expect(courses.map(({ row, slug }) => ({ row, slug }))).toEqual([
      { row: 2, slug: 'first' },
      { row: 3, slug: 'second' },
    ]);
  });

  it('reports every missing required column in its original required order', async () => {
    const adapter = new CsvCatalogAdapter(' title , description\nCurso,Texto');

    await expect(adapter.fetchCourses()).rejects.toThrow(
      new BadRequestException(
        'Faltan columnas obligatorias en el CSV: slug, url, level, tags',
      ),
    );
  });

  it('converts malformed CSV syntax into a BadRequestException', async () => {
    const adapter = new CsvCatalogAdapter(
      `${HEADER}\nbroken,"unterminated,https://example.com,,beginner,node,1`,
    );

    await expect(adapter.fetchCourses()).rejects.toSatisfy(
      (error: unknown) =>
        error instanceof BadRequestException &&
        error.message.startsWith('El CSV no es válido:'),
    );
  });
});
