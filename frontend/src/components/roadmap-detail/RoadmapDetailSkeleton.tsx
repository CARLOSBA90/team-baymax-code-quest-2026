const ROW_PLACEHOLDERS = ["a", "b", "c", "d", "e"];

/**
 * Placeholder del detalle de una ruta mientras llega la primera respuesta. Reproduce la geometría
 * real (design.md §16.5) dentro de la misma columna de 920px que `RoadmapDetailView`.
 * Mobile-first: en móvil sin bloque de summary (es `sr-only`), filas sin hueco de riel y tarjetas
 * más altas (contenido apilado); desde `sm:` la geometría de tablet (riel 28px) y `lg:` escritorio.
 */
export function RoadmapDetailSkeleton() {
  return (
    <div aria-busy="true" className="w-full max-w-detail">
      <p role="status" className="sr-only">
        Cargando la ruta
      </p>
      <div
        aria-hidden="true"
        data-testid="roadmap-detail-skeleton-blocks"
        className="flex animate-pulse flex-col gap-5.5 motion-reduce:animate-none"
      >
        {/*
         * Mismo grid de áreas que `RoadmapDetailView` (miga/cabecera/⋯) para reservar el hueco de
         * 44×44 del ⋯ real y evitar salto de layout al pasar del skeleton al contenido.
         */}
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-5.5 [grid-template-areas:'back_menu'_'header_header'] sm:[grid-template-areas:'back_back'_'header_menu']">
          <div
            data-testid="skeleton-back-link"
            className="h-4 w-24 self-center rounded-full bg-bg-ghost [grid-area:back]"
          />
          <div className="flex flex-col gap-3 [grid-area:header]">
            <div
              data-testid="skeleton-title"
              className="h-6.5 w-70 max-w-full rounded-full bg-bg-ghost-hover sm:h-7.5"
            />
            <div
              data-testid="skeleton-summary"
              className="hidden h-4 w-105 max-w-full rounded-full bg-bg-ghost sm:block"
            />
            <div data-testid="skeleton-badge" className="h-6.5 w-22.5 rounded-full bg-bg-ghost" />
          </div>
          <div
            data-testid="skeleton-menu"
            className="size-11 self-center rounded-full bg-bg-ghost [grid-area:menu] sm:self-start"
          />
        </div>
        <div className="flex flex-col gap-2.5">
          <div
            data-testid="skeleton-progress"
            className="h-2 w-full rounded-full bg-progress-track"
          />
          <div className="h-3.5 w-56 max-w-full rounded-full bg-bg-ghost" />
        </div>
        <div
          data-testid="skeleton-next-step"
          className="h-56 w-full rounded-[18px] border border-border-item bg-bg-ghost sm:h-37.5"
        />
        <ul className="flex flex-col">
          {ROW_PLACEHOLDERS.map((key) => (
            <li
              key={key}
              data-testid="skeleton-timeline-row"
              className="pb-3.5 last:pb-0 sm:pl-7 lg:pl-11"
            >
              <div className="h-40 w-full rounded-2xl border border-border-item bg-bg-ghost sm:h-28" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
