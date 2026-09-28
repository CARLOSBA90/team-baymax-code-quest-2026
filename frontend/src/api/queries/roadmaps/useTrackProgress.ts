import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { trackItemCompletion, trackLessonCompletion } from "@/api/services";
import { isRoadmapNotFoundError, shouldRefreshAfterTrackError } from "@/lib";
import type { RoadmapDetail, TrackProgressResult } from "@/types";
import { roadmapsKeys } from "./keys";
import { invalidateRoadmapsList, refreshRoadmapDetail } from "./refresh-detail";
import { applyTrackProgressResult } from "./roadmaps-cache";

/**
 * Variable de la mutación de `useTrackProgress`: completar un ítem (COMPLETION/READING,
 * irreversible) o marcar/desmarcar una lección de un ítem `LESSONS` (reversible). Una sola
 * mutación lógica «trackear progreso de esta ruta», compartida entre ambos flujos.
 */
export type TrackProgressVariables =
  | { kind: "item"; roadmapItemId: string }
  | { kind: "lesson"; roadmapItemId: string; lessonId: string; completed: boolean };

export interface TrackItemCompletionOutcome {
  result: TrackProgressResult;
  /** Detalle en caché al terminar (refrescado o parcheado); `undefined` si no hay entrada. */
  detail: RoadmapDetail | undefined;
  /** `false` si el refetch del detalle tras el 200 falló. */
  detailRefreshed: boolean;
}

/**
 * Marca un paso de la ruta `roadmapId` como completado, de forma pesimista. Todo el ciclo va en el
 * `mutationFn`, así la mutación sigue `pending` hasta que el DOM puede pintar el detalle nuevo:
 * - 200 → espera al refetch exacto de `roadmapsKeys.detail(roadmapId)`; si falla (y no es 404,
 *   que debe dejar ver «No encontramos esta ruta»), parchea el detalle con la respuesta y lo marca
 *   stale. Después invalida `roadmapsKeys.list()` sin esperar.
 * - 404 / 409 `ROADMAP_PAUSED` / 422 `TRACKING_REPORT_MISMATCH` → mismo refetch + lista y relanza.
 * - Red / 5xx / 401 / otros → caché intacta y relanza.
 * Nunca invalida `roadmapsKeys.all` (volvería a pedir el detalle) ni otros detalles.
 */
export function useTrackProgress(
  roadmapId: string,
): UseMutationResult<TrackItemCompletionOutcome, Error, TrackProgressVariables> {
  const queryClient = useQueryClient();
  const detailKey = roadmapsKeys.detail(roadmapId);

  const refreshDetail = () => refreshRoadmapDetail(queryClient, roadmapId);
  const invalidateList = () => invalidateRoadmapsList(queryClient);

  return useMutation<TrackItemCompletionOutcome, Error, TrackProgressVariables>({
    mutationKey: [...roadmapsKeys.all, "track", roadmapId],
    mutationFn: async (variables) => {
      let result: TrackProgressResult;
      try {
        result =
          variables.kind === "item"
            ? await trackItemCompletion(variables.roadmapItemId)
            : await trackLessonCompletion(
                variables.roadmapItemId,
                variables.lessonId,
                variables.completed,
              );
      } catch (error) {
        if (shouldRefreshAfterTrackError(error)) {
          await refreshDetail();
          invalidateList();
        }
        throw error;
      }

      const refresh = await refreshDetail();
      if (!refresh.ok && !isRoadmapNotFoundError(refresh.error)) {
        queryClient.setQueryData<RoadmapDetail>(
          detailKey,
          (old) => old && applyTrackProgressResult(old, variables, result),
        );
        // Marca stale sin refetch: el próximo mount/focus lo vuelve a pedir.
        void queryClient.invalidateQueries({
          queryKey: detailKey,
          exact: true,
          refetchType: "none",
        });
      }
      invalidateList();

      return {
        result,
        detail: queryClient.getQueryData<RoadmapDetail>(detailKey),
        detailRefreshed: refresh.ok,
      };
    },
  });
}
