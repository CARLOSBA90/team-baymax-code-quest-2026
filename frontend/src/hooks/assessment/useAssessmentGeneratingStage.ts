import { useEffect, useState } from "react";
import {
  ASSESSMENT_GENERATING_STAGES,
  type AssessmentGeneratingStage,
  getAssessmentGeneratingAnnouncement,
  getAssessmentGeneratingStage,
} from "@/lib";

export interface AssessmentGeneratingProgress {
  /** Etapa visible, o `null` si no hay espera en curso. */
  stage: AssessmentGeneratingStage | null;
  /** Texto de la live region; `""` sin espera en curso. */
  announcement: string;
}

/**
 * Avanza la narración de la espera por tiempo mientras `active`. Un `setTimeout` por etapa con
 * retardo absoluto (sin encadenar: no acumula deriva); al desactivarse o desmontar se cancelan
 * todos y la secuencia vuelve a la primera etapa, así que un reintento narra desde el principio.
 */
export function useAssessmentGeneratingStage(active: boolean): AssessmentGeneratingProgress {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    // Idempotente: React descarta el render si el valor no cambia.
    setIndex(0);
    if (!active) return;

    const timers: ReturnType<typeof setTimeout>[] = ASSESSMENT_GENERATING_STAGES.flatMap(
      (stage, i) => (stage.delayMs > 0 ? [setTimeout(() => setIndex(i), stage.delayMs)] : []),
    );

    return () => {
      for (const timer of timers) clearTimeout(timer);
    };
  }, [active]);

  return active
    ? {
        stage: getAssessmentGeneratingStage(index),
        announcement: getAssessmentGeneratingAnnouncement(index),
      }
    : { stage: null, announcement: "" };
}
