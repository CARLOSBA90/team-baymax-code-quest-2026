import { ROADMAP_FILTERS, type RoadmapFilter } from "@/lib";
import type { RoadmapCounts } from "@/types";

export interface RoadmapsFilterBarProps {
  active: RoadmapFilter;
  counts: RoadmapCounts;
  onChange: (filter: RoadmapFilter) => void;
}

const BUTTON_BASE =
  "inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-full border px-4 font-body font-semibold text-sm outline-none transition-[background-color,border-color,color,box-shadow] duration-150 focus-visible:shadow-ring-focus md:h-9 md:rounded-lg md:px-3.5";
const BUTTON_ACTIVE =
  "border-accent-soft/40 bg-bg-nav-active text-text-primary md:border-transparent md:bg-bg-ghost-hover";
const BUTTON_IDLE =
  "border-border-field text-text-secondary hover:bg-bg-ghost hover:text-text-body md:border-transparent";

/**
 * Filtros de estado como botones `aria-pressed` (no tabs: filtran una única lista).
 * En móvil son pills con scroll horizontal que sangra hasta el borde de la pantalla.
 */
export function RoadmapsFilterBar({ active, counts, onChange }: RoadmapsFilterBarProps) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: no es un formulario; <fieldset> impone min-width: min-content y rompe el scroll horizontal de las pills.
    <div
      role="group"
      aria-label="Filtrar rutas por estado"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 py-1 [scrollbar-width:none] md:mx-0 md:w-fit md:gap-1 md:rounded-control md:border md:border-border-field md:bg-bg-ghost md:p-1 [&::-webkit-scrollbar]:hidden"
    >
      {ROADMAP_FILTERS.map((option) => {
        const pressed = option.value === active;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={pressed}
            onClick={() => onChange(option.value)}
            className={`${BUTTON_BASE} ${pressed ? BUTTON_ACTIVE : BUTTON_IDLE}`}
          >
            {option.label}{" "}
            <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-bg-ghost-hover px-1.5 text-text-body text-xs tabular-nums">
              {counts[option.countKey]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
