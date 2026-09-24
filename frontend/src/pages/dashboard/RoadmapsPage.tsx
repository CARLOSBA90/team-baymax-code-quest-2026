import { type ReactElement, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { getApiErrorMessage } from "@/api/errors";
import { useDeleteRoadmap, useRoadmaps } from "@/api/queries/roadmaps";
import { AuthNotice, PrimaryButton } from "@/components/auth";
import { RoadmapsEmptyState } from "@/components/dashboard";
import {
  DeleteRoadmapDialog,
  PlusIcon,
  RoadmapCardList,
  RoadmapsFilterBar,
  RoadmapsListSkeleton,
  RoadmapsTable,
} from "@/components/roadmaps";
import { useDeleteRoadmapNotice } from "@/hooks";
import {
  filterRoadmaps,
  getDeleteRoadmapErrorMessage,
  getRoadmapDeletedMessage,
  getRoadmapsSummary,
  isAssessmentCompletedState,
  isRoadmapNotFoundError,
  parseRoadmapFilter,
  ROADMAP_DELETE_NOT_FOUND_MESSAGE,
  ROADMAP_FILTER_EMPTY_MESSAGES,
  ROADMAP_STATUS_PARAM,
  type RoadmapFilter,
} from "@/lib";
import type { RoadmapSummary } from "@/types";

/**
 * Entrada del historial (`location.key`) a la que pertenece el aviso. `pending` mientras se
 * espera la entrada que crea la limpieza del `state` (el `replace` genera una `key` nueva).
 */
interface NoticeOwner {
  key: string;
  pending: boolean;
}

/**
 * Aviso de cuestionario completado, ligado a una sola entrada del historial.
 *
 * `RoadmapsPage` no se remonta al cambiar entre entradas de la misma ruta (atrás/adelante, un
 * `Link` a Mis Rutas), así que no basta con congelar el valor inicial: el aviso se descarta en
 * cuanto `location.key` deja de ser la de su entrada. No se usa `key={location.key}` para
 * remontar porque la propia limpieza con `replace` cambia la `key` y borraría el aviso.
 */
function useAssessmentCompletedNotice(): boolean {
  const location = useLocation();
  const navigate = useNavigate();
  const arrivedCompleted = isAssessmentCompletedState(location.state);
  const [owner, setOwner] = useState<NoticeOwner | null>(() =>
    arrivedCompleted ? { key: location.key, pending: true } : null,
  );
  // Evita un segundo `replace` si StrictMode repite el efecto sobre la misma entrada.
  const cleanedKeyRef = useRef<string | null>(null);

  if (arrivedCompleted && owner?.key !== location.key) {
    setOwner({ key: location.key, pending: true });
  } else if (owner !== null && owner.key !== location.key) {
    // La primera entrada nueva tras la limpieza hereda el aviso; cualquier otra lo descarta.
    setOwner(owner.pending ? { key: location.key, pending: false } : null);
  }

  // Limpia el state de la entrada del historial para que el aviso no reaparezca al recargar.
  useEffect(() => {
    if (!arrivedCompleted || cleanedKeyRef.current === location.key) return;
    cleanedKeyRef.current = location.key;
    navigate(
      { pathname: location.pathname, search: location.search, hash: location.hash },
      { replace: true, state: null },
    );
  }, [arrivedCompleted, location, navigate]);

  return owner !== null;
}

interface RoadmapsLoadErrorProps {
  message: string;
  onRetry: () => void;
}

// Sin estado de "reintentando": en TanStack Query v5 un refetch sin datos vuelve a `pending`,
// así que durante el reintento se ve el esqueleto, no este bloque.
function RoadmapsLoadError({ message, onRetry }: RoadmapsLoadErrorProps) {
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <AuthNotice variant="error">{message}</AuthNotice>
      <PrimaryButton onClick={onRetry}>Reintentar</PrimaryButton>
    </div>
  );
}

/**
 * Filtro activo leído de `?status=` (ausente o inválido → "all"). Cambiarlo usa `replace`: los
 * filtros son estado de vista y no llenan el historial. "all" borra el parámetro.
 */
function useRoadmapFilterParam(): [RoadmapFilter, (filter: RoadmapFilter) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = parseRoadmapFilter(searchParams.get(ROADMAP_STATUS_PARAM));
  const setFilter = (next: RoadmapFilter) => {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        if (next === "all") params.delete(ROADMAP_STATUS_PARAM);
        else params.set(ROADMAP_STATUS_PARAM, next);
        return params;
      },
      { replace: true },
    );
  };
  return [filter, setFilter];
}

