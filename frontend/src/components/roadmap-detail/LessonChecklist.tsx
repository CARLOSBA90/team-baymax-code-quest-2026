import { useId, useState } from "react";
import { getLessonListId, getLessonState, getLessonsProgressLabel } from "@/lib";
import type { RoadmapItem as RoadmapItemData } from "@/types";
import { COMPLETE_ALL_LESSONS_LABEL, CompleteButton } from "./CompleteButton";
import { LessonRow } from "./LessonRow";
import { ChevronIcon } from "./RoadmapDetailIcons";

export interface LessonChecklistProps {
  /** `syllabus` no es `null`: el padre (`RoadmapItem`) ya filtró con `isLessonChecklistItem`. */
  item: Pick<RoadmapItemData, "roadmapItemId" | "name" | "syllabus">;
  /** El mismo id que `RoadmapItem` usa para su h3 (`getItemHeadingId`); prefijo del `<ul>`. */
  headingId: string;
  /**
   * Bloqueo amplio: cualquier mutación de progreso en curso (marcar lección o completar ítem),
   * pausar/reanudar, o la ruta en pausa (el back rechaza reportes con 409 `ROADMAP_PAUSED`).
   */
  locked: boolean;
  /** `${roadmapItemId}:${lessonId}` de la lección con la mutación en vuelo, o `null`. */
  pendingKey: string | null;
  onToggle: (lessonId: string, completed: boolean) => void;
  /**
   * Atajo bulk: marca el temario entero. Ausente → no se pinta el botón (ítem ya completado o
   * tracking deshabilitado). Vive aquí, y no en la fila de acciones del ítem, para que se lea como
   * «marcar todas estas lecciones»; queda fuera del `<ul>` colapsable para no obligar a desplegar
   * cientos de casillas antes de encontrarlo.
   */
  onCompleteAll?: () => void;
  /** Deshabilita el botón de marcar todo (pausa o mutación de progreso en curso). */
  completeAllDisabled?: boolean;
  /** Id del párrafo del banner de pausa; describe el botón cuando la pausa lo deshabilita. */
  completeAllDescribedBy?: string;
}

/**
 * Disclosure del temario de un ítem `LESSONS`: botón `aria-expanded`/`aria-controls` + `<ul>`
 * agrupado por sección, siempre montado (oculto con `hidden` cuando está colapsado, para no
 * perder el estado interno de sus hijos). `expanded` es estado local no controlado a propósito:
 * no se resetea con el refetch pesimista tras marcar/desmarcar una lección (mismo componente,
 * mismo `key` del `<li>` padre), así el desplegable permanece abierto entre acciones seguidas.
 */
export function LessonChecklist({
  item,
  headingId,
  locked,
  pendingKey,
  onToggle,
  onCompleteAll,
  completeAllDisabled = false,
  completeAllDescribedBy,
}: LessonChecklistProps) {
  const [expanded, setExpanded] = useState(false);
  const buttonId = useId();
  const syllabus = item.syllabus;

  if (syllabus === null) return null;

  const listId = getLessonListId(headingId, item.roadmapItemId);
  const progressLabel = getLessonsProgressLabel(syllabus.completedLessons, syllabus.totalLessons);

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        id={buttonId}
        aria-expanded={expanded}
        aria-controls={listId}
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-border-item px-3 py-2 text-left font-body text-[13px] text-text-secondary transition-colors hover:bg-bg-ghost-hover hover:text-text-primary"
      >
        <span>
          Temario <span className="text-text-muted">· {progressLabel}</span>
        </span>
        <ChevronIcon
          className={`size-4 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>
      {onCompleteAll ? (
        <CompleteButton
          itemName={item.name}
          label={COMPLETE_ALL_LESSONS_LABEL}
          describedBy={completeAllDescribedBy}
          disabled={completeAllDisabled}
          onClick={onCompleteAll}
        />
      ) : null}
      <ul
        id={listId}
        aria-labelledby={buttonId}
        hidden={!expanded}
        className="flex flex-col gap-2.5"
      >
        {syllabus.sections.map((section) => (
          <li key={section.title} className="flex flex-col gap-1.5">
            <p className="font-body font-semibold text-[12px] text-text-muted uppercase tracking-wide">
              {section.title}
            </p>
            <ul className="flex flex-col">
              {section.lessons.map((lesson) => {
                const key = `${item.roadmapItemId}:${lesson.lessonId}`;
                const busy = pendingKey === key;
                return (
                  <LessonRow
                    key={lesson.lessonId}
                    lesson={lesson}
                    itemName={item.name}
                    checked={getLessonState(lesson) === "completed"}
                    disabled={locked && !busy}
                    busy={busy}
                    onToggle={() => onToggle(lesson.lessonId, !lesson.completed)}
                  />
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
