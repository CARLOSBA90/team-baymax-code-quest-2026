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

/** «Marcar como completado», deshabilitado hasta el slice 4 (sin escrituras). */
export function CompleteButton({ itemName, describedBy, size = "sm" }: CompleteButtonProps) {
  const { ghost, classes } = SIZES[size];

  return (
    <GhostButton
      size={ghost}
      disabled
      aria-describedby={describedBy}
      className={`text-sm ${classes}`}
    >
      <CheckIcon className="size-4" />
      Marcar como completado <span className="sr-only">{itemName}</span>
    </GhostButton>
  );
}
