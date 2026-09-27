import { useEffect, useState } from "react";

/** Espera máxima (ms) de una petición de foco a que llegue el valor nuevo. */
export const FOCUS_REQUEST_MAX_WAIT_MS = 1000;

export interface UseFocusRequestOptions {
  /**
   * Si el valor nuevo no llega a pintarse en este tiempo (p. ej. sin observador de la query, o
   * una respuesta que no re-renderiza), se enfoca igualmente el destino (o el fallback). Así el
   * foco nunca espera indefinidamente.
   */
  maxWaitMs?: number;
}

export interface FocusRequestApi<T> {
  /**
   * Pide el foco en `targetId` cuando el valor en caché (`cached`) ya esté pintado. Sin caché
   * (`undefined`) o con la misma referencia que el valor pintado, el foco se aplica en el
   * siguiente commit; si no, espera a que `current` cambie (con la cota `maxWaitMs`).
   */
  requestFocus: (targetId: string, cached: T | undefined) => void;
  /** Anula la petición pendiente, si la hay. */
  cancelFocus: () => void;
}

interface FocusRequest<T> {
  targetId: string;
  from: T;
  waitForUpdate: boolean;
}

function focusById(targetId: string, fallbackId: string) {
  (document.getElementById(targetId) ?? document.getElementById(fallbackId))?.focus();
}

/**
 * Foco diferido hasta que el valor recargado (`current`) esté pintado. Los callbacks de `mutate`
 * de TanStack Query corren ANTES de que React pinte los datos nuevos (la query notifica a sus
 * observadores en una tarea posterior), así que si la caché ya tiene un valor distinto del pintado
 * (`waitForUpdate`) el foco espera a que llegue como prop. Si el destino no existe cae en
 * `fallbackId`.
 *
 * El efecto pertenece al componente que llama al hook: en el mismo commit corre después de los de
 * sus hijos (p. ej. `Modal` devolviendo el foco a su botón), así que el foco pedido gana.
 */
export function useFocusRequest<T>(
  current: T,
  fallbackId: string,
  { maxWaitMs = FOCUS_REQUEST_MAX_WAIT_MS }: UseFocusRequestOptions = {},
): FocusRequestApi<T> {
  const [request, setRequest] = useState<FocusRequest<T> | null>(null);

  useEffect(() => {
    if (!request) return;
    if (request.waitForUpdate && current === request.from) {
      // Cota: si `current` cambia antes, la limpieza cancela el timeout y el efecto re-ejecuta.
      const timeout = setTimeout(() => {
        focusById(request.targetId, fallbackId);
        setRequest(null);
      }, maxWaitMs);
      return () => clearTimeout(timeout);
    }
    focusById(request.targetId, fallbackId);
    setRequest(null);
  }, [request, current, fallbackId, maxWaitMs]);

  const requestFocus = (targetId: string, cached: T | undefined) => {
    setRequest({
      targetId,
      from: current,
      waitForUpdate: cached !== undefined && cached !== current,
    });
  };

  const cancelFocus = () => setRequest(null);

  return { requestFocus, cancelFocus };
}
