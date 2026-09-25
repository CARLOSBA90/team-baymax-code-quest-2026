import { describe, expect, it } from "vitest";
import {
  canTrack,
  formatHours,
  formatRelative,
  formatShortDate,
  getCompletedCount,
  getItemMeta,
  getItemState,
  getItemTypeLabel,
  getNextStepItem,
  getRemainingMinutes,
  getRoadmapProgressSummary,
  getRoadmapProgressValueText,
  getRoadmapStepsProgressLabel,
  getStepLabel,
  getStepsCompletedLabel,
  getTotalMinutes,
  getTrackingUnavailableMessage,
  ITEM_COMPLETED_PROGRESS,
  isItemCompleted,
  TRACKING_UNAVAILABLE_MESSAGES,
} from "@/lib";
import { buildRoadmapItem } from "@/test/fixtures/roadmap-detail";
import type { RoadmapItemTracking } from "@/types";

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

describe("formatShortDate", () => {
  const NOW = new Date("2026-09-25T12:00:00Z");

  it("omite el año si coincide con el de now", () => {
    expect(formatShortDate("2026-08-12T12:00:00Z", NOW)).toBe("12 ago");
  });

  it("añade el año si difiere del de now", () => {
    expect(formatShortDate("2025-08-12T12:00:00Z", NOW)).toBe("12 ago 2025");
  });

  it("un ISO inválido devuelve cadena vacía sin lanzar", () => {
    expect(() => formatShortDate("no-es-fecha", NOW)).not.toThrow();
    expect(formatShortDate("no-es-fecha", NOW)).toBe("");
  });

  it("coincide con la rama ≥7 días de formatRelative", () => {
    expect(formatRelative("2026-08-12T12:00:00Z", NOW)).toBe(
      formatShortDate("2026-08-12T12:00:00Z", NOW),
    );
  });
});

describe("getStepLabel", () => {
  it("«Paso i de N»", () => {
    expect(getStepLabel(3, 5)).toBe("Paso 3 de 5");
  });

  it("usa la posición en la lista, no el `order` del ítem", () => {
    const items = [
      buildRoadmapItem({ roadmapItemId: "a", order: 10 }),
      buildRoadmapItem({ roadmapItemId: "b", order: 20 }),
      buildRoadmapItem({ roadmapItemId: "c", order: 30 }),
    ];
    const index = items.findIndex((item) => item.order === 20);
    expect(getStepLabel(index + 1, items.length)).toBe("Paso 2 de 3");
  });
});

describe("getItemTypeLabel", () => {
  it.each([
    ["COURSE", null],
    ["MEDIA", "Recurso"],
    ["CHALLENGE", "Reto"],
    ["PODCAST", "PODCAST"],
    ["toString", "toString"],
  ])("%s → %s", (type, expected) => {
    expect(getItemTypeLabel(type)).toBe(expected);
  });
});

describe("getItemMeta", () => {
  const NOW = new Date("2026-09-25T12:00:00Z");

  it("curso completado: nivel, horas y fecha de compleción", () => {
    const item = buildRoadmapItem({
      level: "beginner",
      estimatedMinutes: 720,
      completedAt: "2026-08-12T12:00:00Z",
    });
    expect(getItemMeta(item, { now: NOW })).toBe("Básico · 12 h · completado el 12 ago");
  });

  it("curso pendiente: nivel y horas", () => {
    const item = buildRoadmapItem({ level: "intermediate", estimatedMinutes: 540 });
    expect(getItemMeta(item, { now: NOW })).toBe("Intermedio · 9 h");
  });

  it("sin nivel ni minutos → cadena vacía", () => {
    const item = buildRoadmapItem({ level: null, estimatedMinutes: null });
    expect(getItemMeta(item, { now: NOW })).toBe("");
  });

  it("sin nivel con minutos → solo la duración", () => {
    const item = buildRoadmapItem({ level: null, estimatedMinutes: 45 });
    expect(getItemMeta(item, { now: NOW })).toBe("45 min");
  });

  it("MEDIA sin nivel ni minutos → «Recurso»", () => {
    const item = buildRoadmapItem({ type: "MEDIA", level: null, estimatedMinutes: null });
    expect(getItemMeta(item, { now: NOW })).toBe("Recurso");
  });

  it("CHALLENGE y tipo desconocido van primero", () => {
    expect(
      getItemMeta(buildRoadmapItem({ type: "CHALLENGE", level: "advanced", estimatedMinutes: 90 })),
    ).toBe("Reto · Avanzado · 2 h");
    expect(getItemMeta(buildRoadmapItem({ type: "PODCAST", estimatedMinutes: null }))).toBe(
      "PODCAST",
    );
  });

  it("completedAt null o inválido → sin «completado el»", () => {
    const base = { level: "beginner" as const, estimatedMinutes: 120 };
    expect(getItemMeta(buildRoadmapItem({ ...base, completedAt: null }), { now: NOW })).toBe(
      "Básico · 2 h",
    );
    expect(getItemMeta(buildRoadmapItem({ ...base, completedAt: "x" }), { now: NOW })).toBe(
      "Básico · 2 h",
    );
  });

  it("con paso: «Paso i de N» delante", () => {
    const item = buildRoadmapItem({ level: "beginner", estimatedMinutes: 1560 });
    expect(getItemMeta(item, { step: { number: 3, total: 5 }, now: NOW })).toBe(
      "Paso 3 de 5 · Básico · 26 h",
    );
  });

  it("beginner es «Básico», nunca «Principiante»", () => {
    const meta = getItemMeta(buildRoadmapItem({ level: "beginner" }));
    expect(meta).toContain("Básico");
    expect(meta).not.toContain("Principiante");
  });
});

