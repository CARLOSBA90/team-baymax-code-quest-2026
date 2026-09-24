import { isAxiosError } from "axios";

// Copy en español del borrado de rutas. Nunca se muestra el `message` del back (en inglés).

const DELETE_NETWORK_MESSAGE =
  "No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.";
const DELETE_GENERIC_MESSAGE = "No se pudo eliminar la ruta. Inténtalo de nuevo.";

/** Aviso neutral cuando la ruta ya no existía (404): se quita de la lista igualmente. */
export const ROADMAP_DELETE_NOT_FOUND_MESSAGE =
  "Esa ruta ya no existe. Hemos actualizado tu lista.";

export function getRoadmapDeletedMessage(name: string): string {
  return `Ruta «${name}» eliminada`;
}

/**
 * `DELETE /roadmaps/:id` solo responde 404 como `ROADMAP_NOT_FOUND` (inexistente o de otro
 * usuario), así que basta con el status; no se exige `code` para ser robusto.
 */
export function isRoadmapNotFoundError(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 404;
}

export function getDeleteRoadmapErrorMessage(error: unknown): string {
  if (isAxiosError(error) && !error.response) return DELETE_NETWORK_MESSAGE;
  return DELETE_GENERIC_MESSAGE;
}
