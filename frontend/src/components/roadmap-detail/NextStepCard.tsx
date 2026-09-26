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
 * posición, descripción en una línea) y sus acciones. Sin `reason`. Completar sigue deshabilitado
 * (slice 4).
 *
 * Mobile-first con un solo DOM (eyebrow → miniatura → título → descripción → acciones) colocado
 * con `grid-template-areas`: en móvil el eyebrow ocupa la primera fila, miniatura y título
 * comparten la segunda y descripción y acciones van a ancho completo, con las acciones apiladas
 * (48px, «Ir al curso» primero). Desde `sm:` la miniatura abarca toda la columna izquierda y las
 * acciones van en una fila sin wrap (44px), como en escritorio. Las áreas ausentes (sin
 * descripción o sin acciones) quedan en filas de 0px porque no hay `gap-y`: el espacio vertical
 * son los `mt-*` de los hijos presentes.
 */
export function NextStepCard({ item, stepNumber, total }: NextStepCardProps) {
  const eyebrowId = useId();
  const isCompleted = isItemCompleted(item);
  const showCompleteButton = !isCompleted && canTrack(item.tracking);
  const trackingMessage = isCompleted ? null : getTrackingUnavailableMessage(item.tracking);

  return (
    <section
      aria-labelledby={eyebrowId}
      className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 rounded-[18px] border border-border-next-step bg-bg-next-step p-4 [grid-template-areas:'eyebrow_eyebrow'_'thumb_title'_'desc_desc'_'actions_actions'] sm:grid-rows-[auto_auto_auto_1fr] sm:gap-x-5 sm:px-[22px] sm:py-5 sm:[grid-template-areas:'thumb_eyebrow'_'thumb_title'_'thumb_desc'_'thumb_actions']"
    >
      <p
        id={eyebrowId}
        className="font-body font-bold text-accent-soft text-xs uppercase tracking-widest [grid-area:eyebrow]"
      >
        Continúa aquí
      </p>
      <ItemThumbnail
        key={item.image ?? "none"}
        src={item.image}
        type={item.type}
        size="lg"
        className="mt-3.5 self-start [grid-area:thumb] sm:mt-0"
      />
      <div className="mt-3.5 flex min-w-0 flex-col gap-1.5 self-center [grid-area:title] sm:mt-1.5 sm:self-auto">
        <h2 className="font-body font-semibold text-[17px] text-text-primary sm:text-[19px]">
          {item.name}
        </h2>
        <ItemMeta item={item} step={{ number: stepNumber, total }} />
      </div>
      {item.description ? (
        <p className="mt-3 line-clamp-1 font-body text-[13px] text-text-secondary [grid-area:desc] sm:mt-1.5">
          {item.description}
        </p>
      ) : null}
      {item.url || showCompleteButton || trackingMessage ? (
        <div className="mt-3.5 flex flex-col gap-2.5 [grid-area:actions] sm:mt-3 sm:flex-row sm:items-center sm:gap-3">
          {item.url ? (
            <ExternalCourseLink url={item.url} itemName={item.name} variant="primary" />
          ) : null}
          {showCompleteButton ? <CompleteButton itemName={item.name} size="md" /> : null}
          {trackingMessage ? (
            <p className="min-w-0 font-body text-[12.5px] text-text-muted">{trackingMessage}</p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
