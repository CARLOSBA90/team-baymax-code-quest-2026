const OPTION_PLACEHOLDERS = ["a", "b", "c", "d"];

/** Placeholder de `AssessmentWizard` mientras cargan las preguntas; replica su geometría. */
export function AssessmentWizardSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className="w-full max-w-3xl">
      <span className="sr-only">Cargando preguntas…</span>
      <div
        aria-hidden="true"
        data-testid="assessment-skeleton-blocks"
        className="animate-pulse motion-reduce:animate-none"
      >
        <div className="flex flex-col gap-4">
          <div className="h-4 w-40 rounded-full bg-bg-ghost-hover" />
          <div className="h-1 w-full rounded-full bg-bg-ghost-hover" />
        </div>
        <div className="mt-7 h-8 w-full max-w-lg rounded-lg bg-bg-ghost-hover" />
        <div className="mt-1 h-4 w-32 rounded-full bg-bg-ghost-hover" />
        <div className="mt-5 grid auto-rows-fr grid-cols-1 gap-3 lg:grid-cols-2">
          {OPTION_PLACEHOLDERS.map((key) => (
            <div key={key} className="h-14 rounded-xl border border-border-field bg-bg-ghost" />
          ))}
        </div>
        <div className="mt-9 flex items-center justify-between gap-4">
          <div className="h-11 w-32 rounded-xl bg-bg-ghost" />
          <div className="h-12 w-40 rounded-xl bg-bg-ghost-hover" />
        </div>
      </div>
    </div>
  );
}
