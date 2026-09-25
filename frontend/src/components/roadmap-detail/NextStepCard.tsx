import { useId } from "react";
import { canTrack, getTrackingUnavailableMessage, isItemCompleted } from "@/lib";
import type { RoadmapItem } from "@/types";
import { CompleteButton } from "./CompleteButton";
import { ExternalCourseLink } from "./ExternalCourseLink";
import { ItemMeta } from "./ItemMeta";
import { ItemThumbnail } from "./ItemThumbnail";

export interface NextStepCardProps {
  item: RoadmapItem;
  /** Posición 1-based del paso en la lista. */
  stepNumber: number;
  total: number;
}

/**
 * «Continúa aquí»: región nombrada por el eyebrow con el siguiente paso (miniatura, h2, meta con
 * posición, descripción en una línea) y sus acciones de 44px. Sin `reason`. Completar sigue
 * deshabilitado (slice 4).
 */
export function NextStepCard({ item, stepNumber, total }: NextStepCardProps) {
  const eyebrowId = useId();
  const isCompleted = isItemCompleted(item);
  const showCompleteButton = !isCompleted && canTrack(item.tracking);
  const trackingMessage = isCompleted ? null : getTrackingUnavailableMessage(item.tracking);

  return (
    <section
      aria-labelledby={eyebrowId}
      className="flex gap-5 rounded-[18px] border border-border-next-step bg-bg-next-step px-[22px] py-5"
    >
      <ItemThumbnail key={item.image ?? "none"} src={item.image} type={item.type} size="lg" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p
          id={eyebrowId}
          className="font-body font-bold text-accent-soft text-xs uppercase tracking-widest"
        >
          Continúa aquí
        </p>
        <h2 className="font-body font-semibold text-[19px] text-text-primary">{item.name}</h2>
        <ItemMeta item={item} step={{ number: stepNumber, total }} />
        {item.description ? (
          <p className="line-clamp-1 font-body text-[13px] text-text-secondary">
            {item.description}
          </p>
        ) : null}
        {item.url || showCompleteButton || trackingMessage ? (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {item.url ? (
              <ExternalCourseLink url={item.url} itemName={item.name} variant="primary" />
            ) : null}
            {showCompleteButton ? <CompleteButton itemName={item.name} size="md" /> : null}
            {trackingMessage ? (
              <p className="font-body text-[12.5px] text-text-muted">{trackingMessage}</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