export const RoadmapsPage = () => {
  const navigate = useNavigate();
  const showAssessmentNotice = useAssessmentCompletedNotice();
  const [filter, setFilter] = useRoadmapFilterParam();
  const { data, isError, error, refetch } = useRoadmaps();
  // Filtrado en memoria: cambiar de filtro no cambia la query key ni dispara peticiones.
  const visibleItems = useMemo(
    () => (data ? filterRoadmaps(data.items, filter) : []),
    [data, filter],
  );
  const hasRoadmaps = data !== undefined && data.counts.all > 0;

  const deleteNotice = useDeleteRoadmapNotice();
  const deleteMutation = useDeleteRoadmap();
  const [roadmapToDelete, setRoadmapToDelete] = useState<RoadmapSummary | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [focusHeading, setFocusHeading] = useState(false);

  // Tras borrar (o 404) el foco va al h1. Este efecto corre después del de `Modal`, que al
  // cerrarse devuelve el foco al kebab; así gana el h1 aunque el kebab ya no exista.
  useEffect(() => {
    if (!focusHeading) return;
    headingRef.current?.focus();
    setFocusHeading(false);
  }, [focusHeading]);

  const handleDeleteRequest = (roadmap: RoadmapSummary) => {
    // Sin arrastrar el error de un intento anterior.
    deleteMutation.reset();
    setRoadmapToDelete(roadmap);
  };

  const finishDelete = (message: string) => {
    setRoadmapToDelete(null);
    deleteNotice.show(message);
    setFocusHeading(true);
  };

  const handleDeleteConfirm = () => {
    // Sin guard de `isPending`: el botón de confirmar ya está deshabilitado mientras está pendiente.
    if (!roadmapToDelete) return;
    const { id, name } = roadmapToDelete;
    deleteMutation.mutate(id, {
      onSuccess: () => finishDelete(getRoadmapDeletedMessage(name)),
      onError: (deleteError) => {
        // 404: ya no existía; el hook ya la quitó de la caché. Otros errores se quedan en el diálogo.
        if (isRoadmapNotFoundError(deleteError)) finishDelete(ROADMAP_DELETE_NOT_FOUND_MESSAGE);
      },
    });
  };

  const deleteErrorMessage =
    deleteMutation.isError && !isRoadmapNotFoundError(deleteMutation.error)
      ? getDeleteRoadmapErrorMessage(deleteMutation.error)
      : null;

  // Los datos mandan sobre el error: una revalidación fallida con la lista ya cargada no la
  // desmonta.
  let content: ReactElement;
  if (data === undefined) {
    content = isError ? (
      <RoadmapsLoadError message={getApiErrorMessage(error)} onRetry={() => void refetch()} />
    ) : (
      <RoadmapsListSkeleton />
    );
  } else if (hasRoadmaps) {
    content = (
      <div className="flex min-w-0 flex-col gap-6">
        <RoadmapsFilterBar active={filter} counts={data.counts} onChange={setFilter} />
        {visibleItems.length === 0 ? (
          <p role="status" className="py-10 text-center text-text-secondary">
            {filter === "all" ? null : ROADMAP_FILTER_EMPTY_MESSAGES[filter]}
          </p>
        ) : (
          <>
            <RoadmapsTable roadmaps={visibleItems} onDelete={handleDeleteRequest} />
            <RoadmapCardList roadmaps={visibleItems} onDelete={handleDeleteRequest} />
          </>
        )}
      </div>
    );
  } else {
    content = <RoadmapsEmptyState />;
  }

  let subtitle: string | null = null;
  if (hasRoadmaps) subtitle = getRoadmapsSummary(data.counts);
  else if (data !== undefined) subtitle = "Aquí aparecerán las rutas de aprendizaje que crees.";

  return (
    <section className="flex min-h-full min-w-0 flex-col gap-7">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-3">
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="font-display text-4xl font-bold text-text-primary outline-none"
          >
            Mis Rutas
          </h1>
          {subtitle !== null && <p className="text-text-secondary">{subtitle}</p>}
        </div>
        {hasRoadmaps && (
          <PrimaryButton
            className="shrink-0 md:w-fit md:px-6"
            onClick={() => navigate("/dashboard/roadmaps/new")}
          >
            <PlusIcon className="size-4" />
            Crear nueva ruta de aprendizaje
          </PrimaryButton>
        )}
      </header>
      {showAssessmentNotice && (
        <AuthNotice variant="success">
          ¡Cuestionario completado! Guardamos tus respuestas; pronto verás aquí tu ruta recomendada.
        </AuthNotice>
      )}
      {deleteNotice.message !== null && (
        <AuthNotice variant="success">{deleteNotice.message}</AuthNotice>
      )}
      {content}
      <DeleteRoadmapDialog
        roadmap={roadmapToDelete}
        pending={deleteMutation.isPending}
        errorMessage={deleteErrorMessage}
        onCancel={() => setRoadmapToDelete(null)}
        onConfirm={handleDeleteConfirm}
      />
    </section>
  );
};
