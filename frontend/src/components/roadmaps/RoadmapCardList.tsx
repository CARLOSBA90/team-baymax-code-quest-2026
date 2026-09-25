import type { RoadmapSummary } from "@/types";
import { RoadmapCard } from "./RoadmapCard";

export interface RoadmapCardListProps {
  roadmaps: RoadmapSummary[];
  onDelete: (roadmap: RoadmapSummary) => void;
}

/** Lista de cards (< lg). Sin `overflow-hidden`: los menús ⋮ no deben recortarse. */
export function RoadmapCardList({ roadmaps, onDelete }: RoadmapCardListProps) {
  return (
    <ul aria-label="Tus rutas de aprendizaje" className="flex flex-col gap-3 lg:hidden">
      {roadmaps.map((roadmap) => (
        <li key={roadmap.id}>
          <RoadmapCard roadmap={roadmap} onDelete={onDelete} />
        </li>
      ))}
    </ul>
  );
}
