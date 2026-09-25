import { describe, expect, it } from "vitest";
import {
  getRoadmapCoursesSubtitle,
  getRoadmapsCountLabel,
  getRoadmapsSummary,
  ROADMAP_ACTION_LABELS,
  ROADMAP_FILTER_EMPTY_MESSAGES,
  ROADMAP_LEVEL_LABELS,
  ROADMAP_STATUS_LABELS,
} from "@/lib";

describe("roadmap labels", () => {
  it("etiqueta cada estado", () => {
    expect(ROADMAP_STATUS_LABELS).toEqual({
      IN_PROGRESS: "Empezada",
      PAUSED: "En pausa",
      COMPLETED: "Completada",
      NOT_STARTED: "Sin empezar",
    });
  });

  it("etiqueta cada nivel", () => {
    expect(ROADMAP_LEVEL_LABELS).toEqual({
      beginner: "Básico",
      intermediate: "Intermedio",
      advanced: "Avanzado",
    });
  });

  it.each([
    ["IN_PROGRESS", "Continuar"],
    ["PAUSED", "Reanudar"],
    ["COMPLETED", "Ver ruta"],
    ["NOT_STARTED", "Empezar"],
  ] as const)("la acción de %s es %s", (status, label) => {
    expect(ROADMAP_ACTION_LABELS[status]).toBe(label);
  });

  it("mensajes vacíos por filtro", () => {
    expect(ROADMAP_FILTER_EMPTY_MESSAGES).toEqual({
      in_progress: "No tienes rutas empezadas.",
      paused: "No tienes rutas en pausa.",
      completed: "No tienes rutas completadas.",
    });
  });
});

describe("getRoadmapCoursesSubtitle", () => {
  it("combina cursos y nivel", () => {
    expect(getRoadmapCoursesSubtitle(7, "intermediate")).toBe("7 cursos · Intermedio");
    expect(getRoadmapCoursesSubtitle(6, "advanced")).toBe("6 cursos · Avanzado");
  });

  it("usa singular con 1 curso", () => {
    expect(getRoadmapCoursesSubtitle(1, "beginner")).toBe("1 curso · Básico");
  });

  it("omite el nivel y el separador si level es null", () => {
    const subtitle = getRoadmapCoursesSubtitle(3, null);
    expect(subtitle).toBe("3 cursos");
    expect(subtitle).not.toContain("·");
  });
});

describe("getRoadmapsSummary", () => {
  it("resume counts globales", () => {
    expect(
      getRoadmapsSummary({ all: 5, notStarted: 0, inProgress: 2, paused: 1, completed: 2 }),
    ).toBe("5 rutas · 2 en curso · 2 completadas");
  });

  it("usa singulares", () => {
    expect(
      getRoadmapsSummary({ all: 1, notStarted: 0, inProgress: 0, paused: 0, completed: 1 }),
    ).toBe("1 ruta · 0 en curso · 1 completada");
  });
});

describe("getRoadmapsCountLabel", () => {
  it.each([
    [0, "0 rutas"],
    [1, "1 ruta"],
    [5, "5 rutas"],
  ])("%i → %s", (count, expected) => {
    expect(getRoadmapsCountLabel(count)).toBe(expected);
  });
});
