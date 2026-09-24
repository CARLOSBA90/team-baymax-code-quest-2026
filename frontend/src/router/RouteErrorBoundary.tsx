import { useEffect, useState } from "react";
import { useRouteError } from "react-router-dom";
import { FullScreenSpinner, GhostButton } from "@/components/ui";
import { isChunkLoadError, isChunkReloadPending, reloadOnceForChunkError } from "@/lib";

/**
 * `errorElement` de la ruta raíz. Si el error es un chunk perdido (un `lazy()` cuyo
 * `import()` falla tras un deploy) recarga una vez y muestra el spinner mientras tanto; si
 * ya se recargó hace poco, o es otro error, muestra un aviso con "Recargar".
 *
 * Cuando el `lazy` falla en una navegación, el router la confirma igualmente: hace el
 * `history.push` a la URL destino y pinta este `errorElement` allí, así que
 * `location.reload()` recarga el destino y no la página de origen.
 */
export function RouteErrorBoundary() {
  const error = useRouteError();
  const [reloadBlocked, setReloadBlocked] = useState(false);
  const isChunkError = isChunkLoadError(error);

  useEffect(() => {
    // En StrictMode el efecto corre dos veces: la segunda ve la recarga ya pedida.
    if (!isChunkError || isChunkReloadPending()) return;
    if (!reloadOnceForChunkError()) setReloadBlocked(true);
  }, [isChunkError]);

  if (isChunkError && !reloadBlocked) return <FullScreenSpinner />;

  return (
    <main className="nebula flex min-h-dvh items-center justify-center px-5 sm:px-8">
      <div className="flex w-full flex-col gap-4 sm:w-113">
        <div
          role="alert"
          className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-3 font-body text-xs text-danger"
        >
          {isChunkError
            ? "No se pudo cargar esta parte de la aplicación. Puede que haya una versión nueva: recarga la página."
            : "Algo salió mal al mostrar esta página. Recarga para intentarlo de nuevo."}
        </div>
        <GhostButton onClick={() => window.location.reload()}>Recargar</GhostButton>
      </div>
    </main>
  );
}
