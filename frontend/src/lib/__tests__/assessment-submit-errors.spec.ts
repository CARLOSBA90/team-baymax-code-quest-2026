import { AxiosError } from "axios";
import { describe, expect, it } from "vitest";
import { getApiErrorMessage } from "@/api/errors";
import { ASSESSMENT_SUBMIT_TIMEOUT_MESSAGE, isAssessmentSubmitTimeoutError } from "@/lib";
import { buildAxiosError, buildNetworkError, buildTimeoutError } from "@/test/fixtures/api-errors";

describe("isAssessmentSubmitTimeoutError", () => {
  it.each(["ECONNABORTED", "ETIMEDOUT"] as const)(
    "reconoce el techo de espera con el código %s",
    (code) => {
      expect(isAssessmentSubmitTimeoutError(buildTimeoutError(code))).toBe(true);
    },
  );

  it.each([
    ["un fallo de red", buildNetworkError()],
    ["un 400 con mensaje del backend", buildAxiosError(400, "Respuestas inválidas")],
    ["un 504 (hay respuesta del servidor)", buildAxiosError(504)],
    ["una cancelación", new AxiosError("x", "ERR_CANCELED")],
    ["un Error corriente", new Error("boom")],
    ["undefined", undefined],
    ["null", null],
    ["una cadena suelta", "ECONNABORTED"],
  ])("no trata como techo de espera %s", (_label, error) => {
    expect(isAssessmentSubmitTimeoutError(error)).toBe(false);
  });

  it("la respuesta manda: un error con código de aborto pero con response no es techo", () => {
    const error = buildAxiosError(504);
    error.code = "ECONNABORTED";

    expect(isAssessmentSubmitTimeoutError(error)).toBe(false);
  });
});

describe("ASSESSMENT_SUBMIT_TIMEOUT_MESSAGE", () => {
  it("indica revisar Mis Rutas sin afirmar que el envío falló", () => {
    expect(ASSESSMENT_SUBMIT_TIMEOUT_MESSAGE).toContain("Mis Rutas");
    expect(ASSESSMENT_SUBMIT_TIMEOUT_MESSAGE).not.toContain("falló");
  });

  it("es distinto del mensaje genérico de conexión", () => {
    expect(ASSESSMENT_SUBMIT_TIMEOUT_MESSAGE).not.toBe(getApiErrorMessage(buildNetworkError()));
  });
});
