import { Navigate, Outlet } from "react-router-dom";
import { FullScreenSpinner } from "@/router/FullScreenSpinner";
import { SessionError } from "@/router/SessionError";
import { useGuardSession } from "@/router/useGuardSession";

export function GuestRoute() {
  const { session, error, refetch, isInitialLoading } = useGuardSession();

  if (isInitialLoading) return <FullScreenSpinner />;
  if (error) return <SessionError onRetry={() => refetch()} />;
  if (session) return <Navigate to="/dashboard/roadmaps" replace />;

  return <Outlet />;
}
