import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthNotice } from "@/components/auth";
import { RoadmapsEmptyState } from "@/components/dashboard";
import { isAssessmentCompletedState } from "@/lib";

/**
 * Entrada del historial (`location.key`) a la que pertenece el aviso. `pending` mientras se
 * espera la entrada que crea la limpieza del `state` (el `replace` genera una `key` nueva).
 */
interface NoticeOwner {
  key: string;
  pending: boolean;
}

/**
 * Aviso de cuestionario completado, ligado a una sola entrada del historial.
 *
 * `RoadmapsPage` no se remonta al cambiar entre entradas de la misma ruta (atrás/adelante, un
 * `Link` a Mis Rutas), así que no basta con congelar el valor inicial: el aviso se descarta en
 * cuanto `location.key` deja de ser la de su entrada. No se usa `key={location.key}` para
 * remontar porque la propia limpieza con `replace` cambia la `key` y borraría el aviso.
 */
function useAssessmentCompletedNotice(): boolean {
  const location = useLocation();
  const navigate = useNavigate();
  const arrivedCompleted = isAssessmentCompletedState(location.state);
  const [owner, setOwner] = useState<NoticeOwner | null>(() =>
    arrivedCompleted ? { key: location.key, pending: true } : null,
  );
  // Evita un segundo `replace` si StrictMode repite el efecto sobre la misma entrada.
  const cleanedKeyRef = useRef<string | null>(null);

  if (arrivedCompleted && owner?.key !== location.key) {
    setOwner({ key: location.key, pending: true });
  } else if (owner !== null && owner.key !== location.key) {
    // La primera entrada nueva tras la limpieza hereda el aviso; cualquier otra lo descarta.
    setOwner(owner.pending ? { key: location.key, pending: false } : null);
  }

  // Limpia el state de la entrada del historial para que el aviso no reaparezca al recargar.
  useEffect(() => {
    if (!arrivedCompleted || cleanedKeyRef.current === location.key) return;
    cleanedKeyRef.current = location.key;
    navigate(
      { pathname: location.pathname, search: location.search, hash: location.hash },
      { replace: true, state: null },
    );
  }, [arrivedCompleted, location, navigate]);

  return owner !== null;
}

export const RoadmapsPage = () => {
  const showAssessmentNotice = useAssessmentCompletedNotice();

  return (
    <section className="flex h-full flex-col gap-7">
      <header className="flex flex-col gap-3">
        <h1 className="font-display text-4xl font-bold text-text-primary">Mis Rutas</h1>
        <p className="text-text-secondary">Aquí aparecerán las rutas de aprendizaje que crees.</p>
      </header>
      {showAssessmentNotice && (
        <AuthNotice variant="success">
          ¡Cuestionario completado! Guardamos tus respuestas; pronto verás aquí tu ruta recomendada.
        </AuthNotice>
      )}
      <RoadmapsEmptyState />
    </section>
  );
};
