import { PrimaryButton } from "@/components/auth";
import { NebulaSurface } from "@/components/ui";

function RouteIllustration() {
  return (
    <svg className="h-24 w-70" viewBox="0 0 280 96" fill="none" aria-hidden="true">
      <path
        d="M24 72 C 80 72, 84 24, 140 24 S 200 72, 256 72"
        className="stroke-accent-soft/45"
        strokeWidth="2"
        strokeDasharray="2 8"
        strokeLinecap="round"
      />
      <circle cx="24" cy="72" r="11" className="fill-accent" />
      <circle cx="24" cy="72" r="19" className="stroke-accent-hover/35" strokeWidth="1.5" />
      <circle
        cx="140"
        cy="24"
        r="10"
        className="fill-empty-bg stroke-accent-soft/60"
        strokeWidth="2"
      />
      <circle
        cx="256"
        cy="72"
        r="10"
        className="fill-empty-bg stroke-accent-soft/60"
        strokeWidth="2"
      />
      <path
        d="M251 72 l3.5 3.5 6.5 -7"
        className="stroke-accent-soft"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

const STEPS: { number: string; title: string }[] = [
  { number: "01", title: "Cuéntanos qué te interesa" },
  { number: "02", title: "Evalúa tu nivel actual" },
  { number: "03", title: "Recibe tu ruta y avanza" },
];

// TODO(§15): conectar con el cuestionario cuando exista la ruta /dashboard/assessment.
// Sin funcionalidad de forma intencional en este incremento (fuera de alcance).
function handleCreateFirstRoadmap() {}

export function RoadmapsEmptyState() {
  return (
    <NebulaSurface>
      <RouteIllustration />
      <div className="mt-9 flex max-w-md flex-col gap-5 text-center">
        <h2 className="font-display text-2xl font-bold text-text-primary">Aún no tienes rutas</h2>
        <p className="text-text-secondary">
          Responde un cuestionario corto para que armemos tu primera ruta de aprendizaje
          personalizada.
        </p>
      </div>
      <PrimaryButton
        type="button"
        variant="cta"
        className="mt-8"
        onClick={handleCreateFirstRoadmap}
      >
        <PlusIcon className="size-4" />
        Crear mi primera ruta
      </PrimaryButton>
      <ul className="mt-10 grid grid-cols-3 gap-4">
        {STEPS.map((step) => (
          <li key={step.number} className="rounded-xl border border-border-field bg-bg-ghost p-4">
            <p className="text-accent-soft">{step.number}</p>
            <p className="mt-5 text-text-primary">{step.title}</p>
          </li>
        ))}
      </ul>
    </NebulaSurface>
  );
}
