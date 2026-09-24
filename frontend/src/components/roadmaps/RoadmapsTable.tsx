import { getRoadmapCoursesSubtitle } from "@/lib";
import type { RoadmapSummary } from "@/types";
import { RoadmapActionLink } from "./RoadmapActionLink";
import { RoadmapMonogram } from "./RoadmapMonogram";
import { RoadmapProgressBar } from "./RoadmapProgressBar";
import { RoadmapRowMenu } from "./RoadmapRowMenu";
import { RoadmapStatusBadge } from "./RoadmapStatusBadge";

export interface RoadmapsTableProps {
  roadmaps: RoadmapSummary[];
  onDelete: (roadmap: RoadmapSummary) => void;
}

const HEADER_CLASSES =
  "px-4 pt-5 pb-4 text-left font-body font-semibold text-xs text-text-muted uppercase tracking-[0.12em]";
const CELL_CLASSES = "border-border-divider/60 border-t px-4 py-5 align-middle";

/**
 * Tabla de rutas (≥ lg). Sin `overflow-hidden` en la tabla ni en sus celdas: los menús ⋮ son
 * absolutos y se recortarían. Las esquinas se redondean con `border-separate` + `rounded-card`.
 */
export function RoadmapsTable({ roadmaps, onDelete }: RoadmapsTableProps) {
  return (
    <table className="hidden w-full table-fixed border-separate border-spacing-0 rounded-card border border-border-field bg-bg-surface-solid lg:table">
      <caption className="sr-only">Tus rutas de aprendizaje</caption>
      <colgroup>
        <col />
        <col className="w-40" />
        <col className="w-44 xl:w-64" />
        <col className="w-36" />
        <col className="w-16" />
      </colgroup>
      <thead>
        <tr>
          <th scope="col" className={`${HEADER_CLASSES} pl-6`}>
            Ruta
          </th>
          <th scope="col" className={HEADER_CLASSES}>
            Estado
          </th>
          <th scope="col" className={HEADER_CLASSES}>
            Progreso
          </th>
          <th scope="col" className={HEADER_CLASSES}>
            <span className="sr-only">Acciones</span>
          </th>
          <th scope="col" className={`${HEADER_CLASSES} pr-6`}>
            <span className="sr-only">Más acciones</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {roadmaps.map((roadmap) => (
          <tr key={roadmap.id}>
            <td className={`${CELL_CLASSES} pl-6`}>
              <div className="flex min-w-0 items-center gap-4">
                <RoadmapMonogram roadmap={roadmap} />
                <div className="min-w-0">
                  <p
                    title={roadmap.name}
                    className="truncate font-body font-semibold text-base text-text-primary"
                  >
                    {roadmap.name}
                  </p>
                  <p className="truncate font-body text-sm text-text-secondary">
                    {getRoadmapCoursesSubtitle(roadmap.totalCourses, roadmap.level)}
                  </p>
                </div>
              </div>
            </td>
            <td className={CELL_CLASSES}>
              <RoadmapStatusBadge status={roadmap.status} />
            </td>
            <td className={CELL_CLASSES}>
              <RoadmapProgressBar
                value={roadmap.progress}
                status={roadmap.status}
                roadmapName={roadmap.name}
              />
            </td>
            <td className={`${CELL_CLASSES} text-right`}>
              <RoadmapActionLink roadmap={roadmap} />
            </td>
            <td className={`${CELL_CLASSES} pr-6 text-right`}>
              <RoadmapRowMenu roadmapName={roadmap.name} onDelete={() => onDelete(roadmap)} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
