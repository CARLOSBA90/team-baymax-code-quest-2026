import { LessonType } from '../../../generated/prisma/enums.js';
import { toLessonRows } from './syllabus.importer.js';

describe('toLessonRows', () => {
  it('numbers lessons across sections and maps the scraped types', () => {
    expect(
      toLessonRows({
        slug: 'nest',
        temario: [
          {
            titulo: 'Sección 1: Introducción',
            lecciones: [
              { titulo: 'Bienvenida', tipo: 'VIDEO', pruebaGratis: true },
              { titulo: '  ', tipo: 'VIDEO' },
              { titulo: 'Notas', tipo: 'TEXTO' },
            ],
          },
          {
            titulo: 'Sección 2: Módulos',
            lecciones: [{ titulo: 'Quiz', tipo: 'OTRO' }],
          },
        ],
      }),
    ).toEqual([
      {
        sectionOrder: 1,
        sectionTitle: 'Sección 1: Introducción',
        order: 1,
        title: 'Bienvenida',
        type: LessonType.VIDEO,
        freePreview: true,
      },
      {
        sectionOrder: 1,
        sectionTitle: 'Sección 1: Introducción',
        order: 2,
        title: 'Notas',
        type: LessonType.TEXT,
        freePreview: false,
      },
      {
        sectionOrder: 2,
        sectionTitle: 'Sección 2: Módulos',
        order: 3,
        title: 'Quiz',
        type: LessonType.OTHER,
        freePreview: false,
      },
    ]);
  });
});
