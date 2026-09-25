const ROW_PLACEHOLDERS = ["a", "b", "c", "d", "e"];

/** Placeholder del detalle de una ruta mientras llega la primera respuesta. */
export function RoadmapDetailSkeleton() {
  return (
    <div aria-busy="true" className="w-full">
      <p role="status" className="sr-only">
        Cargando la ruta
      </p>
      <div
        aria-hidden="true"
        data-testid="roadmap-detail-skeleton-blocks"
        className="flex animate-pulse flex-col gap-7 motion-reduce:animate-none"
      >
        <div className="h-4 w-24 rounded-full bg-bg-ghost" />
        <div className="flex flex-col gap-3">
          <div className="h-9 w-3/4 max-w-xl rounded-full bg-bg-ghost-hover" />
          <div className="h-4 w-full max-w-2xl rounded-full bg-bg-ghost" />
          <div className="h-6 w-28 rounded-full bg-bg-ghost" />
        </div>
        <div className="flex flex-col gap-3 rounded-card border border-border-field bg-bg-ghost p-5">
          <div className="h-1.5 w-full rounded-full bg-bg-ghost-hover" />
          <div className="h-3 w-32 rounded-full bg-bg-ghost-hover" />
        </div>
        <div className="flex flex-col gap-3">
          {ROW_PLACEHOLDERS.map((key) => (
            <div
              key={key}
              className="flex h-16 items-center gap-4 rounded-card border border-border-field bg-bg-ghost px-4"
            >
              <div className="size-8 shrink-0 rounded-full bg-bg-ghost-hover" />
              <div className="h-4 w-3/5 max-w-72 rounded-full bg-bg-ghost-hover" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
