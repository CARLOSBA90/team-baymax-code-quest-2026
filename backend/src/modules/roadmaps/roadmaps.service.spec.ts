import type { PrismaService } from '../../prisma/prisma.service.js';
import { RoadmapStatus } from './roadmap.constants.js';
import { RoadmapsService } from './roadmaps.service.js';

const summary = (id: string, percentages: number[]) => ({
  id,
  title: `Ruta ${id}`,
  pausedAt: null,
  lastActivityAt: new Date('2026-09-24T00:00:00.000Z'),
  activityVersion: 0,
  items: percentages.map((percentage) => ({
    type: 'COURSE',
    level: 1,
    progress: { percentage },
  })),
});

function setup(pageIds: string[]) {
  const queryRaw = vi
    .fn()
    .mockResolvedValueOnce([
      { status: RoadmapStatus.NOT_STARTED, total: 3 },
      { status: RoadmapStatus.IN_PROGRESS, total: 2 },
    ])
    .mockResolvedValueOnce(pageIds.map((id) => ({ id })));
  const findMany = vi
    .fn()
    .mockResolvedValue(
      [...pageIds].reverse().map((id) => summary(id, id === 'r2' ? [50] : [0])),
    );
  const prisma = { $queryRaw: queryRaw, roadmap: { findMany } };
  return {
    service: new RoadmapsService(prisma as unknown as PrismaService),
    queryRaw,
    findMany,
  };
}

/** Values bound to the Prisma.sql page query (LIMIT/OFFSET/status). */
const pageValues = (queryRaw: ReturnType<typeof vi.fn>) =>
  queryRaw.mock.calls[1]
    .slice(1)
    .flatMap((value: unknown) =>
      value && typeof value === 'object' && 'values' in value
        ? (value as { values: unknown[] }).values
        : [value],
    );

describe('RoadmapsService.findAll', () => {
  it('counts and paginates in the database, loading only the page', async () => {
    const { service, queryRaw, findMany } = setup(['r2', 'r1']);

    const result = await service.findAll('user-1', { page: 2, limit: 2 });

    expect(queryRaw).toHaveBeenCalledTimes(2);
    expect(pageValues(queryRaw)).toEqual(expect.arrayContaining([2]));
    expect(pageValues(queryRaw)).toContain(2);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: ['r2', 'r1'] } } }),
    );
    expect(findMany.mock.calls[0][0].select.items.select).not.toHaveProperty(
      'contentData',
    );
    expect(result.data.map((roadmap) => roadmap.id)).toEqual(['r2', 'r1']);
    expect(result.data[0]?.status).toBe(RoadmapStatus.IN_PROGRESS);
    expect(result.meta).toEqual({ total: 5, page: 2, limit: 2, totalPages: 3 });
    expect(result.counts).toEqual({
      all: 5,
      notStarted: 3,
      inProgress: 2,
      paused: 0,
      completed: 0,
    });
  });

  it('uses the status count as total when filtering', async () => {
    const { service } = setup(['r2']);

    const result = await service.findAll('user-1', {
      page: 1,
      limit: 10,
      status: RoadmapStatus.IN_PROGRESS,
    });

    expect(result.meta).toEqual({
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
  });

  it('keeps the list contract the frontend consumes', async () => {
    const { service } = setup(['r1']);

    const result = await service.findAll('user-1', { page: 1, limit: 100 });

    // Roadmap fields in snake_case; meta and counts in camelCase.
    expect(Object.keys(result.data[0]!).sort()).toEqual(
      [
        'activity_version',
        'id',
        'last_activity',
        'level',
        'name',
        'paused_at',
        'progress',
        'status',
        'total_courses',
        'total_items',
      ].sort(),
    );
    expect(result.data[0]).toMatchObject({
      level: 'beginner',
      total_courses: 1,
      total_items: 1,
      paused_at: null,
      last_activity: '2026-09-24T00:00:00.000Z',
    });
    expect(Object.keys(result.meta)).toEqual([
      'total',
      'page',
      'limit',
      'totalPages',
    ]);
    expect(Object.keys(result.counts)).toEqual([
      'all',
      'notStarted',
      'inProgress',
      'paused',
      'completed',
    ]);
  });

  it('returns an empty list with zero counts for a user without roadmaps', async () => {
    const queryRaw = vi.fn().mockResolvedValue([]);
    const findMany = vi.fn();
    const service = new RoadmapsService({
      $queryRaw: queryRaw,
      roadmap: { findMany },
    } as unknown as PrismaService);

    const result = await service.findAll('user-1', { page: 1, limit: 100 });

    expect(result).toEqual({
      data: [],
      meta: { total: 0, page: 1, limit: 100, totalPages: 0 },
      counts: { all: 0, notStarted: 0, inProgress: 0, paused: 0, completed: 0 },
    });
    expect(findMany).not.toHaveBeenCalled();
  });

  it('skips loading roadmaps when the page is empty', async () => {
    const { service, findMany } = setup([]);

    const result = await service.findAll('user-1', { page: 9, limit: 10 });

    expect(findMany).not.toHaveBeenCalled();
    expect(result.data).toEqual([]);
  });
});
