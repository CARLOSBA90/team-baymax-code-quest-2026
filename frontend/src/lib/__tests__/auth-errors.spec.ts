import { describe, expect, it } from "vitest";
import { AuthError, getAuthErrorMessage, getOAuthQueryErrorMessage } from "@/lib/auth-errors";

const NETWORK = "No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.";
const GENERIC = "Ocurrió un error inesperado. Inténtalo de nuevo.";
const RATE_LIMIT = "Demasiados intentos. Espera un momento e inténtalo de nuevo.";
const NOT_VERIFIED = "Debes verificar tu correo antes de iniciar sesión.";
const ORIGIN = "No se pudo completar la solicitud (origen no permitido).";
const ALREADY_EXISTS = "Ya existe una cuenta con este email.";
const SOCIAL_LINKED = "Esta cuenta social ya está vinculada a otro usuario.";

describe("AuthError", () => {
  it("usa valores por defecto", () => {
    const error = new AuthError({});
    expect(error.message).toBe("Auth error");
    expect(error.status).toBe(0);
    expect(error.code).toBeUndefined();
    expect(error.name).toBe("AuthError");
    expect(error).toBeInstanceOf(Error);
  });

  it("conserva valores explícitos", () => {
    const error = new AuthError({ message: "x", code: "C", status: 400 });
    expect(error.message).toBe("x");
    expect(error.code).toBe("C");
    expect(error.status).toBe(400);
  });
});

describe("getAuthErrorMessage", () => {
  it("devuelve mensaje de red para TypeError", () => {
    expect(getAuthErrorMessage(new TypeError("Failed to fetch"))).toBe(NETWORK);
  });

  it.each([
    ["EMAIL_NOT_VERIFIED", NOT_VERIFIED],
    ["INVALID_EMAIL_OR_PASSWORD", "Email o contraseña incorrectos."],
    ["USER_ALREADY_EXISTS", ALREADY_EXISTS],
    ["USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL", ALREADY_EXISTS],
    ["PASSWORD_TOO_SHORT", "La contraseña es demasiado corta."],
    ["PASSWORD_TOO_LONG", "La contraseña es demasiado larga."],
    ["INVALID_EMAIL", "El email no es válido."],
    ["PROVIDER_NOT_FOUND", "Este proveedor no está disponible por ahora."],
    ["INVALID_CALLBACK_URL", ORIGIN],
    ["INVALID_ERROR_CALLBACK_URL", ORIGIN],
    ["INVALID_ORIGIN", ORIGIN],
    ["MISSING_OR_NULL_ORIGIN", ORIGIN],
    ["SOCIAL_ACCOUNT_ALREADY_LINKED", SOCIAL_LINKED],
    ["LINKED_ACCOUNT_ALREADY_EXISTS", SOCIAL_LINKED],
  ])("mapea el código %s", (code, message) => {
    expect(getAuthErrorMessage(new AuthError({ code, status: 400 }))).toBe(message);
  });

  it("status 0 sin código -> red", () => {
    expect(getAuthErrorMessage(new AuthError({}))).toBe(NETWORK);
  });

  it("status 403 sin código -> correo no verificado", () => {
    expect(getAuthErrorMessage(new AuthError({ status: 403 }))).toBe(NOT_VERIFIED);
  });

  it("status 429 sin código -> rate limit", () => {
    expect(getAuthErrorMessage(new AuthError({ status: 429 }))).toBe(RATE_LIMIT);
  });

  it("el código tiene prioridad sobre el status", () => {
    const error = new AuthError({ code: "INVALID_EMAIL_OR_PASSWORD", status: 429 });
    expect(getAuthErrorMessage(error)).toBe("Email o contraseña incorrectos.");
  });

  it("código desconocido cae al status", () => {
    expect(getAuthErrorMessage(new AuthError({ code: "FOO", status: 429 }))).toBe(RATE_LIMIT);
    expect(getAuthErrorMessage(new AuthError({ code: "FOO", status: 500 }))).toBe(GENERIC);
  });

  it.each(["toString", "constructor"])(
    "no resuelve el código heredado %s por prototipo",
    (code) => {
      expect(getAuthErrorMessage(new AuthError({ code, status: 500 }))).toBe(GENERIC);
    },
  );

  it.each([
    ["Error normal", new Error("boom")],
    ["string", "boom"],
    ["null", null],
    ["undefined", undefined],
    ["AuthError 500", new AuthError({ status: 500 })],
  ])("devuelve mensaje genérico para %s", (_label, error) => {
    expect(getAuthErrorMessage(error)).toBe(GENERIC);
  });
});

describe("getOAuthQueryErrorMessage", () => {
  it("null -> null", () => {
    expect(getOAuthQueryErrorMessage(null)).toBeNull();
  });

  it("access_denied", () => {
    expect(getOAuthQueryErrorMessage("access_denied")).toBe("Cancelaste el inicio de sesión.");
  });

  it.each(["server_error", ""])("otro código %j -> mensaje del proveedor", (code) => {
    expect(getOAuthQueryErrorMessage(code)).toBe("No se pudo iniciar sesión con el proveedor.");
  });
});
