// Clases de enlaces con forma de botón del detalle de ruta. Uso interno de
// `components/roadmap-detail/` (no se exporta desde el barrel). Sin altura, padding ni ancho: cada
// consumidor añade los suyos, porque dos utilidades base del mismo property (`h-*`, `w-*`) en la
// misma clase compiten por orden de CSS, no por orden de clase.

const LINK_SHAPE =
  "flex items-center justify-center gap-2 rounded-xl border font-body outline-none transition-[filter,background-color,border-color,box-shadow] duration-150 ease-out focus-visible:border-accent-hover focus-visible:shadow-ring-focus";

/** Violeta sólido, como `PrimaryButton`. */
export const PRIMARY_LINK_CLASSES = `${LINK_SHAPE} border-transparent bg-accent font-bold text-white shadow-primary hover:brightness-110`;

/** Fantasma, como `GhostButton`. */
export const GHOST_LINK_CLASSES = `${LINK_SHAPE} border-border-ghost bg-bg-ghost font-semibold text-text-primary hover:border-border-ghost-hover hover:bg-bg-ghost-hover`;

/** Fantasma violeta para el paso siguiente del timeline. */
export const NEXT_LINK_CLASSES = `${LINK_SHAPE} border-border-item-next bg-accent/15 font-semibold text-text-primary hover:bg-accent/25`;
