import { describe, expect, it } from "vitest";
import {
  getPauseRoadmapErrorMessage,
  getPauseToggleAnnouncement,
  isInvalidRoadmapTransitionError,
  isRoadmapUpdatedElsewhereError,
  isRoadmapVersionConflictError,
  ROADMAP_PAUSED_ANNOUNCEMENT,
  ROADMAP_RESUMED_ANNOUNCEMENT,
  ROADMAP_UPDATED_ELSEWHERE_MESSAGE,
  shouldRefreshAfterPauseError,
} from "@/lib";
import { buildAxiosError, buildNetworkError } from "@/test/fixtures/api-errors";
import {
  buildInvalidRoadmapTransitionError,
  buildRoadmapNotFoundError,
  buildRoadmapVersionConflictError,
} from "@/test/fixtures/roadmap-pause";
import type { RoadmapStatus } from "@/types";

const NETWORK_MESSAGE =
  "No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.";
const PAUSE_GENERIC_MESSAGE = "No se pudo pausar la ruta. Inténtalo de nuevo.";
const RESUME_GENERIC_MESSAGE = "No se pudo reanudar la ruta. Inténtalo de nuevo.";
const BACKEND_MESSAGE = "Backend says no";

interface Case {
  label: string;
  error: unknown;
  versionConflict: boolean;
  invalidTransition: boolean;
  refresh: boolean;
  network: boolean;
}

const CASES: Case[] = [
  {
    label: "409 ROADMAP_VERSION_CONFLICT",
    error: buildRoadmapVersionConflictError(),
    versionConflict: true,
    invalidTransition: false,
    refresh: true,
    network: false,
  },
  {
    label: "409 INVALID_ROADMAP_TRANSITION",
    error: buildInvalidRoadmapTransitionError(),
    versionConflict: false,
    invalidTransition: true,
    refresh: true,
    network: false,
  },
  {
    label: "404 ROADMAP_NOT_FOUND",
    error: buildRoadmapNotFoundError(),
    versionConflict: false,
    invalidTransition: false,
    refresh: true,
    network: false,
  },
  {
    label: "404 sin code",
    error: buildAxiosError(404, BACKEND_MESSAGE),
    versionConflict: false,
    invalidTransition: false,
    refresh: true,
    network: false,
  },
  {
    label: "409 con otro code",
    error: buildAxiosError(409, BACKEND_MESSAGE, { code: "ROADMAP_PAUSED" }),
    versionConflict: false,
    invalidTransition: false,
    refresh: false,
    network: false,
  },
  {
    label: "409 sin code",
    error: buildAxiosError(409, BACKEND_MESSAGE),
    versionConflict: false,
    invalidTransition: false,
    refresh: false,
    network: false,
  },
  {
    label: "409 con code no string",
    error: buildAxiosError(409, BACKEND_MESSAGE, { code: 42 }),
    versionConflict: false,
    invalidTransition: false,
    refresh: false,
    network: false,
  },
  {
    label: "400 con code de conflicto",
    error: buildAxiosError(400, BACKEND_MESSAGE, { code: "ROADMAP_VERSION_CONFLICT" }),
    versionConflict: false,
    invalidTransition: false,
    refresh: false,
    network: false,
  },
  {
    label: "401",
    error: buildAxiosError(401, BACKEND_MESSAGE),
    versionConflict: false,
    invalidTransition: false,
    refresh: false,
    network: false,
  },
  {
    label: "500",
    error: buildAxiosError(500, BACKEND_MESSAGE),
    versionConflict: false,
    invalidTransition: false,
    refresh: false,
    network: false,
  },
  {
    label: "red (sin response)",
    error: buildNetworkError(),
    versionConflict: false,
    invalidTransition: false,
    refresh: false,
    network: true,
  },
  {
    label: "no Axios",
    error: new Error(BACKEND_MESSAGE),
    versionConflict: false,
    invalidTransition: false,
    refresh: false,
    network: false,
  },
];

describe("clasificación de errores de pausar/reanudar", () => {
  it.each(CASES)("$label", ({ error, versionConflict, invalidTransition, refresh, network }) => {
    expect(isRoadmapVersionConflictError(error)).toBe(versionConflict);
    expect(isInvalidRoadmapTransitionError(error)).toBe(invalidTransition);
    expect(isRoadmapUpdatedElsewhereError(error)).toBe(versionConflict || invalidTransition);
    expect(shouldRefreshAfterPauseError(error)).toBe(refresh);

    expect(getPauseRoadmapErrorMessage(error, true)).toBe(
      network ? NETWORK_MESSAGE : PAUSE_GENERIC_MESSAGE,
    );
    expect(getPauseRoadmapErrorMessage(error, false)).toBe(
      network ? NETWORK_MESSAGE : RESUME_GENERIC_MESSAGE,
    );
    for (const paused of [true, false]) {
      expect(getPauseRoadmapErrorMessage(error, paused)).not.toContain(BACKEND_MESSAGE);
    }
  });
});

describe("getPauseToggleAnnouncement", () => {
  it.each<[RoadmapStatus, string | null]>([
    ["PAUSED", ROADMAP_PAUSED_ANNOUNCEMENT],
    ["IN_PROGRESS", ROADMAP_RESUMED_ANNOUNCEMENT],
    ["NOT_STARTED", ROADMAP_RESUMED_ANNOUNCEMENT],
    ["COMPLETED", null],
  ])("%s → %s", (status, expected) => {
    expect(getPauseToggleAnnouncement(status)).toBe(expected);
  });

  it("un estado desconocido no anuncia nada", () => {
    expect(getPauseToggleAnnouncement("ARCHIVED" as RoadmapStatus)).toBeNull();
  });
});

describe("copy de pausar/reanudar", () => {
  it("tiene los textos exactos", () => {
    expect(ROADMAP_UPDATED_ELSEWHERE_MESSAGE).toBe(
      "Alguien actualizó esta ruta desde otro lugar. Ya tienes la versión más reciente.",
    );
    expect(ROADMAP_PAUSED_ANNOUNCEMENT).toBe(
      "Ruta pausada. Mientras esté pausada no se registra tu avance.",
    );
    expect(ROADMAP_RESUMED_ANNOUNCEMENT).toBe("Ruta reanudada. Ya puedes registrar tu avance.");
  });
});
