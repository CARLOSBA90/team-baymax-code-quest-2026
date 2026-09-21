const NETWORK_MESSAGE =
  "No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.";
const GENERIC_MESSAGE = "Ocurrió un error inesperado. Inténtalo de nuevo.";
const RATE_LIMIT_MESSAGE = "Demasiados intentos. Espera un momento e inténtalo de nuevo.";
const ORIGIN_MESSAGE = "No se pudo completar la solicitud (origen no permitido).";
const ALREADY_EXISTS_MESSAGE = "Ya existe una cuenta con este email.";
const SOCIAL_LINKED_MESSAGE = "Esta cuenta social ya está vinculada a otro usuario.";

const ERROR_MESSAGES: Record<string, string> = {
  EMAIL_NOT_VERIFIED: "Debes verificar tu correo antes de iniciar sesión.",
  INVALID_EMAIL_OR_PASSWORD: "Email o contraseña incorrectos.",
  USER_ALREADY_EXISTS: ALREADY_EXISTS_MESSAGE,
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: ALREADY_EXISTS_MESSAGE,
  PASSWORD_TOO_SHORT: "La contraseña es demasiado corta.",
  PASSWORD_TOO_LONG: "La contraseña es demasiado larga.",
  INVALID_EMAIL: "El email no es válido.",
  PROVIDER_NOT_FOUND: "Este proveedor no está disponible por ahora.",
  INVALID_CALLBACK_URL: ORIGIN_MESSAGE,
  INVALID_ERROR_CALLBACK_URL: ORIGIN_MESSAGE,
  INVALID_ORIGIN: ORIGIN_MESSAGE,
  MISSING_OR_NULL_ORIGIN: ORIGIN_MESSAGE,
  SOCIAL_ACCOUNT_ALREADY_LINKED: SOCIAL_LINKED_MESSAGE,
  LINKED_ACCOUNT_ALREADY_EXISTS: SOCIAL_LINKED_MESSAGE,
};

export class AuthError extends Error {
  code: string | undefined;
  status: number;

  constructor(init: { message?: string; code?: string; status?: number }) {
    super(init.message ?? "Auth error");
    this.name = "AuthError";
    this.code = init.code;
    this.status = init.status ?? 0;
  }
}

export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof TypeError) {
    return NETWORK_MESSAGE;
  }

  if (error instanceof AuthError) {
    if (error.code && Object.hasOwn(ERROR_MESSAGES, error.code)) {
      return ERROR_MESSAGES[error.code];
    }
    if (error.status === 0) {
      return NETWORK_MESSAGE;
    }
    if (error.status === 403) {
      return ERROR_MESSAGES.EMAIL_NOT_VERIFIED;
    }
    if (error.status === 429) {
      return RATE_LIMIT_MESSAGE;
    }
  }

  return GENERIC_MESSAGE;
}

export function getOAuthQueryErrorMessage(code: string | null): string | null {
  if (code === null) {
    return null;
  }
  if (code === "access_denied") {
    return "Cancelaste el inicio de sesión.";
  }
  return "No se pudo iniciar sesión con el proveedor.";
}
