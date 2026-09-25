import { describe, expect, it } from "vitest";
import {
  canTrack,
  formatHours,
  formatRelative,
  getCompletedCount,
  getItemState,
  getRemainingMinutes,
  getRoadmapProgressSummary,
  getRoadmapProgressValueText,
  getRoadmapStepsProgressLabel,
  getStepsCompletedLabel,
  getTotalMinutes,
  ITEM_COMPLETED_PROGRESS,
  isItemCompleted,
} from "@/lib";
import { buildRoadmapItem } from "@/test/fixtures/roadmap-detail";

const STARTED_AT = "2026-09-20T12:00:00Z";

describe("isItemCompleted", () => {
  it("es true desde ITEM_COMPLETED_PROGRESS (100) en adelante", () => {
    expect(ITEM_COMPLETED_PROGRESS).toBe(100);
    expect(isItemCompleted({ progress: 100 })).toBe(true);
    expect(isItemCompleted({ progress: 100.5 })).toBe(true);
  });

  it("es false por debajo de 100", () => {
    expect(isItemCompleted({ progress: 99.99 })).toBe(false);
    expect(isItemCompleted({ progress: 0 })).toBe(false);
  });
});

describe("getItemState", () => {
  it("completed gana a next", () => {
    const item = buildRoadmapItem({ roadmapItemId: "a", progress: 100, startedAt: STARTED_AT });
    expect(getItemState(item, "a")).toBe("completed");
  });

  it("next gana a in_progress", () => {
    const item = buildRoadmapItem({ roadmapItemId: "a", progress: 40, startedAt: STARTED_AT });
    expect(getItemState(item, "a")).toBe("next");
  });

  it("in_progress si está empezado y no es el siguiente", () => {
    const item = buildRoadmapItem({ roadmapItemId: "a", progress: 40, startedAt: STARTED_AT });
    expect(getItemState(item, "b")).toBe("in_progress");
  });

  it("pending sin startedAt, con nextStepId null o undefined", () => {
    const item = buildRoadmapItem({ roadmapItemId: "a", progress: 0, startedAt: null });
    expect(getItemState(item, null)).toBe("pending");
    expect(getItemState(item, undefined)).toBe("pending");
    expect(getItemState(item)).toBe("pending");
  });

  it("progreso decimal por encima de 100 → completed", () => {
    expect(getItemState(buildRoadmapItem({ progress: 100.5 }), null)).toBe("completed");
  });
});

describe("canTrack", () => {
  it("true para READING y COMPLETION habilitados", () => {
    expect(canTrack({ type: "READING", enabled: true })).toBe(true);
    expect(canTrack({ type: "COMPLETION", enabled: true })).toBe(true);
  });

  it("false si está deshabilitado", () => {
    expect(canTrack({ type: "COMPLETION", enabled: false })).toBe(false);
    expect(canTrack({ type: "READING", enabled: false })).toBe(false);
  });

  it("false para tipos no completables desde el front", () => {
    expect(canTrack({ type: "VIDEO", enabled: true })).toBe(false);
    expect(canTrack({ type: "LESSONS", enabled: true })).toBe(false);
    expect(canTrack({ type: "CHALLENGE", enabled: true })).toBe(false);
  });

  it("false para un tipo desconocido", () => {
    expect(canTrack({ type: "QUIZ", enabled: true })).toBe(false);
  });
});

describe("minutos y completados", () => {
  it("getTotalMinutes suma tratando null como 0", () => {
    const items = [
      buildRoadmapItem({ estimatedMinutes: 60 }),
      buildRoadmapItem({ estimatedMinutes: null }),
      buildRoadmapItem({ estimatedMinutes: 90 }),
    ];
    expect(getTotalMinutes(items)).toBe(150);
  });

  it("getRemainingMinutes excluye completados y getCompletedCount los cuenta", () => {
    const items = [
      buildRoadmapItem({ estimatedMinutes: 60, progress: 100 }),
      buildRoadmapItem({ estimatedMinutes: 90, progress: 40 }),
      buildRoadmapItem({ estimatedMinutes: null, progress: 0 }),
    ];
    expect(getRemainingMinutes(items)).toBe(90);
    expect(getCompletedCount(items)).toBe(1);
  });

  it("lista vacía → 0 en los tres", () => {
    expect(getTotalMinutes([])).toBe(0);
    expect(getRemainingMinutes([])).toBe(0);
    expect(getCompletedCount([])).toBe(0);
  });
});

describe("formatHours", () => {
  it.each([
    [45, "45 min"],
    [0, "0 min"],
    [44.6, "45 min"],
    [60, "1 h"],
    [89, "1 h"],
    [90, "2 h"],
    [1560, "26 h"],
    [-10, "0 min"],
  ])("%s → %s", (minutes, expected) => {
    expect(formatHours(minutes)).toBe(expected);
  });
});

