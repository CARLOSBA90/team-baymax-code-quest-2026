import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Entrada del historial (`location.key`) a la que pertenece el aviso y su valor. `pending`
 * mientras se espera la entrada que crea la limpieza del `state` (el `replace` genera una `key`
 * nueva).
 */
interface NoticeOwner<T> {
  key: string;
  pending: boolean;
  value: T;
}

/**
 * Aviso de llegada leído de `location.state` (vía `parse`), ligado a una sola entrada del
 * historial. Devuelve el valor parseado, o `null` si la entrada actual no trae ninguno.
 *
 * Al llegar limpia el `state` con `replace` (para que no reaparezca al recargar); la entrada nueva
 * que crea esa limpieza hereda el aviso y cualquier otro cambio de `location.key` (atrás/adelante,
 * un `Link` a la misma ruta, un filtro con `replace`) lo descarta. No se usa `key={location.key}`
 * para remontar porque la propia limpieza cambia la `key` y borraría el aviso.
 *
 * `parse` debe ser una función pura de módulo (estable entre renders).
 */
export function useLocationStateNotice<T>(parse: (state: unknown) => T | null): T | null {
  const location = useLocation();
  const navigate = useNavigate();
  const arrived = parse(location.state);
  const hasArrived = arrived !== null;
  const [owner, setOwner] = useState<NoticeOwner<T> | null>(() =>
    arrived === null ? null : { key: location.key, pending: true, value: arrived },
  );
  // Evita un segundo `replace` si StrictMode repite el efecto sobre la misma entrada.
  const cleanedKeyRef = useRef<string | null>(null);

  if (arrived !== null && owner?.key !== location.key) {
    setOwner({ key: location.key, pending: true, value: arrived });
  } else if (owner !== null && owner.key !== location.key) {
    // La primera entrada nueva tras la limpieza hereda el aviso; cualquier otra lo descarta.
    setOwner(owner.pending ? { ...owner, key: location.key, pending: false } : null);
  }

  // Limpia el state de la entrada del historial para que el aviso no reaparezca al recargar.
  useEffect(() => {
    if (!hasArrived || cleanedKeyRef.current === location.key) return;
    cleanedKeyRef.current = location.key;
    navigate(
      { pathname: location.pathname, search: location.search, hash: location.hash },
      { replace: true, state: null },
    );
  }, [hasArrived, location, navigate]);

  return owner === null ? null : owner.value;
}
