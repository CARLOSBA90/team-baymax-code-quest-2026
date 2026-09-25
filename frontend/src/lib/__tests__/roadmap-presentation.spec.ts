import { describe, expect, it } from "vitest";
import { clampProgress, getRoadmapAccent, getRoadmapMonogram, getRoadmapPath } from "@/lib";

describe("getRoadmapMonogram", () => {
  it("usa el monograma del backend si existe", () => {
    expect(getRoadmapMonogram({ name: "Apps móviles con Flutter", monogram: "MO" })).toBe("MO");
  });

  it("deriva 1–2 mayúsculas del nombre si falta", () => {
    const monogram = getRoadmapMonogram({ name: "Apps móviles con Flutter" });
    expect(monogram).toMatch(/^[A-ZÁÉÍÓÚÑ]{1,2}$/);
    expect(monogram).toBe("AM");
  });
});

describe("getRoadmapAccent", () => {
  it("devuelve el accent o neutral", () => {
    expect(getRoadmapAccent({ accent: "cyan" })).toBe("cyan");
    expect(getRoadmapAccent({})).toBe("neutral");
  });
});

describe("getRoadmapPath", () => {
  it("construye la ruta de detalle codificando el id", () => {
    expect(getRoadmapPath("rm-js-ts")).toBe("/dashboard/roadmaps/rm-js-ts");
    expect(getRoadmapPath("a/b c")).toBe("/dashboard/roadmaps/a%2Fb%20c");
  });
});

describe("clampProgress", () => {
  it.each([
    [130, 100],
    [-5, 0],
    [41.6, 42],
    [42, 42],
    [Number.NaN, 0],
  ])("%s → %s", (input, expected) => {
    expect(clampProgress(input)).toBe(expected);
  });
});
