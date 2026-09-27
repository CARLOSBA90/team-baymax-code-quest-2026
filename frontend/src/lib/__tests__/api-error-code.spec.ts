import { describe, expect, it } from "vitest";
import { getApiErrorCode, getApiErrorStatus } from "@/lib";
import { buildAxiosError, buildNetworkError } from "@/test/fixtures/api-errors";
import { buildRoadmapPausedError } from "@/test/fixtures/progress";

const BACKEND_MESSAGE = "Backend says no";

describe("getApiErrorCode", () => {
  it("devuelve response.data.code si es string", () => {
    expect(getApiErrorCode(buildRoadmapPausedError())).toBe("ROADMAP_PAUSED");
    expect(
      getApiErrorCode(buildAxiosError(409, BACKEND_MESSAGE, { code: "ROADMAP_VERSION_CONFLICT" })),
    ).toBe("ROADMAP_VERSION_CONFLICT");
  });

  it.each([
    ["code numérico", buildAxiosError(409, BACKEND_MESSAGE, { code: 42 })],
    ["sin code", buildAxiosError(409, BACKEND_MESSAGE)],
    ["red", buildNetworkError()],
    ["no Axios", new Error("x")],
    ["null", null],
    ["undefined", undefined],
  ])("%s → null", (_label, error) => {
    expect(getApiErrorCode(error)).toBeNull();
  });
});

describe("getApiErrorStatus", () => {
  it.each([404, 409, 500])("devuelve el status %i de la respuesta", (status) => {
    expect(getApiErrorStatus(buildAxiosError(status, BACKEND_MESSAGE))).toBe(status);
  });

  it.each([
    ["red (sin response)", buildNetworkError()],
    ["no Axios", new Error("x")],
    ["null", null],
  ])("%s → undefined", (_label, error) => {
    expect(getApiErrorStatus(error)).toBeUndefined();
  });
});
