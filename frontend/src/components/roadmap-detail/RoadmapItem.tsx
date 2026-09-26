import { canTrack, getStepLabel, getTrackingUnavailableMessage } from "@/lib";
import type { RoadmapItem as RoadmapItemData, RoadmapItemState } from "@/types";
import { CompleteButton } from "./CompleteButton";
import { ExternalCourseLink } from "./ExternalCourseLink";
import { ItemMeta } from "./ItemMeta";
import { ItemStateDot } from "./ItemStateDot";
import { ItemStatusChip } from "./ItemStatusChip";
import { ItemThumbnail } from "./ItemThumbnail";

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
 *
 * Mobile-first con un solo DOM: en móvil no hay riel/nodo y el estado lo muestra el punto
 * `item-state-dot` dentro del h3; la fila del título es `display: contents`, así `order-*` pone el
 * chip bajo la meta (solo visual; la lectura sigue h3 → chip → meta). Desde `sm:` la tarjeta vuelve
 * a miniatura | cuerpo + acciones. Acciones en DOM enlace → completar → mensaje de tracking, que
 * desde `sm:` se pinta a la izquierda (`sm:order-first`).
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
    <li className="relative pb-3.5 last:pb-0 sm:pl-7 lg:pl-11" data-state={state}>
      {isLast ? null : (
        <span
          aria-hidden="true"
          data-testid="timeline-rail"
          className={`absolute top-[30px] bottom-0 left-[13px] hidden w-0.5 sm:block ${isCompleted ? "bg-rail-done" : "bg-rail"}`}
        />
      )}
      <ItemStateDot
        testId="timeline-node"
        state={state}
        className="absolute top-[22px] left-[7px] hidden size-3.5 sm:flex"
      />
      <div
        data-testid="timeline-card"
        className={`grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 rounded-2xl border p-3.5 [grid-template-areas:'thumb_body'_'actions_actions'] sm:grid-rows-[auto_1fr] sm:gap-x-4 sm:px-[18px] sm:py-4 sm:[grid-template-areas:'thumb_body'_'thumb_actions'] ${CARD_CLASSES[state]}`}
      >
        <ItemThumbnail
          key={item.image ?? "none"}
          src={item.image}
          type={item.type}
          size="md"
          tone={isCompleted ? "done" : "default"}
          className="[grid-area:thumb] self-start"
        />
        <div className="[grid-area:body] flex min-w-0 flex-col gap-1.5">
          <div className="contents sm:flex sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-1.5">
            <h3 className="line-clamp-2 font-body font-semibold text-[15px] text-text-primary">
              <ItemStateDot
                testId="item-state-dot"
                state={state}
                className="mr-2 inline-flex size-3.75 align-[-2px] sm:hidden"
              />
              <span className="sr-only">{getStepLabel(stepNumber, total)}:</span>{" "}
              <span aria-hidden="true">{stepNumber} ·</span> {item.name}
            </h3>
            <ItemStatusChip
              state={state}
              progress={item.progress}
              className="order-2 self-start sm:order-none sm:self-auto"
            />
          </div>
          <ItemMeta item={item} className="order-1 sm:order-none" />
          {item.description ? (
            <p className="order-3 line-clamp-1 font-body text-[13px] text-text-secondary sm:order-none sm:line-clamp-2">
              {item.description}
            </p>
          ) : null}
        </div>
        {item.url || showCompleteButton || trackingMessage ? (
          <div className="[grid-area:actions] mt-3 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
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
            {trackingMessage ? (
              <p className="min-w-0 font-body text-[12.5px] text-text-muted sm:order-first sm:mr-auto">
                {trackingMessage}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </li>
  );
}
