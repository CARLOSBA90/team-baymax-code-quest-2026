import type { RoadmapSummary } from "@/types";
import { RoadmapCard } from "./RoadmapCard";

export interface RoadmapCardListProps {
  roadmaps: RoadmapSummary[];
}

/** Lista de cards (< lg). Sin `overflow-hidden`: los menús ⋮ no deben recortarse. */
export function RoadmapCardList({ roadmaps }: RoadmapCardListProps) {
  return (
    <ul aria-label="Tus rutas de aprendizaje" className="flex flex-col gap-3 lg:hidden">
      {roadmaps.map((roadmap) => (
        <li key={roadmap.id}>
          <RoadmapCard roadmap={roadmap} />
        </li>
      ))}
    </ul>
  );
}
