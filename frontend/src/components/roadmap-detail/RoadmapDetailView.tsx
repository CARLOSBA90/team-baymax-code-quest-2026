import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useId, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  applyTrackProgressResult,
  roadmapsKeys,
  useDeleteRoadmap,
  usePauseRoadmap,
  useTrackProgress,
} from "@/api/queries/roadmaps";
import { DeleteRoadmapDialog } from "@/components/roadmaps";
import { Notice } from "@/components/ui";
import { useFocusRequest } from "@/hooks";
import {
  buildRoadmapDeletedState,
  didPauseRefetchFail,
  getCompletedCount,
  getCompleteItemErrorMessage,
  getDeleteRoadmapErrorMessage,
  getItemCompletedAnnouncement,
  getItemHeadingId,
  getLessonToggledAnnouncement,
  getLessonTrackErrorMessage,
  getNextStepItem,
  getPauseRoadmapErrorMessage,
  getPauseToggleAnnouncement,
  getRemainingMinutes,
  getTotalMinutes,
  isRoadmapItemNotFoundError,
  isRoadmapNotFoundError,
  isRoadmapPausedError,
  isRoadmapUpdatedElsewhereError,
  isTrackingMismatchError,
  ROADMAP_ITEM_NOT_FOUND_MESSAGE,
  ROADMAP_PAUSED_TRACK_MESSAGE,
  ROADMAP_UPDATED_ELSEWHERE_MESSAGE,
  shouldRefreshAfterTrackError,
  TRACKING_MISMATCH_TRACK_MESSAGE,
} from "@/lib";
import type { RoadmapDetail, RoadmapItem, SyllabusLesson } from "@/types";
import { ConfirmCompleteDialog } from "./ConfirmCompleteDialog";
import { NextStepCard } from "./NextStepCard";
import { PausedBanner } from "./PausedBanner";
import { RoadmapCompletedPanel } from "./RoadmapCompletedPanel";
import { RoadmapDetailMenu } from "./RoadmapDetailMenu";
import { RoadmapHeader } from "./RoadmapHeader";
import { RoadmapProgress } from "./RoadmapProgress";
import { RoadmapTimeline } from "./RoadmapTimeline";

export interface RoadmapDetailViewProps {
  roadmap: RoadmapDetail;
}

/** Aviso superior de la vista: `info` (neutro, `role="status"`) o `error` (`role="alert"`). */
interface DetailNotice {
  variant: "info" | "error";
  message: string;
}

/**
 * Compositor del detalle: calcula una vez los derivados (pasos, minutos, ids de a11y) y los baja
 * a piezas presentacionales dentro de la columna de 920px. Es dueño de todos los flujos (las piezas
 * solo emiten callbacks) y de su feedback: un único hueco de `Notice` arriba, una live region
 * siempre montada y el foco final (`useFocusRequest`). Cualquier acción nueva limpia primero el
 * feedback anterior (`clearFeedback`).
 * - «Marcar como completado»: diálogo de confirmación, anuncio, aviso 404 (`info`) y foco.
 * - Pausar/reanudar (⋯ y banner): anuncio según el estado devuelto (COMPLETED → sin anuncio), foco
 *   al h2 del banner (PAUSED) o al h1; 409 de conflicto/transición → `info` + h1; otros errores →
 *   `error` sin mover el foco. Mientras está en curso se bloquean el ⋯, el banner y completar.
 * - Eliminar (⋯): `DeleteRoadmapDialog`; 200/404 navega a Mis Rutas (`replace` + state de borrado)
 *   con el diálogo en «Eliminando…» hasta desmontar, y el detalle sale de la caché al desmontar
 *   (nunca con el observador vivo, que volvería a pedir la ruta borrada).
 */
