import { isAxiosError } from "axios";
import type { RoadmapStatus } from "@/types";
import { getApiErrorCode, getApiErrorStatus } from "./api-error-code";
import { isRoadmapNotFoundError } from "./roadmap-delete-errors";

// Clasificación y copy en español de los errores de `PATCH /roadmaps/:id/pause` (pausar y
// reanudar). Nunca se muestra el `message` del back (en inglés).

const PAUSE_NETWORK_MESSAGE =
  "No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.";
const PAUSE_GENERIC_MESSAGE = "No se pudo pausar la ruta. Inténtalo de nuevo.";
const RESUME_GENERIC_MESSAGE = "No se pudo reanudar la ruta. Inténtalo de nuevo.";

const VERSION_CONFLICT_CODE = "ROADMAP_VERSION_CONFLICT";
const INVALID_TRANSITION_CODE = "INVALID_ROADMAP_TRANSITION";

/** Aviso (Notice `info`) tras un 409 de conflicto o de transición: el detalle ya está refrescado. */
export const ROADMAP_UPDATED_ELSEWHERE_MESSAGE =
  "Alguien actualizó esta ruta desde otro lugar. Ya tienes la versión más reciente.";

/** Anuncio (live region) cuando la ruta devuelta queda PAUSED. */
export const ROADMAP_PAUSED_ANNOUNCEMENT =
  "Ruta pausada. Mientras esté pausada no se registra tu avance.";

/** Anuncio (live region) cuando la ruta devuelta queda IN_PROGRESS o NOT_STARTED. */
export const ROADMAP_RESUMED_ANNOUNCEMENT = "Ruta reanudada. Ya puedes registrar tu avance.";

/** 409 `ROADMAP_VERSION_CONFLICT`: `expectedActivityVersion` desfasado. */
export function isRoadmapVersionConflictError(error: unknown): boolean {
  return getApiErrorStatus(error) === 409 && getApiErrorCode(error) === VERSION_CONFLICT_CODE;
}

/** 409 `INVALID_ROADMAP_TRANSITION`: la transición ya no es válida (p. ej. ruta COMPLETED). */
export function isInvalidRoadmapTransitionError(error: unknown): boolean {
  return getApiErrorStatus(error) === 409 && getApiErrorCode(error) === INVALID_TRANSITION_CODE;
}

/** La ruta cambió en otro sitio (conflicto de versión o transición inválida). */
export function isRoadmapUpdatedElsewhereError(error: unknown): boolean {
  return isRoadmapVersionConflictError(error) || isInvalidRoadmapTransitionError(error);
}

/** Errores tras los que hay que recargar el detalle: 409 de conflicto/transición o 404. */
export function shouldRefreshAfterPauseError(error: unknown): boolean {
  return isRoadmapUpdatedElsewhereError(error) || isRoadmapNotFoundError(error);
}

/** Mensaje del Notice de error: conexión si no hubo respuesta; si no, genérico por acción. */
export function getPauseRoadmapErrorMessage(error: unknown, paused: boolean): string {
  if (isAxiosError(error) && !error.response) return PAUSE_NETWORK_MESSAGE;
  return paused ? PAUSE_GENERIC_MESSAGE : RESUME_GENERIC_MESSAGE;
}

/**
 * Anuncio según el estado que devuelve el back (idempotente: puede no coincidir con la acción
 * pedida). PAUSED → pausa; IN_PROGRESS/NOT_STARTED → reanudación; COMPLETED u otro → `null` (sin
 * anuncio: el panel de completada ya lo comunica).
 */
export function getPauseToggleAnnouncement(status: RoadmapStatus): string | null {
  switch (status) {
    case "PAUSED":
      return ROADMAP_PAUSED_ANNOUNCEMENT;
    case "IN_PROGRESS":
    case "NOT_STARTED":
      return ROADMAP_RESUMED_ANNOUNCEMENT;
    default:
      return null;
  }
}
