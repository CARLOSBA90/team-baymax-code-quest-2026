const ROW_PLACEHOLDERS = ["a", "b", "c", "d"];

/** Placeholder de la lista de rutas mientras llega la primera respuesta. */
export function RoadmapsListSkeleton() {
  return (
    <div aria-busy="true" className="w-full">
      <p role="status" className="sr-only">
        Cargando rutas…
      </p>
      <div
        aria-hidden="true"
        data-testid="roadmaps-skeleton-blocks"
        className="flex animate-pulse flex-col gap-3 motion-reduce:animate-none"
      >
        <div className="mb-3 flex gap-2">
          <div className="h-10 w-24 rounded-full bg-bg-ghost-hover md:rounded-lg" />
          <div className="h-10 w-32 rounded-full bg-bg-ghost md:rounded-lg" />
          <div className="h-10 w-28 rounded-full bg-bg-ghost md:rounded-lg" />
        </div>
        {ROW_PLACEHOLDERS.map((key) => (
          <div
            key={key}
            className="flex h-28 items-center gap-4 rounded-card border border-border-field bg-bg-ghost px-4 lg:h-20 lg:px-6"
          >
            <div className="size-10 shrink-0 rounded-xl bg-bg-ghost-hover" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="h-4 w-3/5 max-w-72 rounded-full bg-bg-ghost-hover" />
              <div className="h-3 w-2/5 max-w-40 rounded-full bg-bg-ghost-hover" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
