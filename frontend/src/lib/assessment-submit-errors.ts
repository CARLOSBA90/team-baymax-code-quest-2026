import { isAxiosError } from "axios";

// Techo de espera agotado en `POST /assessments/submit`: axios lo entrega **sin `response`** y con
// `code` "ECONNABORTED" (o "ETIMEDOUT" con `transitional.clarifyTimeoutError`). Precedente de
// lectura tolerante: `api-error-code.ts`. Nunca se muestra el `message` del backend.
// Este módulo no importa nada de `@/api`: `src/lib` no depende de `src/api`. La composición con
// el mapeador genérico vive en `AssessmentPage.tsx`.

const TIMEOUT_CODES = new Set(["ECONNABORTED", "ETIMEDOUT"]);

/**
 * Aviso tras un techo de espera agotado. Honesto: el backend persiste el assessment **antes** de
 * generar, así que la ruta puede existir; de ahí «Mis Rutas» como vía de recuperación.
 */
export const ASSESSMENT_SUBMIT_TIMEOUT_MESSAGE =
  "Tardamos demasiado en confirmar tu ruta. Puede que se haya creado igualmente: revisa Mis Rutas antes de volver a intentarlo.";

/** Se agotó el techo de espera del cliente (no es un 504 ni un fallo de red corriente). */
export function isAssessmentSubmitTimeoutError(error: unknown): boolean {
  if (!isAxiosError(error)) {
    return false;
  }
  // Hubo respuesta (p. ej. un 504): no es techo del cliente.
  if (error.response) {
    return false;
  }
  return error.code !== undefined && TIMEOUT_CODES.has(error.code);
}
