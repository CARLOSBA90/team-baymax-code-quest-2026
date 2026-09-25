import { GhostButton } from "@/components/ui";
import { CheckIcon } from "./RoadmapDetailIcons";

export interface CompleteButtonProps {
  itemName: string;
  /** Id del texto que explica por qué está deshabilitado (p. ej. el banner de pausa). */
  describedBy?: string;
  /** `sm` (40px) en el timeline, `md` (44px) en «Continúa aquí». */
  size?: "sm" | "md";
}

/** «Marcar como completado», deshabilitado hasta el slice 4 (sin escrituras). */
export function CompleteButton({ itemName, describedBy, size = "sm" }: CompleteButtonProps) {
  return (
    <GhostButton size={size} disabled aria-describedby={describedBy} className="text-sm">
      <CheckIcon className="size-4" />
      Marcar como completado <span className="sr-only">{itemName}</span>
    </GhostButton>
  );
}
