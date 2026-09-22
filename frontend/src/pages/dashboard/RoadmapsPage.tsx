import { RoadmapsEmptyState } from "@/components/dashboard";

export const RoadmapsPage = () => {
  return (
    <section className="flex h-full flex-col gap-7">
      <header className="flex flex-col gap-3">
        <h1 className="font-display text-4xl font-bold text-text-primary">Mis Rutas</h1>
        <p className="text-text-secondary">Aquí aparecerán las rutas de aprendizaje que crees.</p>
      </header>
      <RoadmapsEmptyState />
    </section>
  );
};
