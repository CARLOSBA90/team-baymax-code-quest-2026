import { useState } from "react";
import { useLocation } from "react-router-dom";
import type { NoticeVariant } from "@/components/ui";

interface DeleteNotice {
  message: string;
  variant: NoticeVariant;
  /** Entrada del historial (`location.key`) en la que se mostró. */
  key: string;
}

export interface DeleteRoadmapNotice {
  /** Mensaje visible, o `null` si no hay aviso para la entrada actual. */
  message: string | null;
  /** Variante del aviso visible (`success` cuando no se indica otra al mostrarlo). */
  variant: NoticeVariant;
  /** Muestra (o reemplaza) el aviso en la entrada actual del historial. */
  show: (message: string, variant?: NoticeVariant) => void;
}

/**
 * Aviso tras borrar una ruta, ligado a la entrada del historial en la que se mostró (mismo
 * patrón que el aviso de cuestionario completado). Cambiar de filtro (`replace` → `key` nueva),
 * atrás/adelante o salir y volver lo descartan; no reaparece al volver a su entrada.
 */
export function useDeleteRoadmapNotice(): DeleteRoadmapNotice {
  const location = useLocation();
  const [notice, setNotice] = useState<DeleteNotice | null>(null);

  // Descarta el aviso en cuanto la entrada cambia, para que no reaparezca al volver a ella.
  if (notice !== null && notice.key !== location.key) {
    setNotice(null);
  }

  const show = (message: string, variant: NoticeVariant = "success") =>
    setNotice({ message, variant, key: location.key });

  const current = notice?.key === location.key ? notice : null;
  return { message: current?.message ?? null, variant: current?.variant ?? "success", show };
}
