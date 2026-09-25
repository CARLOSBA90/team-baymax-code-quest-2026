import { canTrack, getStepLabel, getTrackingUnavailableMessage } from "@/lib";
import type { RoadmapItem as RoadmapItemData, RoadmapItemState } from "@/types";
import { CompleteButton } from "./CompleteButton";
import { ExternalCourseLink } from "./ExternalCourseLink";
import { ItemMeta } from "./ItemMeta";
import { ItemStatusChip } from "./ItemStatusChip";
import { ItemThumbnail } from "./ItemThumbnail";
import { CheckIcon } from "./RoadmapDetailIcons";

export interface RoadmapItemProps {
  item: RoadmapItemData;
  /** Posición 1-based en la lista (no el `order` del ítem). */
  stepNumber: number;
  total: number;
  state: RoadmapItemState;
  isLast: boolean;
  isPaused: boolean;
  /** Id del párrafo del banner de pausa; describe el botón deshabilitado en PAUSED. */
  pausedDescriptionId?: string;
}

const NODE_CLASSES: Record<RoadmapItemState, string> = {
  pending: "border-node-pending bg-bg-base",
  next: "border-node-next bg-accent shadow-node-next",
  in_progress: "border-accent-hover bg-bg-base",
  completed: "border-node-done bg-node-done text-node-done-check",
};

const CARD_CLASSES: Record<RoadmapItemState, string> = {
  pending: "bg-bg-item border-border-item",
  next: "bg-bg-item-next border-border-item-next",
  in_progress: "bg-bg-item border-border-item-active",
  completed: "bg-bg-item-done border-border-item-done",
};

/**
 * Paso del timeline: nodo y riel decorativos (`aria-hidden`), miniatura, h3 con la posición como
 * texto real («Paso i de N: …»), chip, meta, descripción y acciones. Completar sigue deshabilitado
 * (slice 4); en pausa el botón se describe con el párrafo del banner. Sin atenuación en pausa.
 */
export function RoadmapItem({
  item,
  stepNumber,
  total,
  state,
  isLast,
  isPaused,
  pausedDescriptionId,
}: RoadmapItemProps) {
  const isCompleted = state === "completed";
  const trackingMessage = isCompleted ? null : getTrackingUnavailableMessage(item.tracking);
  const showCompleteButton = !isCompleted && canTrack(item.tracking);

  return (
    <li className="relative pb-3.5 pl-9 last:pb-0 lg:pl-11" data-state={state}>
      {isLast ? null : (
        <span
          aria-hidden="true"
          data-testid="timeline-rail"
          className={`absolute top-[30px] bottom-0 left-[13px] w-0.5 ${isCompleted ? "bg-rail-done" : "bg-rail"}`}
        />
      )}
      <span
        aria-hidden="true"
        data-testid="timeline-node"
        className={`absolute top-[22px] left-[7px] flex size-3.5 items-center justify-center rounded-full border-2 ${NODE_CLASSES[state]}`}
      >
        {state === "completed" ? <CheckIcon className="size-2.5" /> : null}
        {state === "in_progress" ? (
          <span className="block size-1.5 rounded-full bg-accent-hover" />
        ) : null}
      </span>
      <div
        data-testid="timeline-card"
        className={`flex gap-4 rounded-2xl border px-[18px] py-4 ${CARD_CLASSES[state]}`}
      >
        <ItemThumbnail
          key={item.image ?? "none"}
          src={item.image}
          type={item.type}
          size="md"
          tone={isCompleted ? "done" : "default"}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <h3 className="font-body font-semibold text-[15px] text-text-primary">
              <span className="sr-only">{getStepLabel(stepNumber, total)}:</span>{" "}
              <span aria-hidden="true">{stepNumber} ·</span> {item.name}
            </h3>
            <ItemStatusChip state={state} progress={item.progress} />
          </div>
          <ItemMeta item={item} />
          {item.description ? (
            <p className="line-clamp-2 font-body text-[13px] text-text-secondary">
              {item.description}
            </p>
          ) : null}
          {item.url || showCompleteButton || trackingMessage ? (
            <div className="mt-1.5 flex flex-wrap items-center justify-end gap-3">
              {trackingMessage ? (
                <p className="mr-auto font-body text-[12.5px] text-text-muted">{trackingMessage}</p>
              ) : null}
              {item.url ? (
                <ExternalCourseLink
                  url={item.url}
                  itemName={item.name}
                  variant={state === "next" ? "next" : "ghost"}
                />
              ) : null}
              {showCompleteButton ? (
                <CompleteButton
                  itemName={item.name}
                  describedBy={isPaused ? pausedDescriptionId : undefined}
                />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}
