import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setRoadmapPaused } from "@/api/services";
import { shouldRefreshAfterPauseError } from "@/lib";
import type { RoadmapDetail, SetRoadmapPausedBody } from "@/types";
import { roadmapsKeys } from "./keys";
import { invalidateRoadmapsList, refreshRoadmapDetail } from "./refresh-detail";

/**
 * Pausa o reanuda la ruta `roadmapId` (`PATCH /roadmaps/:id/pause`), de forma pesimista. Todo el
 * ciclo va en el `mutationFn`:
 * - 200 → la respuesta (mismo serializer que el GET del detalle) se escribe en
 *   `roadmapsKeys.detail(roadmapId)` con `setQueryData` (sin GET extra) e invalida
 *   `roadmapsKeys.list()` sin esperar. Devuelve la entrada de la caché: si la respuesta es igual a
 *   lo cacheado (200 idempotente), el structural sharing conserva la referencia previa, y el
 *   consumidor sabe que no hay re-render que esperar (`returned === roadmap`).
 * - 404 / 409 `ROADMAP_VERSION_CONFLICT` / 409 `INVALID_ROADMAP_TRANSITION` → espera al refetch
 *   exacto del detalle, invalida la lista y relanza el error original (aunque el refetch falle).
 * - Red / 5xx / 401 / 400 / otros 409 → caché intacta y relanza.
 * Nunca invalida `roadmapsKeys.all` ni otros detalles.
 */
export function usePauseRoadmap(
  roadmapId: string,
): UseMutationResult<RoadmapDetail, Error, SetRoadmapPausedBody> {
  const queryClient = useQueryClient();
  const detailKey = roadmapsKeys.detail(roadmapId);

  return useMutation<RoadmapDetail, Error, SetRoadmapPausedBody>({
    mutationKey: [...roadmapsKeys.all, "pause", roadmapId],
    mutationFn: async (body) => {
      let detail: RoadmapDetail;
      try {
        detail = await setRoadmapPaused(roadmapId, body);
      } catch (error) {
        if (shouldRefreshAfterPauseError(error)) {
          await refreshRoadmapDetail(queryClient, roadmapId);
          invalidateRoadmapsList(queryClient);
        }
        throw error;
      }

      queryClient.setQueryData<RoadmapDetail>(detailKey, detail);
      invalidateRoadmapsList(queryClient);
      return queryClient.getQueryData<RoadmapDetail>(detailKey) ?? detail;
    },
  });
}
