import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteRoadmap } from "@/api/services";
import { isRoadmapNotFoundError } from "@/lib";
import type { RoadmapsListResult } from "@/types";
import { roadmapsKeys } from "./keys";
import { removeRoadmapFromList } from "./roadmaps-cache";

/**
 * Borrado pesimista de una ruta: la caché solo cambia cuando responde el back. Tras 200 — o 404
 * `ROADMAP_NOT_FOUND`, que significa que ya no existe — quita la ruta del listado cacheado y
 * invalida `roadmapsKeys.all`. Cualquier otro error deja la caché intacta. La UI (cerrar el
 * diálogo, avisos, foco) va en los callbacks por llamada de `mutate`.
 */
export function useDeleteRoadmap(): UseMutationResult<{ id: string }, Error, string> {
  const queryClient = useQueryClient();

  const removeAndInvalidate = (id: string) => {
    queryClient.setQueryData<RoadmapsListResult>(
      roadmapsKeys.list(),
      (old) => old && removeRoadmapFromList(old, id),
    );
    // Sin await: el consumidor cierra el diálogo sin esperar al refetch.
    void queryClient.invalidateQueries({ queryKey: roadmapsKeys.all });
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
