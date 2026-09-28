import type { SkillCategory } from '../../../generated/prisma/enums.js';
import { UNIQUE_MATCH_COUNT } from '../roadmap.constants.js';

const TERMS: Readonly<Record<SkillCategory, readonly string[]>> = {
  BACKEND: [
    'backend',
    'api',
    'apis',
    'servidor',
    'nest',
    'nestjs',
    'node',
    'nodejs',
    'python',
    'fastapi',
    'django',
    'java',
    'spring',
    'springboot',
    'csharp',
    'dotnet',
    'net',
    'golang',
    'go',
  ],
  FRONTEND: [
    'frontend',
    'interfaz',
    'react',
    'nextjs',
    'next',
    'angular',
    'vue',
    'nuxt',
    'astro',
    'qwik',
    'blazor',
  ],
  DEVOPS: ['devops', 'docker', 'despliegue', 'ci/cd', 'kubernetes', 'aws'],
  DATABASES: ['base de datos', 'sql', 'postgres', 'postgresql', 'database', 'mongodb', 'mysql'],
  MOBILE: [
    'movil',
    'moviles',
    'mobile',
    'flutter',
    'dart',
    'react native',
    'expo',
    'android',
    'ios',
  ],
  TESTING: ['testing', 'pruebas', 'test automatizado', 'jest', 'vitest'],
  WEB_FUNDAMENTALS: ['fundamentos web', 'html', 'css', 'javascript', 'web'],
};

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function resolveGoalCategory(description: string): SkillCategory | null {
  const normalized = normalize(description);
  const matches = (
    Object.entries(TERMS) as [SkillCategory, readonly string[]][]
  )
    .filter(([, terms]) =>
      terms.some((term) => {
        const escaped = normalize(term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i').test(
          normalized,
        );
      }),
    )
    .map(([category]) => category);

  return matches.length === UNIQUE_MATCH_COUNT ? matches[0] : null;
}
