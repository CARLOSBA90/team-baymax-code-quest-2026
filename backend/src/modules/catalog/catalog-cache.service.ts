import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import {
  CourseStatus,
  type PrerequisiteType,
  type SkillCategory,
} from '../../generated/prisma/enums.js';
import { PrismaService } from '../../prisma/prisma.service.js';

export const CATALOG_CACHE_TTL = 'CATALOG_CACHE_TTL';

/**
 * Shape of a cached course entry.
 *
 * Mirrors the fields projected by `roadmap-generation.service.ts`
 * when it calls `course.findMany` so that the two are interchangeable.
 */
export interface CachedCourse {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  url: string;
  imageUrl: string | null;
  level: number;
  durationHours: number | null;
  skills: Array<{ skill: SkillCategory; weight: number }>;
  prerequisites: Array<{ prerequisiteCourseId: string; type: PrerequisiteType }>;
}

/** Default TTL: 15 minutes in milliseconds. */
const DEFAULT_TTL_MS = 15 * 60 * 1_000;

/**
 * In-memory cache for the active course catalog.
 *
 * After the first request the list of active courses (with their skills and
 * prerequisites) is kept in RAM for up to `ttlMs` milliseconds.  Subsequent
 * roadmap-generation calls receive the cached list without touching the
 * database, reducing latency to ~0 ms for the catalog query.
 *
 * The cache is invalidated:
 *  - Automatically when the TTL expires.
 *  - Explicitly via `invalidate()` when a catalog import or course
 *    deactivation mutates the data.
 */
@Injectable()
export class CatalogCacheService {
  private readonly logger = new Logger(CatalogCacheService.name);

  private cachedCourses: CachedCourse[] | null = null;
  private expiresAt: number = 0;
  private readonly ttlMs: number;

  constructor(
    private readonly prisma: PrismaService,
    @Optional() @Inject(CATALOG_CACHE_TTL) ttlMs?: number,
  ) {
    this.ttlMs = ttlMs ?? DEFAULT_TTL_MS;
  }

  /**
   * Returns the active course catalog from memory if the cache is warm,
   * or fetches it from the database (and warms the cache) otherwise.
   */
  async getActiveCatalog(): Promise<CachedCourse[]> {
    if (this.cachedCourses !== null && Date.now() < this.expiresAt) {
      return this.cachedCourses;
    }
    return this.refresh();
  }

  /**
   * Invalidates the in-memory cache so the next call to `getActiveCatalog`
   * will re-fetch from the database.
   *
   * Call this after any operation that mutates the catalog (CSV import,
   * course deactivation, etc.).
   */
  invalidate(): void {
    this.cachedCourses = null;
    this.expiresAt = 0;
    this.logger.log('Catalog cache invalidated');
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private async refresh(): Promise<CachedCourse[]> {
    const courses = await this.prisma.course.findMany({
      where: { status: CourseStatus.ACTIVE },
      include: { skills: true, prerequisites: true },
      orderBy: { id: 'asc' },
    });

    this.cachedCourses = courses as unknown as CachedCourse[];
    this.expiresAt = Date.now() + this.ttlMs;
    this.logger.debug(
      `Catalog cache refreshed: ${courses.length} active courses (TTL ${this.ttlMs / 1_000}s)`,
    );
    return this.cachedCourses;
  }
}
