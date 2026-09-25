import { PrimaryButton } from "@/components/ui";

export interface RoadmapLoadErrorProps {
  onRetry: () => void;
}

/**
 * Error al cargar el detalle (red, 5xx…). Copy fijo en español: nunca se muestra el `message`
 * del back.
 */
export function RoadmapLoadError({ onRetry }: RoadmapLoadErrorProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-5 rounded-card border border-border-field bg-bg-ghost px-5 py-10 text-center md:p-12"
    >
      <h1 className="font-display text-2xl font-bold text-text-primary">
        No pudimos cargar la ruta
      </h1>
      <p className="text-text-secondary">Comprueba tu conexión e inténtalo de nuevo.</p>
      <PrimaryButton variant="cta" onClick={onRetry}>
        Reintentar
      </PrimaryButton>
    </div>
  );
}
