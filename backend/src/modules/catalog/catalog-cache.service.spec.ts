import { describe, expect, it, vi, beforeEach, type Mock } from 'vitest';
import { CatalogCacheService, type CachedCourse } from './catalog-cache.service.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeCourse(id: string): CachedCourse {
  return {
    id,
    slug: id,
    title: id,
    description: null,
    url: `https://example.com/${id}`,
    imageUrl: null,
    level: 1,
    durationHours: 10,
    skills: [],
    prerequisites: [],
  };
}

function makePrisma(courses: CachedCourse[] = []) {
  const findMany = vi.fn().mockResolvedValue(courses);
  return {
    course: { findMany },
    _findMany: findMany as Mock,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CatalogCacheService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('fetches from DB on the first call and caches the result', async () => {
    const courses = [makeCourse('vue'), makeCourse('react')];
    const prisma = makePrisma(courses);
    const cache = new CatalogCacheService(prisma as never);

    const result = await cache.getActiveCatalog();

    expect(result).toHaveLength(2);
    expect(prisma._findMany).toHaveBeenCalledTimes(1);
  });

  it('returns cached data on subsequent calls without hitting the DB', async () => {
    const courses = [makeCourse('vue')];
    const prisma = makePrisma(courses);
    const cache = new CatalogCacheService(prisma as never);

    await cache.getActiveCatalog();
    await cache.getActiveCatalog();
    await cache.getActiveCatalog();

    // Only one DB call despite three invocations
    expect(prisma._findMany).toHaveBeenCalledTimes(1);
  });

  it('re-fetches from DB after TTL expires', async () => {
    const ttlMs = 1_000; // 1 second for test
    const courses = [makeCourse('vue')];
    const prisma = makePrisma(courses);
    const cache = new CatalogCacheService(prisma as never, ttlMs);

    await cache.getActiveCatalog();            // warm
    vi.advanceTimersByTime(ttlMs + 1);         // expire
    await cache.getActiveCatalog();            // re-fetch

    expect(prisma._findMany).toHaveBeenCalledTimes(2);
  });

  it('does NOT re-fetch before TTL expires', async () => {
    const ttlMs = 1_000;
    const prisma = makePrisma([makeCourse('vue')]);
    const cache = new CatalogCacheService(prisma as never, ttlMs);

    await cache.getActiveCatalog();
    vi.advanceTimersByTime(ttlMs - 1);        // still within TTL
    await cache.getActiveCatalog();

    expect(prisma._findMany).toHaveBeenCalledTimes(1);
  });

  it('re-fetches from DB immediately after invalidate()', async () => {
    const courses = [makeCourse('vue')];
    const prisma = makePrisma(courses);
    const ttlMs = 60_000; // long TTL so it doesn't expire naturally
    const cache = new CatalogCacheService(prisma as never, ttlMs);

    await cache.getActiveCatalog();   // warm
    cache.invalidate();               // explicit invalidation
    await cache.getActiveCatalog();   // must re-fetch

    expect(prisma._findMany).toHaveBeenCalledTimes(2);
  });

  it('returns an empty array when the catalog is empty', async () => {
    const prisma = makePrisma([]);
    const cache = new CatalogCacheService(prisma as never);

    const result = await cache.getActiveCatalog();

    expect(result).toHaveLength(0);
  });
});
