/** `location.state` con el que `AssessmentPage` navega a Mis Rutas tras un envío correcto. */
export interface AssessmentCompletedState {
  assessmentCompleted: true;
}

export const ASSESSMENT_COMPLETED_STATE: AssessmentCompletedState = { assessmentCompleted: true };

export function isAssessmentCompletedState(state: unknown): state is AssessmentCompletedState {
  return (
    typeof state === "object" &&
    state !== null &&
    (state as { assessmentCompleted?: unknown }).assessmentCompleted === true
  );
}
