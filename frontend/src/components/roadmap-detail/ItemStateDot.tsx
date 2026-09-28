import type { RoadmapItemState } from "@/types";
import { CheckIcon } from "./RoadmapDetailIcons";

export interface ItemStateDotProps {
  state: RoadmapItemState;
  /** Tamaño, posición y display por breakpoint; los pone el consumidor. */
  className: string;
  testId: string;
}

const STATE_CLASSES: Record<RoadmapItemState, string> = {
  pending: "border-node-pending bg-bg-base",
  next: "border-node-next bg-accent shadow-node-next",
  in_progress: "border-accent-hover bg-bg-base",
  completed: "border-node-done bg-node-done text-node-done-check",
};

/**
 * Indicador decorativo (`aria-hidden`) del estado de un ítem: nodo del riel en tablet/escritorio y
 * punto delante del número en móvil. Sin `display` propio: el consumidor decide `flex`/`hidden`
 * por breakpoint para no competir con otra utilidad base.
 */
export function ItemStateDot({ state, className, testId }: ItemStateDotProps) {
  return (
    <span
      aria-hidden="true"
      data-testid={testId}
      className={`items-center justify-center rounded-full border-2 ${STATE_CLASSES[state]} ${className}`}
    >
      {state === "completed" ? <CheckIcon className="size-2.5" /> : null}
      {state === "in_progress" ? (
        <span className="block size-1.5 rounded-full bg-accent-hover" />
      ) : null}
    </span>
  );
}
