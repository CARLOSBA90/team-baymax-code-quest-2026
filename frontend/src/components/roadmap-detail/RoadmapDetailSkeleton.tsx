const ROW_PLACEHOLDERS = ["a", "b", "c", "d", "e"];

/**
 * Placeholder del detalle de una ruta mientras llega la primera respuesta. Reproduce la geometría
 * real (design.md §16.5) dentro de la misma columna de 920px que `RoadmapDetailView`.
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
        <div data-testid="skeleton-back-link" className="h-4 w-24 rounded-full bg-bg-ghost" />
        <div className="flex flex-col gap-3">
          <div
            data-testid="skeleton-title"
            className="h-7.5 w-70 max-w-full rounded-full bg-bg-ghost-hover"
          />
          <div
            data-testid="skeleton-summary"
            className="h-4 w-105 max-w-full rounded-full bg-bg-ghost"
          />
          <div data-testid="skeleton-badge" className="h-6.5 w-22.5 rounded-full bg-bg-ghost" />
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
          className="h-37.5 w-full rounded-[18px] border border-border-item bg-bg-ghost"
        />
        <ul className="flex flex-col">
          {ROW_PLACEHOLDERS.map((key) => (
            <li
              key={key}
              data-testid="skeleton-timeline-row"
              className="pb-3.5 pl-9 last:pb-0 lg:pl-11"
            >
              <div className="h-28 w-full rounded-2xl border border-border-item bg-bg-ghost" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
