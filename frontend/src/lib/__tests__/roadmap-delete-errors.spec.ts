import { describe, expect, it } from "vitest";
import {
  getDeleteRoadmapErrorMessage,
  getRoadmapDeletedMessage,
  isRoadmapNotFoundError,
  ROADMAP_DELETE_NOT_FOUND_MESSAGE,
} from "@/lib";
import { buildAxiosError, buildNetworkError } from "@/test/fixtures/api-errors";

const GENERIC = "No se pudo eliminar la ruta. Inténtalo de nuevo.";
const NETWORK = "No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.";

describe("isRoadmapNotFoundError", () => {
  it("es true con un 404 de axios (ROADMAP_NOT_FOUND)", () => {
    expect(
      isRoadmapNotFoundError(
        buildAxiosError(404, "Roadmap not found.", { code: "ROADMAP_NOT_FOUND" }),
      ),
    ).toBe(true);
  });

  it("es true con un 404 aunque no venga code", () => {
    expect(isRoadmapNotFoundError(buildAxiosError(404))).toBe(true);
  });

  it.each([
    ["500", buildAxiosError(500)],
    ["fallo de red", buildNetworkError()],
    ["error no axios", new Error("boom")],
    ["valor no error", "404"],
  ])("es false con %s", (_label, error) => {
    expect(isRoadmapNotFoundError(error)).toBe(false);
  });
});

describe("getDeleteRoadmapErrorMessage", () => {
  it("devuelve el mensaje de conexión si no hay respuesta", () => {
    expect(getDeleteRoadmapErrorMessage(buildNetworkError())).toBe(NETWORK);
  });

  it("devuelve el genérico en español con un 500, sin usar el message del back", () => {
    expect(getDeleteRoadmapErrorMessage(buildAxiosError(500, "Internal server error"))).toBe(
      GENERIC,
    );
  });

  it("nunca devuelve el message inglés del 404", () => {
    const message = getDeleteRoadmapErrorMessage(
      buildAxiosError(404, "Roadmap not found.", { code: "ROADMAP_NOT_FOUND" }),
    );

    expect(message).toBe(GENERIC);
    expect(message).not.toContain("Roadmap not found.");
  });

  it("devuelve el genérico con un error que no es de axios", () => {
    expect(getDeleteRoadmapErrorMessage(new Error("boom"))).toBe(GENERIC);
  });
});

describe("mensajes de aviso", () => {
  it("getRoadmapDeletedMessage incluye el nombre entre comillas angulares", () => {
    expect(getRoadmapDeletedMessage("X")).toBe("Ruta «X» eliminada");
  });

  it("ROADMAP_DELETE_NOT_FOUND_MESSAGE es el aviso neutral en español", () => {
    expect(ROADMAP_DELETE_NOT_FOUND_MESSAGE).toBe(
      "Esa ruta ya no existe. Hemos actualizado tu lista.",
    );
  });
});
