import { isAxiosError } from "axios";
import { getApiErrorCode, getApiErrorStatus } from "./api-error-code";

// Clasificación y copy en español de los errores de `POST /progress/track` al marcar un paso como
// completado. Nunca se muestra el `message` del back (en inglés).

const TRACK_NETWORK_MESSAGE =
  "No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.";
const TRACK_GENERIC_MESSAGE = "No se pudo marcar como completado. Inténtalo de nuevo.";

const ROADMAP_PAUSED_CODE = "ROADMAP_PAUSED";
const TRACKING_REPORT_MISMATCH_CODE = "TRACKING_REPORT_MISMATCH";
const SYLLABUS_MISSING_CODE = "SYLLABUS_MISSING";
const LESSON_NOT_IN_ITEM_CODE = "LESSON_NOT_IN_ITEM";

/** Anuncio tras un 409 `ROADMAP_PAUSED`. */
export const ROADMAP_PAUSED_TRACK_MESSAGE =
  "Esta ruta está pausada. Reanúdala para registrar tu avance.";

/** Aviso (Notice) tras un 404: el paso ya no existe. */
export const ROADMAP_ITEM_NOT_FOUND_MESSAGE = "Este paso ya no existe. Hemos actualizado la ruta.";

/** Anuncio tras un 422 `TRACKING_REPORT_MISMATCH`. */
export const TRACKING_MISMATCH_TRACK_MESSAGE =
  "Este paso ya no se puede marcar como completado desde aquí.";

/** Aviso (Notice) tras un 422 `SYLLABUS_MISSING` al trackear una lección. */
export const SYLLABUS_MISSING_TRACK_MESSAGE =
  "Ya no podemos registrar el avance de este curso. Hemos actualizado la ruta.";

/** Aviso (Notice) tras un 422 `LESSON_NOT_IN_ITEM` al trackear una lección. */
export const LESSON_NOT_IN_ITEM_TRACK_MESSAGE =
  "Esta lección ya no está disponible. Hemos actualizado la ruta.";

/** 409 con `code` `ROADMAP_PAUSED` (otros 409 no son alcanzables al completar → genérico). */
export function isRoadmapPausedError(error: unknown): boolean {
  return getApiErrorStatus(error) === 409 && getApiErrorCode(error) === ROADMAP_PAUSED_CODE;
}

/** 404 por status: el back solo responde `ROADMAP_ITEM_NOT_FOUND` (ítem o ruta inexistentes). */
export function isRoadmapItemNotFoundError(error: unknown): boolean {
  return getApiErrorStatus(error) === 404;
}

/** 422 con `code` `TRACKING_REPORT_MISMATCH`. */
export function isTrackingMismatchError(error: unknown): boolean {
  return (
    getApiErrorStatus(error) === 422 && getApiErrorCode(error) === TRACKING_REPORT_MISMATCH_CODE
  );
}

/** 422 con `code` `SYLLABUS_MISSING`: el curso ya no tiene temario al intentar trackear una lección. */
export function isSyllabusMissingError(error: unknown): boolean {
  return getApiErrorStatus(error) === 422 && getApiErrorCode(error) === SYLLABUS_MISSING_CODE;
}

/** 422 con `code` `LESSON_NOT_IN_ITEM`: la lección enviada ya no pertenece al curso (temario desactualizado). */
export function isLessonNotInItemError(error: unknown): boolean {
  return getApiErrorStatus(error) === 422 && getApiErrorCode(error) === LESSON_NOT_IN_ITEM_CODE;
}

/** Errores tras los que hay que recargar el detalle (el estado del servidor cambió). */
export function shouldRefreshAfterTrackError(error: unknown): boolean {
  return (
    isRoadmapItemNotFoundError(error) ||
    isRoadmapPausedError(error) ||
    isTrackingMismatchError(error) ||
    isSyllabusMissingError(error) ||
    isLessonNotInItemError(error)
  );
}

/** Mensaje dentro del diálogo: conexión si no hubo respuesta; si no, genérico. */
export function getCompleteItemErrorMessage(error: unknown): string {
  if (isAxiosError(error) && !error.response) return TRACK_NETWORK_MESSAGE;
  return TRACK_GENERIC_MESSAGE;
}

/**
 * Mensaje del `Notice` tras marcar/desmarcar una lección. Orden: sin respuesta (red) > pausada >
 * mismatch de tipo > temario ya no disponible > lección ya no pertenece al curso > paso no
 * encontrado > genérico. Nunca el `message` del backend.
 */
export function getLessonTrackErrorMessage(error: unknown): string {
  if (isAxiosError(error) && !error.response) return TRACK_NETWORK_MESSAGE;
  if (isRoadmapPausedError(error)) return ROADMAP_PAUSED_TRACK_MESSAGE;
  if (isTrackingMismatchError(error)) return TRACKING_MISMATCH_TRACK_MESSAGE;
  if (isSyllabusMissingError(error)) return SYLLABUS_MISSING_TRACK_MESSAGE;
  if (isLessonNotInItemError(error)) return LESSON_NOT_IN_ITEM_TRACK_MESSAGE;
  if (isRoadmapItemNotFoundError(error)) return ROADMAP_ITEM_NOT_FOUND_MESSAGE;
  return TRACK_GENERIC_MESSAGE;
}
