import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useId, useState } from "react";
import { Link } from "react-router-dom";
import { applyTrackProgressResult, roadmapsKeys, useTrackProgress } from "@/api/queries/roadmaps";
import { Notice } from "@/components/ui";
import {
  getCompletedCount,
  getCompleteItemErrorMessage,
  getItemCompletedAnnouncement,
  getItemHeadingId,
  getNextStepItem,
  getRemainingMinutes,
  getTotalMinutes,
  isRoadmapItemNotFoundError,
  isRoadmapPausedError,
  isTrackingMismatchError,
  ROADMAP_ITEM_NOT_FOUND_MESSAGE,
  ROADMAP_PAUSED_TRACK_MESSAGE,
  shouldRefreshAfterTrackError,
  TRACKING_MISMATCH_TRACK_MESSAGE,
} from "@/lib";
import type { RoadmapDetail, RoadmapItem } from "@/types";
import { ConfirmCompleteDialog } from "./ConfirmCompleteDialog";
import { NextStepCard } from "./NextStepCard";
import { PausedBanner } from "./PausedBanner";
import { RoadmapCompletedPanel } from "./RoadmapCompletedPanel";
import { RoadmapHeader } from "./RoadmapHeader";
import { RoadmapProgress } from "./RoadmapProgress";
import { RoadmapTimeline } from "./RoadmapTimeline";

export interface RoadmapDetailViewProps {
  roadmap: RoadmapDetail;
}

/**
 * Foco pendiente tras cerrar el diálogo. Los callbacks de `mutate` corren ANTES de que React pinte
 * el detalle recargado (la query notifica a sus observadores en una tarea posterior), así que si la
 * caché ya tiene un detalle distinto del pintado (`waitForUpdate`) el foco espera a que llegue
 * como prop; si no, se aplica en el mismo commit.
 */
interface FocusRequest {
  targetId: string;
  from: RoadmapDetail;
  waitForUpdate: boolean;
}

/**
 * Compositor del detalle: calcula una vez los derivados (pasos, minutos, ids de a11y) y los baja
 * a piezas presentacionales dentro de la columna de 920px. También es dueño del flujo «Marcar como
 * completado»: diálogo de confirmación, anuncio en la live region, aviso 404 y foco final (las
 * piezas solo emiten `onComplete(item)`).
 */
