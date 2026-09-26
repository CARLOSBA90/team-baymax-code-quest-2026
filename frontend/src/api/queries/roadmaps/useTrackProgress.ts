import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { trackItemCompletion } from "@/api/services";
import { isRoadmapNotFoundError, shouldRefreshAfterTrackError } from "@/lib";
import type { RoadmapDetail, TrackProgressResult } from "@/types";
import { roadmapsKeys } from "./keys";
import { applyTrackProgressResult } from "./roadmaps-cache";

export interface TrackItemCompletionOutcome {
  result: TrackProgressResult;
  /** Detalle en caché al terminar (refrescado o parcheado); `undefined` si no hay entrada. */
  detail: RoadmapDetail | undefined;
  /** `false` si el refetch del detalle tras el 200 falló. */
  detailRefreshed: boolean;
}

type RefreshOutcome = { ok: true } | { ok: false; error: unknown };

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
): UseMutationResult<TrackItemCompletionOutcome, Error, string> {
  const queryClient = useQueryClient();
  const detailKey = roadmapsKeys.detail(roadmapId);

  const refreshDetail = async (): Promise<RefreshOutcome> => {
    try {
      await queryClient.invalidateQueries(
        { queryKey: detailKey, exact: true },
        { throwOnError: true },
      );
      return { ok: true };
    } catch (error) {
      return { ok: false, error };
    }
  };

  const invalidateList = () => {
    // Sin await: la pill y Mis Rutas se actualizan en segundo plano.
    void queryClient.invalidateQueries({ queryKey: roadmapsKeys.list() });
  };

  return useMutation<TrackItemCompletionOutcome, Error, string>({
    mutationKey: [...roadmapsKeys.all, "track", roadmapId],
    mutationFn: async (roadmapItemId) => {
      let result: TrackProgressResult;
      try {
        result = await trackItemCompletion(roadmapItemId);
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
          (old) => old && applyTrackProgressResult(old, roadmapItemId, result),
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
