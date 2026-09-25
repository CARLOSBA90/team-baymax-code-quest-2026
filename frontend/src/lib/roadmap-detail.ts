import type {
  RoadmapItem,
  RoadmapItemState,
  RoadmapItemTracking,
  RoadmapItemType,
  RoadmapNextStep,
} from "@/types";
import { ROADMAP_LEVEL_LABELS } from "./roadmap-labels";
import { clampProgress } from "./roadmap-presentation";

/** Progreso (0-100) a partir del cual un ítem cuenta como completado. */
export const ITEM_COMPLETED_PROGRESS = 100;

/** Tipos de tracking que el front puede marcar como completados. */
const TRACKABLE_TYPES: ReadonlySet<string> = new Set(["COMPLETION", "READING"]);

const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const SHORT_DATE_THRESHOLD_MS = 7 * DAY_MS;

const RELATIVE = new Intl.RelativeTimeFormat("es", { numeric: "auto" });
const SHORT_DATE = new Intl.DateTimeFormat("es", { day: "numeric", month: "short" });
const SHORT_DATE_WITH_YEAR = new Intl.DateTimeFormat("es", {
  day: "numeric",
  month: "short",
  year: "numeric",
});
const LONG_DATE = new Intl.DateTimeFormat("es", { day: "numeric", month: "long" });
const LONG_DATE_WITH_YEAR = new Intl.DateTimeFormat("es", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function isItemCompleted(item: Pick<RoadmapItem, "progress">): boolean {
  return item.progress >= ITEM_COMPLETED_PROGRESS;
}

/** Precedencia: completed > next (id === nextStepId) > in_progress (empezado) > pending. */
export function getItemState(
  item: Pick<RoadmapItem, "roadmapItemId" | "progress" | "startedAt">,
  nextStepId?: string | null,
): RoadmapItemState {
  if (isItemCompleted(item)) return "completed";
  if (item.roadmapItemId === nextStepId) return "next";
  if (item.startedAt !== null) return "in_progress";
  return "pending";
}

/** Solo COMPLETION y READING habilitados se completan desde el front; tipos desconocidos → false. */
export function canTrack(tracking: Pick<RoadmapItemTracking, "type" | "enabled">): boolean {
  return tracking.enabled && TRACKABLE_TYPES.has(tracking.type);
}

export function getCompletedCount(items: Pick<RoadmapItem, "progress">[]): number {
  return items.filter(isItemCompleted).length;
}

/** Suma de `estimatedMinutes`; `null` cuenta como 0. */
export function getTotalMinutes(items: Pick<RoadmapItem, "estimatedMinutes">[]): number {
  return items.reduce((total, item) => total + (item.estimatedMinutes ?? 0), 0);
}

/** Como `getTotalMinutes` pero sin los completados; los parciales cuentan enteros. */
export function getRemainingMinutes(
  items: Pick<RoadmapItem, "estimatedMinutes" | "progress">[],
): number {
  return getTotalMinutes(items.filter((item) => !isItemCompleted(item)));
}

/** «45 min» por debajo de una hora; si no, horas redondeadas («26 h»). Nunca decimales. */
export function formatHours(minutes: number): string {
  const rounded = Math.round(Math.max(0, minutes));
  if (rounded < 60) return `${rounded} min`;
  return `${Math.round(rounded / 60)} h`;
}

/**
 * Relativo largo («hace 2 horas», «ayer», «anteayer») por debajo de 7 días; desde 7 días fecha
 * corta («12 ago»), con año solo si difiere del de `now` («12 ago 2025»). El año se compara en
 * zona local, la misma que usan los formatters. Futuro → «ahora»; ISO inválido → "".
 */
export function formatRelative(iso: string, now: Date = new Date()): string {
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return "";

  const elapsed = Math.max(0, now.getTime() - time);
  if (elapsed < MINUTE_MS) return RELATIVE.format(-Math.floor(elapsed / SECOND_MS), "second");
  if (elapsed < HOUR_MS) return RELATIVE.format(-Math.floor(elapsed / MINUTE_MS), "minute");
  if (elapsed < DAY_MS) return RELATIVE.format(-Math.floor(elapsed / HOUR_MS), "hour");
  if (elapsed < SHORT_DATE_THRESHOLD_MS) {
    return RELATIVE.format(-Math.floor(elapsed / DAY_MS), "day");
  }

  return formatShortDate(iso, now);
}

/**
 * Fecha corta («12 ago»), con año solo si difiere del de `now` («12 ago 2025»). El año se compara
 * en zona local, la misma que usan los formatters. ISO inválido → "".
 */
export function formatShortDate(iso: string, now: Date = new Date()): string {
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return "";

  const then = new Date(time);
  const formatter = then.getFullYear() === now.getFullYear() ? SHORT_DATE : SHORT_DATE_WITH_YEAR;
  return formatter.format(then);
}

/**
 * Fecha larga («3 de septiembre»), con año solo si difiere del de `now` («3 de septiembre de
 * 2025»). El año se compara en zona local. ISO inválido → "".
 */
export function formatLongDate(iso: string, now: Date = new Date()): string {
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return "";

  const then = new Date(time);
  const formatter = then.getFullYear() === now.getFullYear() ? LONG_DATE : LONG_DATE_WITH_YEAR;
  return formatter.format(then);
}

/** «1 de 4 pasos»; singular «paso» si el total es 1. */
export function getRoadmapStepsProgressLabel(completed: number, total: number): string {
  return `${completed} de ${total} ${total === 1 ? "paso" : "pasos"}`;
}

/** «2 de 5 pasos completados»; singular «1 de 1 paso completado». */
export function getStepsCompletedLabel(completed: number, total: number): string {
  const suffix = total === 1 ? "completado" : "completados";
  return `${getRoadmapStepsProgressLabel(completed, total)} ${suffix}`;
}

/** `aria-valuetext` de la barra global: «40 por ciento. 2 de 5 pasos completados.» */
export function getRoadmapProgressValueText(
  progress: number,
  completed: number,
  total: number,
): string {
  return `${clampProgress(progress)} por ciento. ${getStepsCompletedLabel(completed, total)}.`;
}

export interface RoadmapProgressSummaryInput {
  completed: number;
  total: number;
  totalMinutes: number;
  remainingMinutes: number;
  isCompleted: boolean;
}

/**
 * «2 de 5 pasos · 77 h en total · quedan ~51 h». Omite «en total» sin minutos y «quedan» si la
 * ruta está completada o no queda tiempo.
 */
export function getRoadmapProgressSummary({
  completed,
  total,
  totalMinutes,
  remainingMinutes,
  isCompleted,
}: RoadmapProgressSummaryInput): string {
  const parts = [getRoadmapStepsProgressLabel(completed, total)];
  if (totalMinutes > 0) parts.push(`${formatHours(totalMinutes)} en total`);
  if (!isCompleted && remainingMinutes > 0) parts.push(`quedan ~${formatHours(remainingMinutes)}`);
  return parts.join(" · ");
}

/**
 * Texto del panel de ruta completada: «5 de 5 pasos · 77 h de estudio. Ya puedes crear otra ruta
 * para seguir avanzando.». Sin minutos se omiten las horas.
 */
export function getCompletedSummary(total: number, totalMinutes: number): string {
  const steps = getRoadmapStepsProgressLabel(total, total);
  const study = totalMinutes > 0 ? ` · ${formatHours(totalMinutes)} de estudio` : "";
  return `${steps}${study}. Ya puedes crear otra ruta para seguir avanzando.`;
}

/** «Paso 3 de 5»; `stepNumber` es la posición 1-based en la lista, no el `order` del ítem. */
export function getStepLabel(stepNumber: number, total: number): string {
  return `Paso ${stepNumber} de ${total}`;
}

const ITEM_TYPE_LABELS: Record<string, string | null> = {
  COURSE: null,
  MEDIA: "Recurso",
  CHALLENGE: "Reto",
};

/** COURSE → `null` (sin etiqueta); MEDIA → «Recurso»; CHALLENGE → «Reto»; desconocido → crudo. */
export function getItemTypeLabel(type: RoadmapItemType): string | null {
  return Object.hasOwn(ITEM_TYPE_LABELS, type) ? ITEM_TYPE_LABELS[type] : type;
}

export interface ItemMetaOptions {
  /** Posición del paso («Paso i de N»); se omite si no se pasa. */
  step?: { number: number; total: number };
  now?: Date;
}

/**
 * Meta de un ítem unida con « · »: [«Paso i de N»?, tipo?, nivel?, duración?, «completado el …»?].
 * Las partes nulas o inválidas se omiten sin separadores sobrantes.
 */
export function getItemMeta(
  item: Pick<RoadmapItem, "type" | "level" | "estimatedMinutes" | "completedAt">,
  { step, now = new Date() }: ItemMetaOptions = {},
): string {
  const parts: string[] = [];
  if (step) parts.push(getStepLabel(step.number, step.total));
  const typeLabel = getItemTypeLabel(item.type);
  if (typeLabel) parts.push(typeLabel);
  if (item.level) parts.push(ROADMAP_LEVEL_LABELS[item.level]);
  if (item.estimatedMinutes !== null) parts.push(formatHours(item.estimatedMinutes));
  const completedOn = item.completedAt ? formatShortDate(item.completedAt, now) : "";
  if (completedOn) parts.push(`completado el ${completedOn}`);
  return parts.join(" · ");
}

const TRACKING_METADATA_MESSAGE = "Aún no podemos registrar el avance de este curso.";
const TRACKING_GENERIC_MESSAGE = "No se puede marcar como completado desde aquí.";
const TRACKING_AUTOMATIC_MESSAGE = "El avance de este curso se registra automáticamente.";
const TRACKING_CHALLENGE_MESSAGE = "El avance se registra al enviar el reto.";

/** Texto por `disabledReason` (códigos de `backend/src/modules/progress/progress.constants.ts`). */
export const TRACKING_UNAVAILABLE_MESSAGES: Readonly<Record<string, string>> = {
  TRACKING_METADATA_MISSING: TRACKING_METADATA_MESSAGE,
  SYLLABUS_MISSING: TRACKING_METADATA_MESSAGE,
};

const AUTOMATIC_TRACKING_TYPES: ReadonlySet<string> = new Set(["VIDEO", "LESSONS"]);

/**
 * Por qué un ítem no se marca a mano (`null` si `canTrack`). Precedencia: `disabledReason` (código
 * conocido → su texto, desconocido → genérico) > VIDEO/LESSONS automáticos > CHALLENGE > genérico.
 * Nunca devuelve el código crudo.
 */
export function getTrackingUnavailableMessage(tracking: RoadmapItemTracking): string | null {
  if (canTrack(tracking)) return null;
  if (tracking.disabledReason) {
    return Object.hasOwn(TRACKING_UNAVAILABLE_MESSAGES, tracking.disabledReason)
      ? TRACKING_UNAVAILABLE_MESSAGES[tracking.disabledReason]
      : TRACKING_GENERIC_MESSAGE;
  }
  if (tracking.enabled && AUTOMATIC_TRACKING_TYPES.has(tracking.type)) {
    return TRACKING_AUTOMATIC_MESSAGE;
  }
  if (tracking.type === "CHALLENGE") return TRACKING_CHALLENGE_MESSAGE;
  return TRACKING_GENERIC_MESSAGE;
}

export interface NextStepItem {
  item: RoadmapItem;
  /** Posición 1-based en la lista. */
  stepNumber: number;
}

/** Ítem de «Continúa aquí» por `nextStep.roadmapItemId`; `null` sin siguiente paso o id huérfano. */
export function getNextStepItem(
  items: RoadmapItem[],
  nextStep: RoadmapNextStep | null,
): NextStepItem | null {
  if (!nextStep) return null;
  const index = items.findIndex((item) => item.roadmapItemId === nextStep.roadmapItemId);
  return index === -1 ? null : { item: items[index], stepNumber: index + 1 };
}
