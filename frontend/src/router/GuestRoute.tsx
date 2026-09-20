import { Navigate, Outlet } from "react-router-dom";
import { FullScreenSpinner } from "@/router/FullScreenSpinner";
import { useGuardSession } from "@/router/useGuardSession";

export function GuestRoute() {
  const { session, isInitialLoading } = useGuardSession();

  if (isInitialLoading) return <FullScreenSpinner />;
  if (session) return <Navigate to="/dashboard/roadmaps" replace />;

  return <Outlet />;
}
