import { AxiosError, type AxiosResponse } from "axios";

/** Error de Axios con respuesta HTTP (`status`) y, opcionalmente, el `message` del backend. */
export function buildAxiosError(status: number, message?: string | string[]): AxiosError {
  const response = { status, statusText: "", headers: {}, config: {} as never, data: { message } };
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
