import { describe, expect, it } from "vitest";
import {
  getCompleteItemErrorMessage,
  getTrackErrorCode,
  isRoadmapItemNotFoundError,
  isRoadmapPausedError,
  isTrackingMismatchError,
  ROADMAP_ITEM_NOT_FOUND_MESSAGE,
  ROADMAP_PAUSED_TRACK_MESSAGE,
  shouldRefreshAfterTrackError,
  TRACKING_MISMATCH_TRACK_MESSAGE,
} from "@/lib";
import { buildAxiosError, buildNetworkError } from "@/test/fixtures/api-errors";
import {
  buildRoadmapItemNotFoundError,
  buildRoadmapPausedError,
  buildTrackingMismatchError,
} from "@/test/fixtures/progress";

const NETWORK_MESSAGE =
  "No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.";
const GENERIC_MESSAGE = "No se pudo marcar como completado. Inténtalo de nuevo.";
const BACKEND_MESSAGE = "Backend says no";

interface Case {
  label: string;
  error: unknown;
  paused: boolean;
  itemNotFound: boolean;
  mismatch: boolean;
  message: string;
}

const CASES: Case[] = [
  {
    label: "409 ROADMAP_PAUSED",
    error: buildRoadmapPausedError(),
    paused: true,
    itemNotFound: false,
    mismatch: false,
    message: GENERIC_MESSAGE,
  },
  {
    label: "409 VERSION_CONFLICT",
    error: buildAxiosError(409, BACKEND_MESSAGE, { code: "VERSION_CONFLICT" }),
    paused: false,
    itemNotFound: false,
    mismatch: false,
    message: GENERIC_MESSAGE,
  },
  {
    label: "409 sin code",
    error: buildAxiosError(409, BACKEND_MESSAGE),
    paused: false,
    itemNotFound: false,
    mismatch: false,
    message: GENERIC_MESSAGE,
  },
  {
    label: "404 ROADMAP_ITEM_NOT_FOUND",
    error: buildRoadmapItemNotFoundError(),
    paused: false,
    itemNotFound: true,
    mismatch: false,
    message: GENERIC_MESSAGE,
  },
  {
    label: "404 sin code",
    error: buildAxiosError(404, BACKEND_MESSAGE),
    paused: false,
    itemNotFound: true,
    mismatch: false,
    message: GENERIC_MESSAGE,
  },
  {
    label: "422 TRACKING_REPORT_MISMATCH",
    error: buildTrackingMismatchError(),
    paused: false,
    itemNotFound: false,
    mismatch: true,
    message: GENERIC_MESSAGE,
  },
  {
    label: "422 sin code",
    error: buildAxiosError(422, BACKEND_MESSAGE),
    paused: false,
    itemNotFound: false,
    mismatch: false,
    message: GENERIC_MESSAGE,
  },
  {
    label: "red (sin response)",
    error: buildNetworkError(),
    paused: false,
    itemNotFound: false,
    mismatch: false,
    message: NETWORK_MESSAGE,
  },
  {
    label: "500",
    error: buildAxiosError(500, BACKEND_MESSAGE),
    paused: false,
    itemNotFound: false,
    mismatch: false,
    message: GENERIC_MESSAGE,
  },
  {
    label: "401",
    error: buildAxiosError(401, BACKEND_MESSAGE),
    paused: false,
    itemNotFound: false,
    mismatch: false,
    message: GENERIC_MESSAGE,
  },
  {
    label: "no Axios",
    error: new Error("x"),
    paused: false,
    itemNotFound: false,
    mismatch: false,
    message: GENERIC_MESSAGE,
  },
];

describe("clasificación de errores de completado", () => {
  it.each(CASES)("$label", ({ error, paused, itemNotFound, mismatch, message }) => {
    expect(isRoadmapPausedError(error)).toBe(paused);
    expect(isRoadmapItemNotFoundError(error)).toBe(itemNotFound);
    expect(isTrackingMismatchError(error)).toBe(mismatch);
    expect(shouldRefreshAfterTrackError(error)).toBe(paused || itemNotFound || mismatch);
    expect(getCompleteItemErrorMessage(error)).toBe(message);
    expect(getCompleteItemErrorMessage(error)).not.toContain(BACKEND_MESSAGE);
  });
});

describe("getTrackErrorCode", () => {
  it("devuelve response.data.code si es string", () => {
    expect(getTrackErrorCode(buildRoadmapPausedError())).toBe("ROADMAP_PAUSED");
  });

  it.each([
    ["code numérico", buildAxiosError(409, BACKEND_MESSAGE, { code: 42 })],
    ["sin code", buildAxiosError(409, BACKEND_MESSAGE)],
    ["red", buildNetworkError()],
    ["no Axios", new Error("x")],
    ["null", null],
  ])("%s → null", (_label, error) => {
    expect(getTrackErrorCode(error)).toBeNull();
  });

  it("un 409 con code no string no cuenta como pausa", () => {
    const error = buildAxiosError(409, BACKEND_MESSAGE, { code: 42 });
    expect(isRoadmapPausedError(error)).toBe(false);
  });
});

describe("copy de desenlaces", () => {
  it("tiene los textos exactos", () => {
    expect(ROADMAP_PAUSED_TRACK_MESSAGE).toBe(
      "Esta ruta está pausada. Reanúdala para registrar tu avance.",
    );
    expect(ROADMAP_ITEM_NOT_FOUND_MESSAGE).toBe(
      "Este paso ya no existe. Hemos actualizado la ruta.",
    );
    expect(TRACKING_MISMATCH_TRACK_MESSAGE).toBe(
      "Este paso ya no se puede marcar como completado desde aquí.",
    );
  });
});
