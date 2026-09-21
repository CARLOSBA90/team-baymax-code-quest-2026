import { isAxiosError } from "axios";

const NETWORK_MESSAGE =
  "No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.";
const GENERIC_MESSAGE = "Ocurrió un error inesperado. Inténtalo de nuevo.";

export function getApiErrorMessage(error: unknown): string {
  if (!isAxiosError(error)) {
    return GENERIC_MESSAGE;
  }

  if (!error.response) {
    return NETWORK_MESSAGE;
  }

  const data: unknown = error.response.data;
  const message =
    typeof data === "object" && data !== null ? (data as { message?: unknown }).message : undefined;

  if (Array.isArray(message)) {
    const parts = message.filter((m): m is string => typeof m === "string" && m.trim() !== "");
    return parts.length > 0 ? parts.join(", ") : GENERIC_MESSAGE;
  }

  if (typeof message === "string" && message.trim() !== "") {
    return message;
  }

  return GENERIC_MESSAGE;
}
