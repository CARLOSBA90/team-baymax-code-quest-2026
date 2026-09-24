/**
 * Recarga única ante un chunk que ya no existe (típico tras un deploy: la pestaña abierta
 * pide un `import()` con el hash antiguo). La usa `RouteErrorBoundary` cuando falla el `lazy`
 * de una ruta; no hay listener global de `vite:preloadError` porque todos los `import()` de la
 * app pasan por el router y ese listener recargaría la URL de origen con la navegación aún
 * pendiente. Se recarga como mucho una vez cada `CHUNK_RELOAD_WINDOW_MS`, guardando la marca
 * en `sessionStorage`, para que un deploy roto de verdad no entre en bucle. Si
 * `sessionStorage` falla, un flag en memoria evita recargar dos veces desde la misma página.
 */
export const CHUNK_RELOAD_STORAGE_KEY = "codequest:chunk-reload-at";
export const CHUNK_RELOAD_WINDOW_MS = 10_000;

const CHUNK_ERROR_PATTERNS = [
  /Failed to fetch dynamically imported module/i, // Chromium
  /error loading dynamically imported module/i, // Firefox
  /Importing a module script failed/i, // Safari
  /Unable to preload CSS/i, // helper de preload de Vite
];

let reloadPending = false;

/** ¿El error viene de un `import()` dinámico o de un preload de Vite que ha fallado? */
export function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return CHUNK_ERROR_PATTERNS.some((pattern) => pattern.test(error.message));
}

/** `true` desde que se ha pedido la recarga hasta que la página se descarga. */
export function isChunkReloadPending(): boolean {
  return reloadPending;
}

function readLastReload(): number | null {
  try {
    const raw = window.sessionStorage.getItem(CHUNK_RELOAD_STORAGE_KEY);
    return raw === null ? null : Number(raw);
  } catch {
    return null;
  }
}

function writeLastReload(timestamp: number): void {
  try {
    window.sessionStorage.setItem(CHUNK_RELOAD_STORAGE_KEY, String(timestamp));
  } catch {
    // Sin storage solo queda el flag en memoria.
  }
}

/**
 * Recarga la página si no se ha forzado otra recarga en la ventana de seguridad.
 * Devuelve `true` si ha recargado (o ya había una recarga en curso).
 */
export function reloadOnceForChunkError(): boolean {
  if (reloadPending) return true;
  const now = Date.now();
  const last = readLastReload();
  if (last !== null && now - last >= 0 && now - last < CHUNK_RELOAD_WINDOW_MS) return false;

  reloadPending = true;
  writeLastReload(now);
  window.location.reload();
  return true;
}
