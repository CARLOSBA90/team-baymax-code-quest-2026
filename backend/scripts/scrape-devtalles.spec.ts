const fsMocks = vi.hoisted(() => ({
  access: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined),
  readFile: vi
    .fn()
    .mockResolvedValue(
      '<meta property="og:url" content="https://cursos.devtalles.com/courses/fixture">',
    ),
  writeFile: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('node:fs/promises', () => fsMocks);

describe('scrape-devtalles pure transformations', () => {
  let scraper: typeof import('./scrape-devtalles.js');
  let logSpy: ReturnType<typeof vi.spyOn>;
  const originalArgv = process.argv;

  beforeAll(async () => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    process.argv = ['node', 'scrape-devtalles.ts', '--local', 'fixture.html'];

    scraper = await import('./scrape-devtalles.js');
    await vi.waitFor(() => {
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('CSV:'));
    });
    process.argv = originalArgv;
  });

  afterAll(() => {
    process.argv = originalArgv;
    logSpy.mockRestore();
  });

  const course = (
    overrides: Partial<import('./scrape-devtalles.js').Curso> = {},
  ): import('./scrape-devtalles.js').Curso => ({
    slug: 'curso-pro',
    urlCurso: 'https://example.com/course',
    titulo: 'Curso Pro',
    descripcion: 'Descripción',
    descripcionLarga: 'Descripción larga',
    imagenUrl: null,
    tecnologias: ['Node.js', 'React'],
    requisitos: [],
    cantidadLecciones: 10,
    duracionHoras: 12,
    instructor: 'Instructor',
    precioUsd: 20,
    esGratuito: false,
    nivel: 'AVANZADO',
    rutaOficial: null,
    temario: [],
    ...overrides,
  });

  it('extracts unique canonical course URLs from a listing', () => {
    const html = `
      <a href="/courses/nest-pro">Nest</a>
      <a href="https://cursos.devtalles.com/courses/react?ref=home">React</a>
      <a href="/courses/nest-pro#temario">Nest duplicate</a>
      <a href="/pages/about">About</a>
    `;

    expect(scraper.parseListado(html)).toEqual([
      'https://cursos.devtalles.com/courses/nest-pro',
      'https://cursos.devtalles.com/courses/react',
    ]);
  });

  it('normalizes, filters, and deduplicates technology tags', () => {
    expect(
      scraper.tagsDeCurso(
        course({
          tecnologias: [
            'Node.js',
            'React Native',
            'VITEST',
            'unknown',
            'node js',
          ],
        }),
      ),
    ).toEqual(['node', 'react-native', 'vitest']);
  });

  it('escapes CSV fields and rounds duration to a whole hour', () => {
    expect(
      scraper.cursoACsv(
        course({
          titulo: 'Curso "Pro"',
          descripcion: 'Primera línea, segunda',
          duracionHoras: 12.6,
        }),
      ),
    ).toBe(
      'curso-pro,"Curso ""Pro""",https://example.com/course,"Primera línea, segunda",advanced,"node,react",13',
    );
  });

  it('parses a course and removes embedded style and subtitle text from its title', () => {
    const html = `
      <meta property="og:image" content="https://example.com/course.png">
      <meta name="keywords" content="NestJS, TypeScript">
      <section class="banner--course">
        <h2 class="section__heading">
          <style>.hidden { display: none; }</style>
          <span class="devtalles-course-subtitle">CURSO GRATUITO</span>
          Nest Pro
        </h2>
        <p class="section__subheading">Arquitectura avanzada</p>
      </section>
      <section class="course-curriculum-card__details">
        <li class="course-curriculum-card__details-item"><span>$19.99</span></li>
        <li class="course-curriculum-card__details-item"><span>24 lecciones</span></li>
        <li class="course-curriculum-card__details-item"><span>12,5 horas</span></li>
        <li class="course-curriculum-card__details-item"><span>Fernando Herrera</span></li>
      </section>
      <div class="spec-column-clean">
        <h3 class="spec-column-title">Requisitos previos</h3>
        TypeScript básico
      </div>
      <div class="spec-column-clean">
        <h3 class="spec-column-title">Descripción del curso</h3>
        Aprende Nest de extremo a extremo
      </div>
      <li class="course-curriculum__chapter">
        <h3 class="course-curriculum__chapter-title">Introducción</h3>
        <ol class="course-curriculum__chapter-content">
          <li><i class="toga-icon content-video"></i><span class="course-curriculum__lesson-title">Bienvenida</span></li>
          <li><i class="toga-icon content-text"></i><span class="course-curriculum__lesson-title">Notas</span></li>
        </ol>
      </li>
      <a href="/pages/ruta-nest">Ver ruta</a>
    `;

    expect(
      scraper.parseCurso(
        html,
        'https://cursos.devtalles.com/courses/nest-pro?campaign=test',
      ),
    ).toMatchObject({
      slug: 'nest-pro',
      titulo: 'Nest Pro',
      descripcion: 'Arquitectura avanzada',
      imagenUrl: 'https://example.com/course.png',
      tecnologias: ['NestJS', 'TypeScript'],
      requisitos: ['TypeScript básico'],
      descripcionLarga: 'Aprende Nest de extremo a extremo',
      cantidadLecciones: 24,
      duracionHoras: 12.5,
      instructor: 'Fernando Herrera',
      precioUsd: 19.99,
      esGratuito: false,
      nivel: 'AVANZADO',
      rutaOficial: 'https://cursos.devtalles.com/pages/ruta-nest',
      temario: [
        {
          titulo: 'Introducción',
          lecciones: [
            { titulo: 'Bienvenida', tipo: 'VIDEO' },
            { titulo: 'Notas', tipo: 'TEXTO' },
          ],
        },
      ],
    });
  });

  it('applies route labels in DOM order and ignores duplicate courses', () => {
    const html = `
      <main>
        <h2>RECOMENDADO</h2>
        <a href="/courses/nest">Nest</a>
        <a href="/courses/nest?duplicate=true">Nest duplicate</a>
        <h2>OPCIONAL PERO MUY ÚTIL</h2>
        <a href="https://cursos.devtalles.com/courses/docker">Docker</a>
      </main>
    `;

    expect(
      scraper.parseRuta(
        html,
        'backend',
        'https://cursos.devtalles.com/pages/ruta-backend',
      ),
    ).toEqual({
      codigo: 'backend',
      url: 'https://cursos.devtalles.com/pages/ruta-backend',
      cursos: [
        { slug: 'nest', tipo: 'RECOMENDADO', orden: 1 },
        { slug: 'docker', tipo: 'OPCIONAL PERO MUY ÚTIL', orden: 2 },
      ],
    });
  });
});
