import { useRef } from "react";
import { useSession } from "@/api/queries/auth";

/**
 * Sesión para las guardas de ruta. `isInitialLoading` es true solo hasta que la primera
 * carga de la sesión se resuelve; los refetch posteriores (p. ej. tras sign-up/sign-in/sign-out,
 * donde better-auth pone `isPending: true` con `data === null`) no lo reactivan, así el
 * contenido de la ruta no se desmonta.
 */
export function useGuardSession() {
  const { data: session, isPending } = useSession();
  const hasResolvedRef = useRef(false);

  if (!isPending) hasResolvedRef.current = true;

  return { session, isInitialLoading: isPending && !hasResolvedRef.current };
}
