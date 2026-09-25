import { useState } from "react";
import { useLocation } from "react-router-dom";

interface DeleteNotice {
  message: string;
  /** Entrada del historial (`location.key`) en la que se mostró. */
  key: string;
}

export interface DeleteRoadmapNotice {
  /** Mensaje visible, o `null` si no hay aviso para la entrada actual. */
  message: string | null;
  /** Muestra (o reemplaza) el aviso en la entrada actual del historial. */
  show: (message: string) => void;
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

  const show = (message: string) => setNotice({ message, key: location.key });

  return { message: notice?.key === location.key ? notice.message : null, show };
}
