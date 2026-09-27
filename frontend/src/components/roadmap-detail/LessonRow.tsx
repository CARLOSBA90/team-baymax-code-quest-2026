import type { SyllabusLesson } from "@/types";

export interface LessonRowProps {
  lesson: SyllabusLesson;
  /**
   * Contexto del ítem al que pertenece la lección; entra en el `aria-label` del checkbox (varios
   * ítems pueden tener lecciones con títulos parecidos). El texto visible ya es el título de la
   * lección, así que esto solo enriquece el nombre accesible.
   */
  itemName: string;
  checked: boolean;
  /** Ya resuelto por `LessonChecklist` como `locked && !busy`: se aplica tal cual como nativo. */
  disabled: boolean;
  /** Esta lección concreta tiene una mutación en vuelo: `aria-busy`, nunca `disabled` nativo. */
  busy: boolean;
  onToggle: () => void;
}

/**
 * `<li>` con checkbox nativo + label de una lección del temario. Mientras `busy` el checkbox
 * conserva el foco y su tab stop (nunca `disabled` nativo, solo `aria-busy="true"`) y el
 * `onChange` es un no-op de reentrancia; los demás checkboxes del temario sí llevan `disabled`
 * nativo cuando `locked` (perder su foco es aceptable: no son el elemento pulsado).
 */
export function LessonRow({ lesson, itemName, checked, disabled, busy, onToggle }: LessonRowProps) {
  const handleChange = () => {
    if (busy) return;
    onToggle();
  };

  return (
    <li className="flex items-start gap-2.5 py-1.5">
      <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-2.5">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          aria-busy={busy || undefined}
          aria-label={`${lesson.title}, ${itemName}`}
          onChange={handleChange}
          className="mt-0.5 size-4 shrink-0 rounded border-border-item accent-accent disabled:cursor-not-allowed disabled:opacity-50"
        />
        <span className="min-w-0 flex-1 font-body text-[13px] text-text-secondary">
          {lesson.title}
        </span>
      </label>
    </li>
  );
}
