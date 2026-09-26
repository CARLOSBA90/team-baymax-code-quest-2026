import { GHOST_LINK_CLASSES, NEXT_LINK_CLASSES, PRIMARY_LINK_CLASSES } from "./link-classes";
import { ExternalLinkIcon } from "./RoadmapDetailIcons";

export type ExternalCourseLinkVariant = "primary" | "ghost" | "next";

export interface ExternalCourseLinkProps {
  url: string;
  itemName: string;
  variant: ExternalCourseLinkVariant;
}

/**
 * Mobile-first: en móvil ocupa el ancho completo (48px en «Continúa aquí», 44px en el timeline);
 * desde `sm:` se ajusta al contenido (44px / 40px).
 */
const VARIANT_CLASSES: Record<ExternalCourseLinkVariant, string> = {
  primary: `${PRIMARY_LINK_CLASSES} h-12 w-full px-5 sm:h-11 sm:w-fit`,
  ghost: `${GHOST_LINK_CLASSES} h-11 w-full px-4 sm:h-10 sm:w-fit`,
  next: `${NEXT_LINK_CLASSES} h-11 w-full px-4 sm:h-10 sm:w-fit`,
};

/**
 * «Ir al curso ↗» en pestaña nueva. El nombre accesible empieza por el texto visible y añade el
 * ítem y el aviso de pestaña nueva, así cada enlace del timeline es distinguible. Los espacios
 * van fuera de los `sr-only` (el cálculo del nombre recorta el texto de cada hijo); en el flex
 * no se pintan.
 */
export function ExternalCourseLink({ url, itemName, variant }: ExternalCourseLinkProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`text-sm ${VARIANT_CLASSES[variant]}`}
    >
      Ir al curso <span className="sr-only">{itemName}</span>
      <ExternalLinkIcon className="size-4" />{" "}
      <span className="sr-only">(se abre en una pestaña nueva)</span>
    </a>
  );
}
