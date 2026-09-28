import { describe, expect, it } from "vitest";
import {
  ASSESSMENT_COMPLETED_STATE,
  buildRoadmapDeletedState,
  isAssessmentCompletedState,
  isRoadmapDeletedState,
  parseRoadmapsArrivalState,
  ROADMAP_DELETE_NOT_FOUND_MESSAGE,
} from "@/lib";

describe("isAssessmentCompletedState", () => {
  it("es true con { assessmentCompleted: true }", () => {
    expect(isAssessmentCompletedState({ assessmentCompleted: true })).toBe(true);
  });

  it("es true con ASSESSMENT_COMPLETED_STATE", () => {
    expect(isAssessmentCompletedState(ASSESSMENT_COMPLETED_STATE)).toBe(true);
  });

  it.each([
    ["null", null],
    ["undefined", undefined],
    ["un string", "x"],
    ["un objeto vacío", {}],
    ["un objeto con otra forma", { foo: 1 }],
    ["assessmentCompleted como string", { assessmentCompleted: "true" }],
  ])("es false con %s", (_label, state) => {
    expect(isAssessmentCompletedState(state)).toBe(false);
  });
});

describe("buildRoadmapDeletedState / isRoadmapDeletedState", () => {
  it("construye el state de borrado con nombre y notFound", () => {
    expect(buildRoadmapDeletedState("Frontend moderno", false)).toEqual({
      roadmapDeleted: { name: "Frontend moderno", notFound: false },
    });
  });

  it.each([false, true])("el guard acepta el state construido (notFound %s)", (notFound) => {
    expect(isRoadmapDeletedState(buildRoadmapDeletedState("Frontend moderno", notFound))).toBe(
      true,
    );
  });

  it("no se confunde con el state del cuestionario", () => {
    expect(isRoadmapDeletedState(ASSESSMENT_COMPLETED_STATE)).toBe(false);
    expect(isAssessmentCompletedState(buildRoadmapDeletedState("Frontend moderno", false))).toBe(
      false,
    );
  });
});

describe("parseRoadmapsArrivalState", () => {
  it("borrado con éxito → mensaje con el nombre y variant success", () => {
    expect(parseRoadmapsArrivalState(buildRoadmapDeletedState("Frontend moderno", false))).toEqual({
      kind: "roadmap-deleted",
      message: "Ruta «Frontend moderno» eliminada",
      variant: "success",
    });
  });

  it("borrado con 404 → mensaje neutro y variant info", () => {
    expect(parseRoadmapsArrivalState(buildRoadmapDeletedState("Frontend moderno", true))).toEqual({
      kind: "roadmap-deleted",
      message: ROADMAP_DELETE_NOT_FOUND_MESSAGE,
      variant: "info",
    });
  });

  it("cuestionario completado → assessment-completed", () => {
    expect(parseRoadmapsArrivalState(ASSESSMENT_COMPLETED_STATE)).toEqual({
      kind: "assessment-completed",
    });
  });

  it.each([
    ["null", null],
    ["undefined", undefined],
    ["un string", "x"],
    ["un objeto vacío", {}],
    ["roadmapDeleted null", { roadmapDeleted: null }],
    ["roadmapDeleted string", { roadmapDeleted: "x" }],
    ["name numérico", { roadmapDeleted: { name: 42, notFound: false } }],
    ["name vacío", { roadmapDeleted: { name: "", notFound: false } }],
    ["sin notFound", { roadmapDeleted: { name: "Frontend moderno" } }],
    ["notFound no booleano", { roadmapDeleted: { name: "Frontend moderno", notFound: "no" } }],
  ])("con %s el guard es false y el parse null", (_label, state) => {
    expect(isRoadmapDeletedState(state)).toBe(false);
    expect(parseRoadmapsArrivalState(state)).toBeNull();
  });
});
