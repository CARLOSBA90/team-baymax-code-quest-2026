import { isAxiosError } from "axios";

// Lectura tolerante de los errores tipados del back (`{ statusCode, code, message }`). Compartido
// por la clasificación de errores de completar (`roadmap-progress-errors`) y de pausar/reanudar
// (`roadmap-pause-errors`).

/** `response.data.code` del back si es un string; si no (red, no Axios, sin code…), `null`. */
export function getApiErrorCode(error: unknown): string | null {
  if (!isAxiosError(error)) return null;
  const data: unknown = error.response?.data;
  if (typeof data !== "object" || data === null || !("code" in data)) return null;
  return typeof data.code === "string" ? data.code : null;
}

/** Status HTTP de la respuesta; `undefined` si no hubo respuesta o no es un error de Axios. */
export function getApiErrorStatus(error: unknown): number | undefined {
  return isAxiosError(error) ? error.response?.status : undefined;
}
