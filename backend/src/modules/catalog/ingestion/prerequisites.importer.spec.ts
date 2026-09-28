import { describe, expect, it, vi, type Mock } from 'vitest';
import { PrerequisiteType } from '../../../generated/prisma/enums.js';
import {
  importPrerequisites,
  type PrerequisiteEntry,
} from './prerequisites.importer.js';

function makePrisma(foundSlugs: Record<string, string>) {
  const upsert = vi.fn().mockResolvedValue({});
  const findMany = vi.fn().mockResolvedValue(
    Object.entries(foundSlugs).map(([slug, id]) => ({ slug, id })),
  );
  return {
    course: { findMany },
    coursePrerequisite: { upsert },
    _upsert: upsert as Mock,
    _findMany: findMany as Mock,
  };
}

describe('importPrerequisites', () => {
  const entries: PrerequisiteEntry[] = [
    { courseSlug: 'nuxt', prerequisiteSlug: 'vue-cero-a-experto', type: 'REQUIRED' },
    { courseSlug: 'vue-intermedio', prerequisiteSlug: 'vue-cero-a-experto', type: 'REQUIRED' },
    { courseSlug: 'django', prerequisiteSlug: 'python', type: 'REQUIRED' },
  ];

  it('upserts a prerequisite for each entry whose slugs exist', async () => {
    const slugToId: Record<string, string> = {
      nuxt: 'id-nuxt',
      'vue-cero-a-experto': 'id-vue',
      'vue-intermedio': 'id-vue-int',
      django: 'id-django',
      python: 'id-python',
    };
    const prisma = makePrisma(slugToId);

    const result = await importPrerequisites(prisma as never, entries);

    expect(result.upserted).toBe(3);
    expect(result.skipped).toHaveLength(0);
    expect(prisma._upsert).toHaveBeenCalledTimes(3);
  });

  it('skips entries whose course slug is not found in the catalog', async () => {
    // Only vue-cero-a-experto and vue-intermedio exist; nuxt and django/python do not.
    const slugToId: Record<string, string> = {
      'vue-cero-a-experto': 'id-vue',
      'vue-intermedio': 'id-vue-int',
    };
    const prisma = makePrisma(slugToId);

    const result = await importPrerequisites(prisma as never, entries);

    // nuxt → vue: nuxt not found → skip
    // vue-intermedio → vue: both found → upsert
    // django → python: neither found → skip
    expect(result.upserted).toBe(1);
    expect(result.skipped).toHaveLength(2);
    expect(result.skipped).toContain('nuxt → vue-cero-a-experto');
    expect(result.skipped).toContain('django → python');
  });

  it('passes REQUIRED type to the upsert call by default', async () => {
    const slugToId: Record<string, string> = {
      nuxt: 'id-nuxt',
      'vue-cero-a-experto': 'id-vue',
    };
    const prisma = makePrisma(slugToId);

    await importPrerequisites(prisma as never, [
      { courseSlug: 'nuxt', prerequisiteSlug: 'vue-cero-a-experto' },
    ]);

    expect(prisma._upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ type: PrerequisiteType.REQUIRED }),
      }),
    );
  });

  it('passes RECOMMENDED type when specified', async () => {
    const slugToId: Record<string, string> = {
      nuxt: 'id-nuxt',
      'vue-cero-a-experto': 'id-vue',
    };
    const prisma = makePrisma(slugToId);

    await importPrerequisites(prisma as never, [
      {
        courseSlug: 'nuxt',
        prerequisiteSlug: 'vue-cero-a-experto',
        type: 'RECOMMENDED',
      },
    ]);

    expect(prisma._upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ type: PrerequisiteType.RECOMMENDED }),
      }),
    );
  });

  it('handles an empty entries array without errors', async () => {
    const prisma = makePrisma({});

    const result = await importPrerequisites(prisma as never, []);

    expect(result.upserted).toBe(0);
    expect(result.skipped).toHaveLength(0);
  });

  it('skips self-referential entries where courseSlug === prerequisiteSlug', async () => {
    // Both sides resolve to the same ID → self-reference, must be skipped.
    const slugToId: Record<string, string> = { vue: 'id-vue' };
    const prisma = makePrisma(slugToId);

    const result = await importPrerequisites(prisma as never, [
      { courseSlug: 'vue', prerequisiteSlug: 'vue' },
    ]);

    expect(result.upserted).toBe(0);
    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0]).toContain('self-reference');
    expect(prisma._upsert).not.toHaveBeenCalled();
  });
});
