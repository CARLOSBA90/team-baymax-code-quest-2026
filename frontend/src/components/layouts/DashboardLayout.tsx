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
        <main className="min-w-0 flex-1 overflow-auto px-5 pt-4 pb-8 md:px-12 md:pt-11 md:pb-10">
          <Outlet />
        </main>
        <MobileTabBar />
      </div>
    </div>
  );
}