describe("getTrackingUnavailableMessage", () => {
  const METADATA = "Aún no podemos registrar el avance de este curso.";
  const AUTOMATIC = "El avance de este curso se registra automáticamente.";
  const CHALLENGE = "El avance se registra al enviar el reto.";
  const GENERIC = "No se puede marcar como completado desde aquí.";
  const tracking = (
    type: string,
    enabled: boolean,
    disabledReason: string | null = null,
  ): RoadmapItemTracking => ({ type, enabled, disabledReason });

  it.each<[string, RoadmapItemTracking, string | null]>([
    ["COMPLETION habilitado", tracking("COMPLETION", true), null],
    ["READING habilitado", tracking("READING", true), null],
    [
      "TRACKING_METADATA_MISSING",
      tracking("COMPLETION", false, "TRACKING_METADATA_MISSING"),
      METADATA,
    ],
    ["SYLLABUS_MISSING", tracking("LESSONS", false, "SYLLABUS_MISSING"), METADATA],
    ["VIDEO habilitado", tracking("VIDEO", true), AUTOMATIC],
    ["LESSONS habilitado", tracking("LESSONS", true), AUTOMATIC],
    ["CHALLENGE habilitado", tracking("CHALLENGE", true), CHALLENGE],
    [
      "CHALLENGE con disabledReason (tiene precedencia)",
      tracking("CHALLENGE", false, "TRACKING_METADATA_MISSING"),
      METADATA,
    ],
    ["código desconocido", tracking("COMPLETION", false, "SOMETHING_NEW"), GENERIC],
    ["tipo desconocido", tracking("QUIZ", true), GENERIC],
  ])("%s", (_label, value, expected) => {
    expect(getTrackingUnavailableMessage(value)).toBe(expected);
  });

  it("nunca contiene el código crudo", () => {
    const message = getTrackingUnavailableMessage(tracking("COMPLETION", false, "SOMETHING_NEW"));
    expect(message).not.toContain("SOMETHING_NEW");
    for (const code of Object.keys(TRACKING_UNAVAILABLE_MESSAGES)) {
      expect(TRACKING_UNAVAILABLE_MESSAGES[code]).not.toContain(code);
    }
  });

  it("mapea los códigos reales del backend", () => {
    expect(TRACKING_UNAVAILABLE_MESSAGES).toEqual({
      TRACKING_METADATA_MISSING: METADATA,
      SYLLABUS_MISSING: METADATA,
    });
  });
});

describe("getNextStepItem", () => {
  const items = ["a", "b", "c", "d"].map((id, i) =>
    buildRoadmapItem({ roadmapItemId: id, order: (i + 1) * 10, name: `Paso ${id}` }),
  );

  it("resuelve el ítem del siguiente paso con su posición 1-based", () => {
    expect(getNextStepItem(items, { roadmapItemId: "c", name: "Paso c", url: null })).toEqual({
      item: items[2],
      stepNumber: 3,
    });
  });

  it("sin nextStep → null", () => {
    expect(getNextStepItem(items, null)).toBeNull();
  });

  it("id huérfano (no está en los ítems) → null", () => {
    expect(getNextStepItem(items, { roadmapItemId: "zz", name: "X", url: null })).toBeNull();
  });
});