export function RoadmapDetailView({ roadmap }: RoadmapDetailViewProps) {
  const { items } = roadmap;
  const headingId = useId();
  const pausedDescriptionId = useId();
  const pausedHeadingId = useId();
  const completedHeadingId = useId();
  const itemHeadingIdPrefix = useId();
  const queryClient = useQueryClient();
  const trackMutation = useTrackProgress(roadmap.id);
  const [itemToComplete, setItemToComplete] = useState<RoadmapItem | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null);
  const isPaused = roadmap.status === "PAUSED";
  const completed = getCompletedCount(items);
  const total = items.length;
  const totalMinutes = getTotalMinutes(items);
  const remainingMinutes = getRemainingMinutes(items);
  // NOT_STARTED se trata como en curso (#224 Q2); PAUSED y COMPLETED no muestran la tarjeta.
  const showsNextStep = roadmap.status === "IN_PROGRESS" || roadmap.status === "NOT_STARTED";
  const nextStepItem = showsNextStep ? getNextStepItem(items, roadmap.nextStep) : null;
  // Los errores que refrescan el detalle (404/409/422) cierran el diálogo; el resto se queda dentro.
  const errorMessage =
    trackMutation.isError && !shouldRefreshAfterTrackError(trackMutation.error)
      ? getCompleteItemErrorMessage(trackMutation.error)
      : null;

  // Corre después del efecto de `Modal` (hijo): gana a su devolución del foco al botón. Si el
  // destino no existe (p. ej. 409 sin banner porque el refetch falló), cae al h1.
  useEffect(() => {
    if (!focusRequest) return;
    if (focusRequest.waitForUpdate && roadmap === focusRequest.from) return;
    (document.getElementById(focusRequest.targetId) ?? document.getElementById(headingId))?.focus();
    setFocusRequest(null);
  }, [focusRequest, roadmap, headingId]);

  /** Pide el foco en `targetId` cuando el detalle en caché (`cached`) ya esté pintado. */
  const requestFocus = (targetId: string, cached: RoadmapDetail | undefined) => {
    setFocusRequest({
      targetId,
      from: roadmap,
      waitForUpdate: cached !== undefined && cached !== roadmap,
    });
  };

  const handleCompleteRequest = (item: RoadmapItem) => {
    trackMutation.reset();
    setAnnouncement("");
    setNotice(null);
    setFocusRequest(null);
    setItemToComplete(item);
  };

  const handleConfirm = () => {
    const item = itemToComplete;
    if (!item) return;
    const itemHeadingId = getItemHeadingId(itemHeadingIdPrefix, item.roadmapItemId);
    const getCachedDetail = () =>
      queryClient.getQueryData<RoadmapDetail>(roadmapsKeys.detail(roadmap.id));

    // Sin guard de `isPending`: el botón está deshabilitado mientras tanto.
    trackMutation.mutate(item.roadmapItemId, {
      onSuccess: (outcome) => {
        // Sin entrada en caché (sin observador) se reconstruye desde la respuesta del POST.
        const fresh =
          outcome.detail ?? applyTrackProgressResult(roadmap, item.roadmapItemId, outcome.result);
        const roadmapCompleted = fresh.status === "COMPLETED";
        setItemToComplete(null);
        setAnnouncement(
          getItemCompletedAnnouncement({
            name: item.name,
            progress: fresh.progress,
            completed: getCompletedCount(fresh.items),
            total: fresh.items.length,
            roadmapCompleted,
          }),
        );
        requestFocus(roadmapCompleted ? completedHeadingId : itemHeadingId, outcome.detail);
      },
      onError: (error) => {
        const cached = getCachedDetail();
        if (isRoadmapPausedError(error)) {
          setItemToComplete(null);
          setAnnouncement(ROADMAP_PAUSED_TRACK_MESSAGE);
          requestFocus(pausedHeadingId, cached);
        } else if (isTrackingMismatchError(error)) {
          setItemToComplete(null);
          setAnnouncement(TRACKING_MISMATCH_TRACK_MESSAGE);
          requestFocus(itemHeadingId, cached);
        } else if (isRoadmapItemNotFoundError(error)) {
          // Sin anuncio: el Notice ya es `role="status"` (evita la doble lectura).
          setItemToComplete(null);
          setNotice(ROADMAP_ITEM_NOT_FOUND_MESSAGE);
          requestFocus(headingId, cached);
        }
        // Otros errores: el diálogo sigue abierto con `errorMessage`.
      },
    });
  };

  return (
    <div className="flex w-full max-w-detail flex-col gap-5.5">
      {notice ? <Notice variant="success">{notice}</Notice> : null}
      {/* Fila de la miga: `justify-between` deja sitio al menú ⋯ de móvil (slice 5). */}
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/dashboard/roadmaps"
          className="flex w-fit items-center gap-1.5 rounded-md font-body font-semibold text-sm text-text-secondary outline-none transition-colors hover:text-text-primary focus-visible:shadow-ring-focus"
        >
          <span aria-hidden="true">‹</span>
          Mis Rutas
        </Link>
      </div>
      <RoadmapHeader
        name={roadmap.name}
        summary={roadmap.summary}
        status={roadmap.status}
        lastActivity={roadmap.lastActivity}
        headingId={headingId}
      />
      <RoadmapProgress
        progress={roadmap.progress}
        status={roadmap.status}
        completed={completed}
        total={total}
        totalMinutes={totalMinutes}
        remainingMinutes={remainingMinutes}
        labelledBy={headingId}
      />
      {isPaused ? (
        <PausedBanner
          pausedAt={roadmap.pausedAt}
          descriptionId={pausedDescriptionId}
          headingId={pausedHeadingId}
        />
      ) : null}
      {roadmap.status === "COMPLETED" ? (
        <RoadmapCompletedPanel
          total={total}
          totalMinutes={totalMinutes}
          headingId={completedHeadingId}
        />
      ) : null}
      {nextStepItem ? (
        <NextStepCard
          item={nextStepItem.item}
          stepNumber={nextStepItem.stepNumber}
          total={total}
          onComplete={handleCompleteRequest}
        />
      ) : null}
      <RoadmapTimeline
        items={items}
        nextStepId={roadmap.nextStep?.roadmapItemId ?? null}
        completed={completed}
        isPaused={isPaused}
        pausedDescriptionId={isPaused ? pausedDescriptionId : undefined}
        onComplete={handleCompleteRequest}
        itemHeadingIdPrefix={itemHeadingIdPrefix}
      />
      <ConfirmCompleteDialog
        item={itemToComplete}
        pending={trackMutation.isPending}
        errorMessage={errorMessage}
        onCancel={() => setItemToComplete(null)}
        onConfirm={handleConfirm}
      />
      {/* Siempre montada (una live region que aparece con texto no se anuncia de forma fiable). */}
      <p
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        data-testid="roadmap-detail-announcer"
      >
        {announcement}
      </p>
    </div>
  );
}
