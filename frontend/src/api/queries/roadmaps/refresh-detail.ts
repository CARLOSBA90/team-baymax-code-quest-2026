import type { QueryClient } from "@tanstack/react-query";
import { roadmapsKeys } from "./keys";

// Helpers INTERNOS de las mutaciones de roadmaps (no se exportan en el barrel; import
// `./refresh-detail`). Comparten la pieza delicada del refetch del detalle con `throwOnError`.

export type RefreshDetailOutcome = { ok: true } | { ok: false; error: unknown };

/**
 * Refetch exacto de `roadmapsKeys.detail(roadmapId)` esperando a que termine. Con
 * `throwOnError` un fallo del GET no se traga: se devuelve como `{ ok: false, error }` para que
 * el llamante decida (p. ej. un 404 deja que la página pinte «No encontramos esta ruta»).
 */
export async function refreshRoadmapDetail(
  queryClient: QueryClient,
  roadmapId: string,
): Promise<RefreshDetailOutcome> {
  try {
    await queryClient.invalidateQueries(
      { queryKey: roadmapsKeys.detail(roadmapId), exact: true },
      { throwOnError: true },
    );
    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
}

/** Invalida `roadmapsKeys.list()` sin esperar: la pill y Mis Rutas se actualizan en segundo plano. */
export function invalidateRoadmapsList(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: roadmapsKeys.list() });
}
