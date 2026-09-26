import { GhostButton, type GhostButtonProps } from "@/components/ui";
import { CheckIcon } from "./RoadmapDetailIcons";

export interface CompleteButtonProps {
  itemName: string;
  /** Id del texto que explica por qué está deshabilitado (p. ej. el banner de pausa). */
  describedBy?: string;
  /**
   * `sm` en el timeline (44px en móvil, 40px desde `sm:`), `md` en «Continúa aquí» (48px en
   * móvil, 44px desde `sm:`).
   */
  size?: "sm" | "md";
  onClick: () => void;
  /** En pausa el botón se deshabilita (y se describe con `describedBy`). */
  disabled?: boolean;
}

/**
 * Tamaño del `GhostButton` cuyo alto base es el de móvil; `classes` solo añade `w-full` y
 * variantes `sm:` (nunca otra utilidad base de alto/ancho, que competiría por orden de CSS).
 */
const SIZES: Record<
  NonNullable<CompleteButtonProps["size"]>,
  { ghost: NonNullable<GhostButtonProps["size"]>; classes: string }
> = {
  sm: { ghost: "md", classes: "w-full sm:h-10 sm:w-fit sm:px-4" },
  md: { ghost: "lg", classes: "w-full sm:h-11 sm:w-fit" },
};

/** «Marcar como completado»: pide al compositor abrir la confirmación (`onClick`). */
export function CompleteButton({
  itemName,
  describedBy,
  size = "sm",
  onClick,
  disabled = false,
}: CompleteButtonProps) {
  const { ghost, classes } = SIZES[size];

  return (
    <GhostButton
      size={ghost}
      onClick={onClick}
      disabled={disabled}
      aria-describedby={describedBy}
      className={`text-sm ${classes}`}
    >
      <CheckIcon className="size-4" />
      Marcar como completado <span className="sr-only">{itemName}</span>
    </GhostButton>
  );
}
