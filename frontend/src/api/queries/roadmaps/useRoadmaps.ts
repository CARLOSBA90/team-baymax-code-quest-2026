import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { getRoadmaps } from "@/api/services";
import type { RoadmapsListResult } from "@/types";
import { roadmapsKeys } from "./keys";

// Evita volver a pedir el listado en cada remount (navegar entre páginas del dashboard); las
// mutaciones que lo cambian (p. ej. enviar el cuestionario) invalidan roadmapsKeys.all explícitamente.
export const ROADMAPS_STALE_TIME = 30_000;

// Una sola entrada de caché para toda la app: la página (cualquier filtro) y la pill del
// sidebar comparten la misma petición; el filtro por estado se aplica en memoria.
export function useRoadmaps(): UseQueryResult<RoadmapsListResult> {
  return useQuery({
    queryKey: roadmapsKeys.list(),
    queryFn: () => getRoadmaps(),
    staleTime: ROADMAPS_STALE_TIME,
  });
}
