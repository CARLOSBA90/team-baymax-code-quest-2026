import { useCallback, useEffect, useRef, useState } from "react";

export const SCROLL_END_THRESHOLD_PX = 8;

/**
 * Indica si el elemento referenciado se ha desplazado hasta el final (con `threshold` px de
 * tolerancia). Es un latch: una vez alcanzado el final no vuelve a `false`. Si el contenido cabe
 * sin scroll, `hasReachedEnd` pasa a `true` al montar (o cuando el `ResizeObserver` lo detecte).
 * Mientras el elemento no tiene layout (`clientHeight === 0`) no se evalúa.
 */
export function useScrolledToEnd<T extends HTMLElement>(threshold = SCROLL_END_THRESHOLD_PX) {
  const ref = useRef<T>(null);
  const [hasReachedEnd, setHasReachedEnd] = useState(false);

  const check = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    // Sin layout (p. ej. dentro de un <dialog> aún sin showModal): no decidir todavía; el
    // ResizeObserver vuelve a evaluar cuando el elemento recibe tamaño.
    if (el.clientHeight === 0) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight <= threshold) setHasReachedEnd(true);
  }, [threshold]);

  useEffect(() => {
    check();
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [check]);

  return { ref, hasReachedEnd, onScroll: check };
}
