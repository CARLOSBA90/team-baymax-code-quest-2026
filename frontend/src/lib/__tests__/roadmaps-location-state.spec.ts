import { describe, expect, it } from "vitest";
import { ASSESSMENT_COMPLETED_STATE, isAssessmentCompletedState } from "@/lib";

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
