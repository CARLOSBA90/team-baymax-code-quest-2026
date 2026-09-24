import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { getRoadmaps } from "@/api/services";
import type { RoadmapsListResult } from "@/types";
import { roadmapsKeys } from "./keys";

// Una sola entrada de caché para toda la app: la página (cualquier filtro) y la pill del
// sidebar comparten la misma petición; el filtro por estado se aplica en memoria.
export function useRoadmaps(): UseQueryResult<RoadmapsListResult> {
  return useQuery({ queryKey: roadmapsKeys.list(), queryFn: () => getRoadmaps() });
}
