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
  /** Clases de layout del padre (`[grid-area:*]`, `self-*`, `mt-*`); nunca alto/ancho base. */
  className?: string;
}

/**
 * Ambos 64×44 en móvil. md (timeline): 80×56 desde `sm:`, 96×64 en escritorio. lg («Continúa
 * aquí»): 116×78 desde `sm:`.
 */
const SIZE_CLASSES: Record<ItemThumbnailSize, string> = {
  md: "h-11 w-16 rounded-[9px] sm:h-14 sm:w-20 sm:rounded-[10px] lg:h-16 lg:w-24",
  lg: "h-11 w-16 rounded-[9px] sm:h-[78px] sm:w-[116px] sm:rounded-xl",
};

const ICON_SIZE_CLASSES: Record<ItemThumbnailSize, string> = {
  md: "size-5 sm:size-6",
  lg: "size-5 sm:size-7",
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
export function ItemThumbnail({
  src,
  type,
  size,
  tone = "default",
  className,
}: ItemThumbnailProps) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden bg-linear-to-br ${SIZE_CLASSES[size]} ${TONE_CLASSES[tone]} ${className ?? ""}`}
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
