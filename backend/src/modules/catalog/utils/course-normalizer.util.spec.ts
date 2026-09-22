import {
  CourseStatus,
  SkillCategory,
} from '../../../generated/prisma/enums.js';
import type { RawCourse } from '../ingestion/catalog-ingestion.interface.js';
import type { NormalizedCourse } from '../types/catalog.types.js';
import {
  hasCourseChanges,
  normalizeCourse,
  normalizeSlug,
  normalizeTags,
} from './course-normalizer.util.js';

const rawCourse = (overrides: Partial<RawCourse> = {}): RawCourse => ({
  row: 2,
  slug: 'nest-pro',
  title: 'Nest Pro',
  url: 'https://example.com/nest',
  description: 'Curso de Nest',
  level: 'intermediate',
  tags: 'nestjs,typescript',
  durationHours: '20',
  imageUrl: 'https://example.com/nest.png',
  ...overrides,
});

const normalizedCourse = (
  overrides: Partial<NormalizedCourse> = {},
): NormalizedCourse => ({
  slug: 'nest-pro',
  title: 'Nest Pro',
  url: 'https://example.com/nest',
  description: 'Curso de Nest',
  imageUrl: 'https://example.com/nest.png',
  level: 2,
  durationHours: 20,
  status: CourseStatus.ACTIVE,
  skills: [
    { skill: SkillCategory.BACKEND, weight: 0.5 },
    { skill: SkillCategory.WEB_FUNDAMENTALS, weight: 0.5 },
  ],
  ...overrides,
});

describe('course normalizer', () => {
  describe('normalizeSlug', () => {
    it.each([
      [' Ingeniería_de_Prompts ', 'ingenieria-de-prompts'],
      ['ÁNGULAR_SOCKET_BUN', 'angular-socket-bun'],
      ['already-normalized-2', 'already-normalized-2'],
    ])('normalizes %j to %j', (input, expected) => {
      expect(normalizeSlug(input)).toBe(expected);
    });
  });

  describe('normalizeTags', () => {
    it('deduplicates tags and weights recognized skills deterministically', () => {
      expect(
        normalizeTags(
          ' node, NESTJS, react, typescript, unknown, NODE, postgres ',
        ),
      ).toEqual([
        { skill: SkillCategory.BACKEND, weight: 0.4 },
        { skill: SkillCategory.DATABASES, weight: 0.2 },
        { skill: SkillCategory.FRONTEND, weight: 0.2 },
        { skill: SkillCategory.WEB_FUNDAMENTALS, weight: 0.2 },
      ]);
    });

    it.each(['', '  , , ', 'cobol,mainframe'])(
      'returns no skills when no tag is recognized (%j)',
      (tags) => {
        expect(normalizeTags(tags)).toEqual([]);
      },
    );
  });

  describe('normalizeCourse', () => {
    it('trims fields, maps optional blanks to null, and accepts the minimum duration', () => {
      const result = normalizeCourse(
        rawCourse({
          slug: ' Ángular_Básico ',
          title: ' Angular Básico ',
          url: ' https://example.com/angular ',
          description: '   ',
          level: ' BEGINNER ',
          tags: ' angular ',
          durationHours: ' 1 ',
          imageUrl: '   ',
        }),
      );

      expect(result).toEqual({
        ok: true,
        course: {
          slug: 'angular-basico',
          title: 'Angular Básico',
          url: 'https://example.com/angular',
          description: null,
          imageUrl: null,
          level: 1,
          durationHours: 1,
          status: CourseStatus.ACTIVE,
          skills: [{ skill: SkillCategory.FRONTEND, weight: 1 }],
        },
      });
    });

    it('marks a valid course without recognized tags for manual review', () => {
      const result = normalizeCourse(rawCourse({ tags: 'cobol,mainframe' }));

      expect(result).toMatchObject({
        ok: true,
        course: { status: CourseStatus.PENDING_REVIEW, skills: [] },
      });
    });

    it.each(['0', '-1', '1.5', '01', 'abc'])(
      'treats invalid durationHours %j as absent',
      (durationHours) => {
        expect(normalizeCourse(rawCourse({ durationHours }))).toEqual({
          ok: true,
          course: normalizedCourse({ durationHours: null }),
        });
      },
    );

    it.each(['ftp://example.com/course', 'example.com/course', 'not a url'])(
      'rejects non-HTTP URL %j',
      (url) => {
        expect(normalizeCourse(rawCourse({ url }))).toEqual({
          ok: false,
          problems: ['url debe ser una URL http o https'],
        });
      },
    );

    it.each(['ftp://example.com/cover.png', 'cover.png', 'not a url', '  '])(
      'treats non-HTTP imageUrl %j as absent',
      (imageUrl) => {
        expect(normalizeCourse(rawCourse({ imageUrl }))).toEqual({
          ok: true,
          course: normalizedCourse({ imageUrl: null }),
        });
      },
    );

    it('returns all row problems so an importer can report them together', () => {
      const result = normalizeCourse(
        rawCourse({
          slug: 'invalid slug',
          title: ' ',
          url: 'mailto:test@example.com',
          level: 'expert',
          durationHours: '-3',
        }),
      );

      expect(result).toEqual({
        ok: false,
        problems: [
          'slug vacío o inválido (solo minúsculas, números y guiones)',
          'title es obligatorio',
          'url debe ser una URL http o https',
          'level debe ser beginner, intermediate o advanced',
        ],
      });
    });
  });

  describe('hasCourseChanges', () => {
    it('ignores the order of otherwise identical skills', () => {
      const stored = normalizedCourse();
      const incoming = normalizedCourse({
        skills: [...stored.skills].reverse(),
      });

      expect(hasCourseChanges(stored, incoming)).toBe(false);
    });

    it.each([
      ['title', 'Nest Avanzado'],
      ['url', 'https://example.com/new'],
      ['description', null],
      ['imageUrl', null],
      ['level', 3],
      ['durationHours', null],
      ['status', CourseStatus.INACTIVE],
    ] as const)('detects a changed %s field', (field, value) => {
      const stored = normalizedCourse();
      const incoming = normalizedCourse({ [field]: value });

      expect(hasCourseChanges(stored, incoming)).toBe(true);
    });

    it('detects skill weight changes', () => {
      const stored = normalizedCourse();
      const incoming = normalizedCourse({
        skills: [
          { skill: SkillCategory.BACKEND, weight: 0.75 },
          { skill: SkillCategory.WEB_FUNDAMENTALS, weight: 0.25 },
        ],
      });

      expect(hasCourseChanges(stored, incoming)).toBe(true);
    });
  });
});
