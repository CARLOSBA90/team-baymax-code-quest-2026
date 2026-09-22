import { Outlet } from "react-router-dom";
import { DashboardSidebar } from "@/components/dashboard";

export function DashboardLayout() {
  return (
    <div className="flex h-dvh overflow-hidden">
      <DashboardSidebar />
      <main className="min-w-0 flex-1 overflow-auto pt-11 px-12 pb-10">
        <Outlet />
      </main>
    </div>
  );
}
