import { useState } from "react";
import type { RoadmapItemType } from "@/types";
import { ItemTypeIcon } from "./ItemTypeIcon";

export type ItemThumbnailSize = "md" | "lg";
export type ItemThumbnailTone = "default" | "done";

export interface ItemThumbnailProps {
  src: string | null;
  type: RoadmapItemType;
  size: ItemThumbnailSize;
  tone?: ItemThumbnailTone;
}

/** md: 80×56 por debajo de `lg`, 96×64 en escritorio (timeline). lg: «Continúa aquí». */
const SIZE_CLASSES: Record<ItemThumbnailSize, string> = {
  md: "h-14 w-20 rounded-[10px] lg:h-16 lg:w-24",
  lg: "h-[78px] w-[116px] rounded-xl",
};

const ICON_SIZE_CLASSES: Record<ItemThumbnailSize, string> = {
  md: "size-6",
  lg: "size-7",
};

const TONE_CLASSES: Record<ItemThumbnailTone, string> = {
  default: "from-thumb-from to-thumb-to text-accent-soft",
  done: "from-thumb-done-from to-thumb-done-to text-status-completed-text",
};

/**
 * Miniatura del ítem: gradiente + icono del tipo como placeholder (también mientras carga) y la
 * imagen encima si existe. Si la imagen falla se retira; el padre la monta con `key` por URL para
 * reiniciar el fallo cuando cambia.
 */
export function ItemThumbnail({ src, type, size, tone = "default" }: ItemThumbnailProps) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden bg-linear-to-br ${SIZE_CLASSES[size]} ${TONE_CLASSES[tone]}`}
    >
      <ItemTypeIcon type={type} className={ICON_SIZE_CLASSES[size]} />
      {src && !failed ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="absolute inset-0 size-full object-cover"
        />
      ) : null}
    </div>
  );
}
