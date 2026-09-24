import { Prisma } from '../../../generated/prisma/client.js';
import {
  PROGRESS_MAX_PERCENTAGE,
  PROGRESS_MIN_PERCENTAGE,
  RoadmapStatus,
} from '../roadmap.constants.js';

/**
 * One row per roadmap of the user with its derived status, computed in SQL so
 * the list can be filtered, counted and paginated by the database. It mirrors
 * aggregateRoadmapProgress: no items → NOT_STARTED; every item at 100 →
 * COMPLETED; paused → PAUSED; every item at 0 → NOT_STARTED; else IN_PROGRESS.
 * An item without a progress row counts as 0, as in the mapper.
 */
export function roadmapStatusRows(userId: string): Prisma.Sql {
  const percentage = Prisma.sql`COALESCE(p."percentage", ${PROGRESS_MIN_PERCENTAGE})`;
  return Prisma.sql`
    SELECT
      r."id",
      r."createdAt",
      CASE
        WHEN COUNT(i."id") = 0 THEN ${RoadmapStatus.NOT_STARTED}
        WHEN BOOL_AND(${percentage} = ${PROGRESS_MAX_PERCENTAGE}) THEN ${RoadmapStatus.COMPLETED}
        WHEN r."pausedAt" IS NOT NULL THEN ${RoadmapStatus.PAUSED}
        WHEN BOOL_AND(${percentage} = ${PROGRESS_MIN_PERCENTAGE}) THEN ${RoadmapStatus.NOT_STARTED}
        ELSE ${RoadmapStatus.IN_PROGRESS}
      END AS "status"
    FROM "roadmap" r
    LEFT JOIN "roadmap_item" i ON i."roadmapId" = r."id"
    LEFT JOIN "progress" p ON p."roadmapItemId" = i."id"
    WHERE r."userId" = ${userId}
    GROUP BY r."id"`;
}
