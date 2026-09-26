import { isAxiosError } from "axios";

// Clasificación y copy en español de los errores de `POST /progress/track` al marcar un paso como
// completado. Nunca se muestra el `message` del back (en inglés).

const TRACK_NETWORK_MESSAGE =
  "No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.";
const TRACK_GENERIC_MESSAGE = "No se pudo marcar como completado. Inténtalo de nuevo.";

const ROADMAP_PAUSED_CODE = "ROADMAP_PAUSED";
const TRACKING_REPORT_MISMATCH_CODE = "TRACKING_REPORT_MISMATCH";

/** Anuncio tras un 409 `ROADMAP_PAUSED`. */
export const ROADMAP_PAUSED_TRACK_MESSAGE =
  "Esta ruta está pausada. Reanúdala para registrar tu avance.";

/** Aviso (Notice) tras un 404: el paso ya no existe. */
export const ROADMAP_ITEM_NOT_FOUND_MESSAGE = "Este paso ya no existe. Hemos actualizado la ruta.";

/** Anuncio tras un 422 `TRACKING_REPORT_MISMATCH`. */
export const TRACKING_MISMATCH_TRACK_MESSAGE =
  "Este paso ya no se puede marcar como completado desde aquí.";

function getStatus(error: unknown): number | undefined {
  return isAxiosError(error) ? error.response?.status : undefined;
}

/** `response.data.code` del back si es un string; si no, `null`. */
export function getTrackErrorCode(error: unknown): string | null {
  if (!isAxiosError(error)) return null;
  const data: unknown = error.response?.data;
  if (typeof data !== "object" || data === null || !("code" in data)) return null;
  return typeof data.code === "string" ? data.code : null;
}

/** 409 con `code` `ROADMAP_PAUSED` (otros 409 no son alcanzables al completar → genérico). */
export function isRoadmapPausedError(error: unknown): boolean {
  return getStatus(error) === 409 && getTrackErrorCode(error) === ROADMAP_PAUSED_CODE;
}

/** 404 por status: el back solo responde `ROADMAP_ITEM_NOT_FOUND` (ítem o ruta inexistentes). */
export function isRoadmapItemNotFoundError(error: unknown): boolean {
  return getStatus(error) === 404;
}

/** 422 con `code` `TRACKING_REPORT_MISMATCH`. */
export function isTrackingMismatchError(error: unknown): boolean {
  return getStatus(error) === 422 && getTrackErrorCode(error) === TRACKING_REPORT_MISMATCH_CODE;
}

/** Errores tras los que hay que recargar el detalle (el estado del servidor cambió). */
export function shouldRefreshAfterTrackError(error: unknown): boolean {
  return (
    isRoadmapItemNotFoundError(error) ||
    isRoadmapPausedError(error) ||
    isTrackingMismatchError(error)
  );
}

/** Mensaje dentro del diálogo: conexión si no hubo respuesta; si no, genérico. */
export function getCompleteItemErrorMessage(error: unknown): string {
  if (isAxiosError(error) && !error.response) return TRACK_NETWORK_MESSAGE;
  return TRACK_GENERIC_MESSAGE;
}
