import {
  getRoadmapDeletedMessage,
  ROADMAP_DELETE_NOT_FOUND_MESSAGE,
} from "./roadmap-delete-errors";

// `location.state` con el que otras pantallas llegan a Mis Rutas (`/dashboard/roadmaps`) para que
// muestre un aviso una sola vez.

/**
 * `location.state` con el que `AssessmentPage` navega a Mis Rutas tras un envío correcto cuyo
 * roadmap no se pudo generar (con ruta generada navega a su detalle, sin state).
 */
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

/**
 * `location.state` con el que el detalle navega a Mis Rutas tras borrar la ruta. Lleva el nombre
 * y si el borrado fue un 404 (`notFound`); el texto del aviso se deriva al leerlo.
 */
export interface RoadmapDeletedState {
  roadmapDeleted: { name: string; notFound: boolean };
}

export function buildRoadmapDeletedState(name: string, notFound: boolean): RoadmapDeletedState {
  return { roadmapDeleted: { name, notFound } };
}

export function isRoadmapDeletedState(state: unknown): state is RoadmapDeletedState {
  if (typeof state !== "object" || state === null) return false;
  const deleted: unknown = (state as { roadmapDeleted?: unknown }).roadmapDeleted;
  if (typeof deleted !== "object" || deleted === null) return false;
  const { name, notFound } = deleted as { name?: unknown; notFound?: unknown };
  return typeof name === "string" && name !== "" && typeof notFound === "boolean";
}

/** Aviso de llegada a Mis Rutas derivado de `location.state`. */
export type RoadmapsArrivalNotice =
  | { kind: "assessment-completed" }
  | { kind: "roadmap-deleted"; message: string };

/** `location.state` → aviso de llegada (o `null` si no es ninguno de los conocidos). Pura. */
export function parseRoadmapsArrivalState(state: unknown): RoadmapsArrivalNotice | null {
  if (isAssessmentCompletedState(state)) return { kind: "assessment-completed" };
  if (isRoadmapDeletedState(state)) {
    const { name, notFound } = state.roadmapDeleted;
    return {
      kind: "roadmap-deleted",
      message: notFound ? ROADMAP_DELETE_NOT_FOUND_MESSAGE : getRoadmapDeletedMessage(name),
    };
  }
  return null;
}