export function RoadmapDetailView({ roadmap }: RoadmapDetailViewProps) {
  const { items } = roadmap;
  const headingId = useId();
  const pausedDescriptionId = useId();
  const pausedHeadingId = useId();
  const resumeButtonId = useId();
  const completedHeadingId = useId();
  const itemHeadingIdPrefix = useId();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const trackMutation = useTrackProgress(roadmap.id);
  const pauseMutation = usePauseRoadmap(roadmap.id);
  const deleteMutation = useDeleteRoadmap({ removeDetail: false });
  const [itemToComplete, setItemToComplete] = useState<RoadmapItem | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [notice, setNotice] = useState<DetailNotice | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const deletedRef = useRef(false);
  const roadmapId = roadmap.id;
  // Foco final tras cerrar el diálogo: espera al detalle recargado si la caché ya tiene uno
  // distinto del pintado; si el destino no existe (p. ej. 409 sin banner porque el refetch falló),
  // cae al h1.
  const { requestFocus, cancelFocus } = useFocusRequest(roadmap, headingId);
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
  // Pausar/reanudar en curso: ⋯, banner y completar bloqueados (sin carreras entre acciones).
  const pauseLocked = pauseMutation.isPending;
  const resuming = pauseLocked && pauseMutation.variables?.paused === false;
  // Bloqueo amplio del checklist de lecciones y de «Marcar como completado»: cualquier mutación de
  // progreso en curso (completar un ítem o marcar/desmarcar una lección de cualquier ítem) o
  // pausar/reanudar bloquea todo, evitando llamadas concurrentes sobre `trackMutation` (D3).
  const trackLocked = trackMutation.isPending || pauseLocked;
  const pendingLessonKey =
    trackMutation.isPending && trackMutation.variables?.kind === "lesson"
      ? `${trackMutation.variables.roadmapItemId}:${trackMutation.variables.lessonId}`
      : null;
  // 404 al borrar se trata como éxito (navega); el resto se queda dentro del diálogo.
  const deleteErrorMessage =
    deleteMutation.isError && !isRoadmapNotFoundError(deleteMutation.error)
      ? getDeleteRoadmapErrorMessage(deleteMutation.error)
      : null;

  // Tras borrar, el detalle sale de la caché al desmontar la vista (la página ya no observa).
  // StrictMode no afecta: en el doble montaje `deletedRef` sigue a `false`.
  useEffect(
    () => () => {
      if (deletedRef.current) {
        queryClient.removeQueries({ queryKey: roadmapsKeys.detail(roadmapId), exact: true });
      }
    },
    [queryClient, roadmapId],
  );

  const getCachedDetail = () =>
    queryClient.getQueryData<RoadmapDetail>(roadmapsKeys.detail(roadmap.id));

  /** Limpia anuncio, aviso y foco pendiente al empezar cualquier acción. */
  const clearFeedback = () => {
    setAnnouncement("");
    setNotice(null);
    cancelFocus();
  };

  const handleCompleteRequest = (item: RoadmapItem) => {
    trackMutation.reset();
    clearFeedback();
    setItemToComplete(item);
  };

  // Sin confirmación ni guard de `isPending`: el ⋯ y el banner están deshabilitados mientras tanto.
  // `fromBanner`: la acción salió del botón del banner, al que vuelve el foco si falla.
  const handlePauseToggle = (paused: boolean, fromBanner = false) => {
    pauseMutation.reset();
    clearFeedback();
    pauseMutation.mutate(
      { paused, expectedActivityVersion: roadmap.activityVersion },
      {
        onSuccess: (fresh) => {
          // Back idempotente: se anuncia el estado devuelto, no la acción pedida.
          const message = getPauseToggleAnnouncement(fresh.status);
          if (message) setAnnouncement(message);
          requestFocus(fresh.status === "PAUSED" ? pausedHeadingId : headingId, fresh);
        },
        onError: (error) => {
          if (isRoadmapUpdatedElsewhereError(error) && !didPauseRefetchFail(error)) {
            // Sin anuncio: el Notice ya es `role="status"`. El detalle ya está refrescado.
            setNotice({ variant: "info", message: ROADMAP_UPDATED_ELSEWHERE_MESSAGE });
            requestFocus(headingId, getCachedDetail());
          } else if (!isRoadmapNotFoundError(error) || didPauseRefetchFail(error)) {
            // 404 con refetch interno exitoso: el refetch da 404 y la página pinta «No encontramos
            // esta ruta», sin notice aquí. 404/409 con refetch interno fallido (red/5xx): la caché
            // queda obsoleta, así que se tratan como cualquier otro error genérico.
            setNotice({ variant: "error", message: getPauseRoadmapErrorMessage(error, paused) });
            // El foco no se mueve de donde estaba el usuario: el ⋯ lo conserva (`aria-disabled`),
            // pero el botón del banner es `disabled` nativo mientras está pendiente y el navegador
            // puede soltarlo en `<body>`: se le devuelve (sin caché que esperar → siguiente commit).
            if (fromBanner) requestFocus(resumeButtonId, undefined);
          }
        },
      },
    );
  };

  const handleDeleteRequest = () => {
    clearFeedback();
    deleteMutation.reset();
    setDeleteOpen(true);
  };

  const leave = (notFound: boolean) => {
    deletedRef.current = true;
    setLeaving(true);
    navigate("/dashboard/roadmaps", {
      replace: true,
      state: buildRoadmapDeletedState(roadmap.name, notFound),
    });
  };

  const handleDeleteConfirm = () => {
    deleteMutation.mutate(roadmap.id, {
      onSuccess: () => leave(false),
      onError: (error) => {
        if (isRoadmapNotFoundError(error)) leave(true);
      },
    });
  };

  const handleConfirm = () => {
    const item = itemToComplete;
    if (!item) return;
    const itemHeadingId = getItemHeadingId(itemHeadingIdPrefix, item.roadmapItemId);

    // Sin guard de `isPending`: el botón está deshabilitado mientras tanto.
    trackMutation.mutate(
      { kind: "item", roadmapItemId: item.roadmapItemId },
      {
        onSuccess: (outcome) => {
          // Sin entrada en caché (sin observador) se reconstruye desde la respuesta del POST.
          const fresh =
            outcome.detail ??
            applyTrackProgressResult(
              roadmap,
              { kind: "item", roadmapItemId: item.roadmapItemId },
              outcome.result,
            );
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
            setNotice({ variant: "info", message: ROADMAP_ITEM_NOT_FOUND_MESSAGE });
            requestFocus(headingId, cached);
          }
          // Otros errores: el diálogo sigue abierto con `errorMessage`.
        },
      },
    );
  };

  // Marca/desmarca una lección directamente (sin diálogo, reversible): el checkbox nunca pierde el
  // foco (D2), así que aquí nunca se llama a `requestFocus`; todo error visible pasa por el `Notice`
  // superior (D4).
  const handleLessonToggle = (item: RoadmapItem, lesson: SyllabusLesson) => {
    clearFeedback();
    const completed = !lesson.completed;
    trackMutation.mutate(
      { kind: "lesson", roadmapItemId: item.roadmapItemId, lessonId: lesson.lessonId, completed },
      {
        onSuccess: (outcome) => {
          const fresh =
            outcome.detail ??
            applyTrackProgressResult(
              roadmap,
              {
                kind: "lesson",
                roadmapItemId: item.roadmapItemId,
                lessonId: lesson.lessonId,
                completed,
              },
              outcome.result,
            );
          const freshItem = fresh.items.find((i) => i.roadmapItemId === item.roadmapItemId);
          setAnnouncement(
            getLessonToggledAnnouncement({
              lessonTitle: lesson.title,
              marked: completed,
              itemName: item.name,
              itemProgress: freshItem?.progress ?? item.progress,
              completedLessons: freshItem?.syllabus?.completedLessons ?? 0,
              totalLessons: freshItem?.syllabus?.totalLessons ?? 0,
              roadmapCompleted: fresh.status === "COMPLETED",
            }),
          );
        },
        onError: (error) => {
          setNotice({
            variant: shouldRefreshAfterTrackError(error) ? "info" : "error",
            message: getLessonTrackErrorMessage(error),
          });
        },
      },
    );
  };

  return (
    <div className="flex w-full max-w-detail flex-col gap-5.5">
      {notice ? <Notice variant={notice.variant}>{notice.message}</Notice> : null}
      {/*
       * Miga, cabecera y ⋯ en un grid con áreas (una sola instancia del ⋯): en móvil el ⋯ va en la
       * fila de la miga; desde `sm:` junto al h1. DOM miga → cabecera → ⋯ (mismatch visual aceptado
       * en móvil; el Tab sigue miga → ⋯ porque la cabecera no tiene tabulables).
       */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-5.5 [grid-template-areas:'back_menu'_'header_header'] sm:[grid-template-areas:'back_back'_'header_menu']">
        <Link
          to="/dashboard/roadmaps"
          className="flex w-fit items-center gap-1.5 self-center rounded-md font-body font-semibold text-sm text-text-secondary outline-none transition-colors [grid-area:back] hover:text-text-primary focus-visible:shadow-ring-focus"
        >
          <span aria-hidden="true">‹</span>
          Mis Rutas
        </Link>
        <RoadmapHeader
          name={roadmap.name}
          summary={roadmap.summary}
          status={roadmap.status}
          lastActivity={roadmap.lastActivity}
          headingId={headingId}
          className="[grid-area:header]"
        />
        <div className="self-center [grid-area:menu] sm:self-start">
          <RoadmapDetailMenu
            roadmapName={roadmap.name}
            status={roadmap.status}
            disabled={trackLocked}
            onPause={() => handlePauseToggle(true)}
            onResume={() => handlePauseToggle(false)}
            onDelete={handleDeleteRequest}
          />
        </div>
      </div>
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
          resumeButtonId={resumeButtonId}
          onResume={() => handlePauseToggle(false, true)}
          resuming={resuming}
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
          completeDisabled={trackLocked}
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
        completeDisabled={trackLocked}
        onToggleLesson={handleLessonToggle}
        lessonTracking={{ locked: trackLocked, pendingKey: pendingLessonKey }}
      />
      <ConfirmCompleteDialog
        item={itemToComplete}
        pending={trackMutation.isPending}
        errorMessage={errorMessage}
        onCancel={() => setItemToComplete(null)}
        onConfirm={handleConfirm}
      />
      {/* Tras 200/404 sigue abierto en «Eliminando…» (`leaving`) hasta que el router desmonta. */}
      <DeleteRoadmapDialog
        roadmap={deleteOpen ? roadmap : null}
        pending={deleteMutation.isPending || leaving}
        errorMessage={deleteErrorMessage}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
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
