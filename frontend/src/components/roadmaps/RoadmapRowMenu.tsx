import { DropdownMenu, type DropdownMenuItem } from "@/components/ui";
import { KebabIcon } from "./RoadmapsIcons";

export interface RoadmapRowMenuProps {
  roadmapName: string;
  /** "Eliminar ruta": el padre abre la confirmación; el menú nunca borra por sí solo. */
  onDelete: () => void;
}

/** Menú ⋮ de cada fila/card. El menú es absoluto: ningún ancestro debe tener overflow-hidden. */
export function RoadmapRowMenu({ roadmapName, onDelete }: RoadmapRowMenuProps) {
  const items: DropdownMenuItem[] = [
    { id: "delete", label: "Eliminar ruta", tone: "danger", onSelect: onDelete },
  ];

  return (
    <DropdownMenu
      triggerLabel={`Más acciones para ${roadmapName}`}
      trigger={<KebabIcon className="size-5" />}
      items={items}
      triggerClassName="size-9 text-text-secondary transition-colors hover:bg-bg-ghost-hover hover:text-text-primary"
    />
  );
}
