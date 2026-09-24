import { getRoadmapAccent, getRoadmapMonogram, type RoadmapMonogramAccent } from "@/lib";
import type { RoadmapSummary } from "@/types";

export interface RoadmapMonogramProps {
  roadmap: Pick<RoadmapSummary, "name" | "monogram" | "accent">;
}

// Literales completos: Tailwind no detecta clases construidas dinámicamente.
const ACCENT_CLASSES: Record<RoadmapMonogramAccent, string> = {
  violet: "text-mono-violet bg-mono-violet/10 border-mono-violet/25",
  cyan: "text-mono-cyan bg-mono-cyan/10 border-mono-cyan/25",
  amber: "text-mono-amber bg-mono-amber/10 border-mono-amber/25",
  pink: "text-mono-pink bg-mono-pink/10 border-mono-pink/25",
  emerald: "text-mono-emerald bg-mono-emerald/10 border-mono-emerald/25",
  neutral: "text-text-secondary bg-bg-ghost border-border-field",
};

/** Monograma decorativo de la ruta; el nombre ya se anuncia junto a él. */
export function RoadmapMonogram({ roadmap }: RoadmapMonogramProps) {
  const accent = getRoadmapAccent(roadmap);
  return (
    <span
      aria-hidden="true"
      data-accent={accent}
      className={`flex size-10 shrink-0 items-center justify-center rounded-xl border font-display font-bold text-sm ${ACCENT_CLASSES[accent]}`}
    >
      {getRoadmapMonogram(roadmap)}
    </span>
  );
}