describe("formatRelative", () => {
  const NOW = new Date("2026-09-25T12:00:00Z");
  const SECOND = 1000;
  const MINUTE = 60 * SECOND;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;
  const ago = (ms: number) => new Date(NOW.getTime() - ms).toISOString();

  it.each([
    [0, "ahora"],
    [10 * SECOND, "hace 10 segundos"],
    [5 * MINUTE, "hace 5 minutos"],
    [2 * HOUR, "hace 2 horas"],
    [DAY, "ayer"],
    [6 * DAY, "hace 6 días"],
  ])("hace %s ms → %s", (ms, expected) => {
    expect(formatRelative(ago(ms), NOW)).toBe(expected);
  });

  it("a partir de 7 días usa la fecha corta sin año (mismo año)", () => {
    expect(formatRelative(ago(7 * DAY), NOW)).toBe("18 sept");
    expect(formatRelative("2026-08-12T12:00:00Z", NOW)).toBe("12 ago");
  });

  it("añade el año si difiere del de now", () => {
    expect(formatRelative("2025-08-12T12:00:00Z", NOW)).toBe("12 ago 2025");
    expect(formatRelative("2025-12-20T12:00:00Z", new Date("2026-01-10T12:00:00Z"))).toBe(
      "20 dic 2025",
    );
  });

  it("por debajo de 7 días es relativo aunque cruce el año", () => {
    expect(formatRelative("2025-12-30T12:00:00Z", new Date("2026-01-02T12:00:00Z"))).toBe(
      "hace 3 días",
    );
  });

  it("una fecha futura se trata como ahora", () => {
    const result = formatRelative(new Date(NOW.getTime() + 5 * MINUTE).toISOString(), NOW);
    expect(result).toBe("ahora");
    expect(result).not.toContain("dentro de");
  });

  it("un ISO inválido devuelve cadena vacía sin lanzar", () => {
    expect(() => formatRelative("no-es-fecha", NOW)).not.toThrow();
    expect(formatRelative("no-es-fecha", NOW)).toBe("");
  });

  it("usa la fecha actual si no se inyecta now", () => {
    expect(formatRelative(new Date().toISOString())).toBe("ahora");
  });
});

describe("getRoadmapStepsProgressLabel", () => {
  it.each([
    [1, 4, "1 de 4 pasos"],
    [0, 1, "0 de 1 paso"],
    [0, 0, "0 de 0 pasos"],
  ])("(%s, %s) → %s", (completed, total, expected) => {
    expect(getRoadmapStepsProgressLabel(completed, total)).toBe(expected);
  });
});

describe("getStepsCompletedLabel", () => {
  it.each([
    [2, 5, "2 de 5 pasos completados"],
    [1, 1, "1 de 1 paso completado"],
    [0, 1, "0 de 1 paso completado"],
    [0, 0, "0 de 0 pasos completados"],
  ])("(%s, %s) → %s", (completed, total, expected) => {
    expect(getStepsCompletedLabel(completed, total)).toBe(expected);
  });
});

describe("getRoadmapProgressValueText", () => {
  it.each([
    [40, 2, 5, "40 por ciento. 2 de 5 pasos completados."],
    [33.33, 1, 3, "33 por ciento. 1 de 3 pasos completados."],
    [100.4, 5, 5, "100 por ciento. 5 de 5 pasos completados."],
    [0, 0, 1, "0 por ciento. 0 de 1 paso completado."],
  ])("(%s, %s, %s) → %s", (progress, completed, total, expected) => {
    expect(getRoadmapProgressValueText(progress, completed, total)).toBe(expected);
  });
});

describe("getRoadmapProgressSummary", () => {
  it("en curso: pasos, total y lo que queda", () => {
    expect(
      getRoadmapProgressSummary({
        completed: 2,
        total: 5,
        totalMinutes: 4620,
        remainingMinutes: 3060,
        isCompleted: false,
      }),
    ).toBe("2 de 5 pasos · 77 h en total · quedan ~51 h");
  });

  it("completada: sin «quedan»", () => {
    expect(
      getRoadmapProgressSummary({
        completed: 5,
        total: 5,
        totalMinutes: 4620,
        remainingMinutes: 0,
        isCompleted: true,
      }),
    ).toBe("5 de 5 pasos · 77 h en total");
  });

  it("completada con minutos restantes (datos incoherentes): tampoco «quedan»", () => {
    expect(
      getRoadmapProgressSummary({
        completed: 4,
        total: 5,
        totalMinutes: 4620,
        remainingMinutes: 60,
        isCompleted: true,
      }),
    ).toBe("4 de 5 pasos · 77 h en total");
  });

  it("sin completar pero sin minutos restantes: sin «quedan»", () => {
    expect(
      getRoadmapProgressSummary({
        completed: 1,
        total: 2,
        totalMinutes: 120,
        remainingMinutes: 0,
        isCompleted: false,
      }),
    ).toBe("1 de 2 pasos · 2 h en total");
  });

  it("singular y minutos por debajo de una hora", () => {
    expect(
      getRoadmapProgressSummary({
        completed: 0,
        total: 1,
        totalMinutes: 45,
        remainingMinutes: 45,
        isCompleted: false,
      }),
    ).toBe("0 de 1 paso · 45 min en total · quedan ~45 min");
  });

  it("sin minutos: solo los pasos", () => {
    expect(
      getRoadmapProgressSummary({
        completed: 0,
        total: 0,
        totalMinutes: 0,
        remainingMinutes: 0,
        isCompleted: false,
      }),
    ).toBe("0 de 0 pasos");
  });
});
