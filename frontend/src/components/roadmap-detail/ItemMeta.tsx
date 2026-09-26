import { getItemMeta, type ItemMetaOptions } from "@/lib";
import type { RoadmapItem } from "@/types";

export interface ItemMetaProps extends ItemMetaOptions {
  item: Pick<RoadmapItem, "type" | "level" | "estimatedMinutes" | "completedAt">;
}

/** Línea de meta del ítem («Paso 2 de 4 · Intermedio · 3 h»); nada si no hay partes. */
export function ItemMeta({ item, step, now }: ItemMetaProps) {
  const meta = getItemMeta(item, { step, now });
  if (!meta) return null;

  return <p className="font-body text-[12.5px] text-text-muted">{meta}</p>;
}
