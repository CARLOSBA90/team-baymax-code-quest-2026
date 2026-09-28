import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteRoadmap } from "@/api/services";
import { isRoadmapNotFoundError } from "@/lib";
import type { RoadmapsListResult } from "@/types";
import { roadmapsKeys } from "./keys";
import { removeRoadmapFromList } from "./roadmaps-cache";

export interface UseDeleteRoadmapOptions {
  /**
   * Si `true` (por defecto, Mis Rutas) quita `roadmapsKeys.detail(id)` de la caché tras borrar.
   * El detalle pasa `false`: con su observador vivo, quitarlo haría que un re-render volviera a
   * pedir la ruta borrada (404 → «No encontramos esta ruta»); la vista la quita al desmontarse.
   */
  removeDetail?: boolean;
}

/**
 * Borrado pesimista de una ruta: la caché solo cambia cuando responde el back. Tras 200 — o 404
 * `ROADMAP_NOT_FOUND`, que significa que ya no existe — quita la ruta del listado cacheado,
 * invalida solo `roadmapsKeys.list()` (borrar una ruta no cambia otros detalles; nunca
 * `roadmapsKeys.all`, que volvería a pedir el detalle activo) y, salvo `removeDetail: false`,
 * elimina la entrada de su detalle. Cualquier otro error deja la caché intacta. La UI (cerrar el
 * diálogo, avisos, foco, navegar) va en los callbacks por llamada de `mutate`.
 */
export function useDeleteRoadmap({
  removeDetail = true,
}: UseDeleteRoadmapOptions = {}): UseMutationResult<{ id: string }, Error, string> {
  const queryClient = useQueryClient();

  const removeAndInvalidate = (id: string) => {
    if (removeDetail) {
      queryClient.removeQueries({ queryKey: roadmapsKeys.detail(id), exact: true });
    }
    queryClient.setQueryData<RoadmapsListResult>(
      roadmapsKeys.list(),
      (old) => old && removeRoadmapFromList(old, id),
    );
    // Sin await: el consumidor cierra el diálogo (o navega) sin esperar al refetch.
    void queryClient.invalidateQueries({ queryKey: roadmapsKeys.list() });
  };

  return useMutation<{ id: string }, Error, string>({
    mutationKey: [...roadmapsKeys.all, "delete"],
    mutationFn: deleteRoadmap,
    onSuccess: (_data, id) => removeAndInvalidate(id),
    onError: (error, id) => {
      if (isRoadmapNotFoundError(error)) removeAndInvalidate(id);
    },
  });
}
