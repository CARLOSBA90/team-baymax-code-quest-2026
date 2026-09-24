import { AxiosError, type AxiosResponse } from "axios";

/**
 * Error de Axios con respuesta HTTP (`status`) y, opcionalmente, el `message` del backend y otros
 * campos del cuerpo (`extra`, p. ej. `{ code: "ROADMAP_NOT_FOUND" }`).
 */
export function buildAxiosError(
  status: number,
  message?: string | string[],
  extra: Record<string, unknown> = {},
): AxiosError {
  const response = {
    status,
    statusText: "",
    headers: {},
    config: {} as never,
    data: { ...extra, message },
  };
  return new AxiosError(
    "Request failed",
    "ERR_BAD_REQUEST",
    undefined,
    undefined,
    response as AxiosResponse,
  );
}

/** Error de Axios sin respuesta (fallo de red). */
export function buildNetworkError(): AxiosError {
  return new AxiosError("Network Error", "ERR_NETWORK");
}
