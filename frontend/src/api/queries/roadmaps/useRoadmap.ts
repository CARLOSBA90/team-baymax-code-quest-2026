import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { getRoadmap } from "@/api/services";
import type { RoadmapDetail } from "@/types";
import { roadmapsKeys } from "./keys";
import { ROADMAPS_STALE_TIME } from "./useRoadmaps";

// Una entrada de caché por id, colgada de roadmapsKeys.all: cualquier invalidación de rutas
// (enviar el cuestionario, borrar) también la marca. Con id vacío (param ausente) no pide nada.
export function useRoadmap(id: string): UseQueryResult<RoadmapDetail> {
  return useQuery({
    queryKey: roadmapsKeys.detail(id),
    queryFn: () => getRoadmap(id),
    staleTime: ROADMAPS_STALE_TIME,
    enabled: id !== "",
  });
}
