import { Navigate, Outlet } from "react-router-dom";
import { SessionError } from "@/components/auth";
import { FullScreenSpinner } from "@/components/ui";
import { useGuardSession } from "@/router/useGuardSession";

export function ProtectedRoute() {
  const { session, error, refetch, isInitialLoading } = useGuardSession();

  if (isInitialLoading) return <FullScreenSpinner />;
  if (error) return <SessionError onRetry={() => refetch()} />;
  if (!session) return <Navigate to="/auth/login" replace />;

  return <Outlet />;
}
