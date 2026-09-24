import { DropdownMenu, type DropdownMenuItem } from "@/components/ui";
import { KebabIcon } from "./RoadmapsIcons";

export interface RoadmapRowMenuProps {
  roadmapName: string;
}

const ITEMS: DropdownMenuItem[] = [
  {
    id: "delete",
    label: "Eliminar Roadmap",
    tone: "danger",
    // No-op intencionado: eliminar rutas queda fuera del alcance de este cambio.
    onSelect: () => {},
  },
];

/** Menú ⋮ de cada fila/card. El menú es absoluto: ningún ancestro debe tener overflow-hidden. */
export function RoadmapRowMenu({ roadmapName }: RoadmapRowMenuProps) {
  return (
    <DropdownMenu
      triggerLabel={`Más acciones para ${roadmapName}`}
      trigger={<KebabIcon className="size-5" />}
      items={ITEMS}
      triggerClassName="size-9 text-text-secondary transition-colors hover:bg-bg-ghost-hover hover:text-text-primary"
    />
  );
}
