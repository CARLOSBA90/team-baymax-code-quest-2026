import {
  courseReference,
  referencedCandidates,
  titlesMatch,
} from './course-references.js';

describe('course references', () => {
  it('replaces course IDs with short aliases and maps them back', () => {
    const candidates = [
      {
        id: 'cmuc2kpg80039ckl0w0yjdl56',
        title: 'Node',
        description: null,
        level: 1,
        durationHours: 2,
        skills: [],
      },
      {
        id: 'cmuc2kxf40042ckl066lalnhd',
        title: 'Nest',
        description: null,
        level: 1,
        durationHours: 2,
        skills: [],
      },
    ];

    const { byReference, promptCandidates } = referencedCandidates(candidates);

    expect(promptCandidates.map((candidate) => candidate.ref)).toEqual([
      'c1',
      'c2',
    ]);
    expect(JSON.stringify(promptCandidates)).not.toContain('cmuc2k');
    expect(byReference.get(courseReference(1))?.id).toBe(
      'cmuc2kxf40042ckl066lalnhd',
    );
  });

  it.each([
    [
      'Nest: Desarrollo backend escalable con Node',
      'Nest: Desarrollo backend escalable con Node',
      true,
    ],
    [
      'nest desarrollo backend escalable con node',
      'Nest: Desarrollo backend escalable con Node',
      true,
    ],
    ['Node.js: De cero a experto', 'Node.Js: De cero a experto', true],
    ['Introducción a React', 'Introduccion a React', true],
    [
      'Nest: Desarrollo backend',
      'Nest: Desarrollo backend escalable con Node',
      true,
    ],
    ['Nest', 'Nest + GraphQL: Evoluciona tus APIs.', false],
    [
      'Django para Python',
      'OpenAI: Ejercicios prácticos y asistentes con React + NestJS',
      false,
    ],
    ['', 'Node', false],
  ])('titlesMatch(%s, %s) is %s', (returned, expected, match) => {
    expect(titlesMatch(returned, expected)).toBe(match);
  });
});
