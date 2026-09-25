import type { ReactElement } from "react";
import { useParams } from "react-router-dom";
import { useRoadmap } from "@/api/queries/roadmaps";
import {
  RoadmapDetailSkeleton,
  RoadmapDetailView,
  RoadmapLoadError,
  RoadmapNotFound,
} from "@/components/roadmap-detail";
import { isRoadmapNotFoundError } from "@/lib";

/**
 * Detalle de una ruta (`/dashboard/roadmaps/:roadmapId`). Máquina de estados sobre
 * `useRoadmap`, por precedencia: 404 (aunque haya datos en caché: la ruta ya no existe) →
 * «No encontramos esta ruta»; datos (una revalidación fallida no desmonta la vista) → vista;
 * otro error → «No pudimos cargar la ruta» con «Reintentar» (`refetch`, sin recargar); si no,
 * skeleton.
 */
export function RoadmapDetailPage() {
  const { roadmapId = "" } = useParams<"roadmapId">();
  const { data, error, isError, refetch } = useRoadmap(roadmapId);

  let content: ReactElement;
  if (isError && isRoadmapNotFoundError(error)) {
    content = <RoadmapNotFound />;
  } else if (data) {
    content = <RoadmapDetailView roadmap={data} />;
  } else if (isError) {
    content = <RoadmapLoadError onRetry={() => void refetch()} />;
  } else {
    content = <RoadmapDetailSkeleton />;
  }

  return (
    <section aria-label="Detalle de la ruta" className="flex min-h-full min-w-0 flex-col gap-7">
      {content}
    </section>
  );
}
