import { Link } from "react-router-dom";
import { getRoadmapCoursesSubtitle, getRoadmapPath } from "@/lib";
import type { RoadmapSummary } from "@/types";
import { RoadmapMonogram } from "./RoadmapMonogram";
import { RoadmapProgressBar } from "./RoadmapProgressBar";
import { RoadmapRowMenu } from "./RoadmapRowMenu";
import { RoadmapStatusBadge } from "./RoadmapStatusBadge";
import { ChevronRightIcon } from "./RoadmapsIcons";

export interface RoadmapCardProps {
  roadmap: RoadmapSummary;
}

/**
 * Card de ruta (< lg) con patrón "stretched link": el `::after` del enlace del título cubre
 * toda la card; el menú ⋮ es hermano del enlace (`relative z-10`), nunca un interactivo anidado.
 */
export function RoadmapCard({ roadmap }: RoadmapCardProps) {
  return (
    <article className="relative rounded-card border border-border-field bg-bg-surface-solid p-4 transition-colors hover:border-border-field-hover">
      <div className="flex items-start gap-3">
        <RoadmapMonogram roadmap={roadmap} />
        <div className="min-w-0 flex-1">
          <h3 className="font-body font-semibold text-base text-text-primary leading-snug">
            <Link
              to={getRoadmapPath(roadmap.id)}
              className="outline-none after:absolute after:inset-0 after:rounded-card after:content-[''] focus-visible:after:shadow-ring-focus"
            >
              {roadmap.name}
            </Link>
          </h3>
          <p className="mt-0.5 font-body text-sm text-text-secondary">
            {getRoadmapCoursesSubtitle(roadmap.totalCourses, roadmap.level)}
          </p>
        </div>
        <div className="flex shrink-0 items-center">
          <ChevronRightIcon className="size-5 text-text-secondary" />
          <div className="relative z-10">
            <RoadmapRowMenu roadmapName={roadmap.name} />
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <RoadmapStatusBadge status={roadmap.status} />
        <RoadmapProgressBar
          value={roadmap.progress}
          status={roadmap.status}
          roadmapName={roadmap.name}
        />
      </div>
    </article>
  );
}
