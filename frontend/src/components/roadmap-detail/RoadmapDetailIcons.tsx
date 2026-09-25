import type { PropsWithChildren } from "react";

export interface RoadmapDetailIconProps {
  className?: string;
}

/** Base común: 24×24, trazo `currentColor`, siempre decorativo (el texto va al lado). */
function StrokeIcon({ className, children }: PropsWithChildren<RoadmapDetailIconProps>) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/** Curso: play dentro de un rectángulo. */
export function CourseIcon({ className }: RoadmapDetailIconProps) {
  return (
    <StrokeIcon className={className}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <polygon points="10 9 15 12 10 15 10 9" />
    </StrokeIcon>
  );
}

/** Recurso (MEDIA): documento. */
export function DocumentIcon({ className }: RoadmapDetailIconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <polyline points="14 3 14 8 19 8" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="13" y2="17" />
    </StrokeIcon>
  );
}

/** Reto (CHALLENGE): bandera. */
export function FlagIcon({ className }: RoadmapDetailIconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="M5 21V4" />
      <path d="M5 4h11l-2 4 2 4H5" />
    </StrokeIcon>
  );
}

/** Tipo desconocido: cuadrícula genérica. */
export function GenericItemIcon({ className }: RoadmapDetailIconProps) {
  return (
    <StrokeIcon className={className}>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </StrokeIcon>
  );
}

export function CheckIcon({ className }: RoadmapDetailIconProps) {
  return (
    <StrokeIcon className={className}>
      <polyline points="5 12.5 10 17.5 19 7" />
    </StrokeIcon>
  );
}

/** Flecha ↗ de enlace externo. */
export function ExternalLinkIcon({ className }: RoadmapDetailIconProps) {
  return (
    <StrokeIcon className={className}>
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="8 7 17 7 17 16" />
    </StrokeIcon>
  );
}

export function PauseIcon({ className }: RoadmapDetailIconProps) {
  return (
    <StrokeIcon className={className}>
      <line x1="9" y1="6" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="18" />
    </StrokeIcon>
  );
}

export function PlayIcon({ className }: RoadmapDetailIconProps) {
  return (
    <StrokeIcon className={className}>
      <polygon points="7 5 19 12 7 19 7 5" />
    </StrokeIcon>
  );
}
