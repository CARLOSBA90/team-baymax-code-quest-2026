import { Navigate, Outlet } from "react-router-dom";
import { FullScreenSpinner } from "@/router/FullScreenSpinner";
import { useGuardSession } from "@/router/useGuardSession";

export function ProtectedRoute() {
  const { session, isInitialLoading } = useGuardSession();

  if (isInitialLoading) return <FullScreenSpinner />;
  if (!session) return <Navigate to="/auth/login" replace />;

  return <Outlet />;
}
