import { Outlet } from "react-router-dom";
import { useRoadmaps } from "@/api/queries/roadmaps";
import { DashboardSidebar, MobileTabBar, MobileTopBar } from "@/components/dashboard";

export function DashboardLayout() {
  // Misma key que RoadmapsPage: una sola petición/caché. undefined en carga/error → sin pill.
  const { data } = useRoadmaps();

  return (
    <div className="flex h-dvh overflow-hidden">
      <DashboardSidebar roadmapsCount={data?.counts.all} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar />
        {/* `relative`: main es el bloque contenedor de los descendientes absolutos (p. ej. los
            `sr-only` de cada fila). Sin él su bloque contenedor es el inicial, el overflow de
            main no los recorta y su posición estática estira el scroll del documento. */}
        <main className="relative min-w-0 flex-1 overflow-auto px-5 pt-4 pb-8 md:pl-12 md:pr-[max(3rem,env(safe-area-inset-right))] md:pt-11 md:pb-[max(2.5rem,env(safe-area-inset-bottom))]">
          <Outlet />
        </main>
        <MobileTabBar />
      </div>
    </div>
  );
}
