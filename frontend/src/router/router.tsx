import { createBrowserRouter, Navigate, type RouteObject } from "react-router-dom";
import { FullScreenSpinner } from "@/components/ui";
import { Root } from "@/Root";
import { GuestRoute } from "@/router/GuestRoute";
import { ProtectedRoute } from "@/router/ProtectedRoute";
import { RouteErrorBoundary } from "@/router/RouteErrorBoundary";

/*
 * Code splitting por ruta con la propiedad `lazy` del data router: cada layout y página
 * es un chunk aparte que el router descarga (en paralelo para todas las rutas que casan)
 * antes de pintar la navegación, así que no hay `Suspense` ni parpadeo del shell. En la
 * carga inicial se muestra el `hydrateFallbackElement` de la raíz.
 *
 * Los `import()` apuntan al fichero concreto y no al barrel: un barrel metería todas las
 * páginas en el mismo chunk (excepción a la regla de barrels, ver `biome.json`).
 */
export const routes: RouteObject[] = [
  {
    path: "/",
    element: <Root />,
    hydrateFallbackElement: <FullScreenSpinner />,
    // Chunk perdido tras un deploy (recarga una vez) o cualquier otro error de ruta.
    errorElement: <RouteErrorBoundary />,
    children: [
      // Auth Routes (solo invitados)
      {
        path: "auth",
        element: <GuestRoute />,
        children: [
          {
            lazy: async () => {
              const { AuthLayout } = await import("@/components/layouts/AuthLayout");
              return { Component: AuthLayout };
            },
            children: [
              {
                path: "login",
                lazy: async () => {
                  const { LoginPage } = await import("@/pages/auth/LoginPage");
                  return { Component: LoginPage };
                },
              },
              {
                path: "register",
                lazy: async () => {
                  const { RegisterPage } = await import("@/pages/auth/RegisterPage");
                  return { Component: RegisterPage };
                },
              },
            ],
          },
        ],
      },
      // Dashboard Routes (protegidas)
      {
        path: "dashboard",
        element: <ProtectedRoute />,
        children: [
          {
            index: true,
            element: <Navigate to="roadmaps" replace />,
          },
          {
            lazy: async () => {
              const { DashboardLayout } = await import("@/components/layouts/DashboardLayout");
              return { Component: DashboardLayout };
            },
            children: [
              {
                path: "roadmaps",
                lazy: async () => {
                  const { RoadmapsPage } = await import("@/pages/dashboard/RoadmapsPage");
                  return { Component: RoadmapsPage };
                },
              },
              {
                path: "roadmaps/new",
                lazy: async () => {
                  const { AssessmentPage } = await import("@/pages/dashboard/AssessmentPage");
                  return { Component: AssessmentPage };
                },
              },
              {
                path: "roadmaps/:roadmapId",
                lazy: async () => {
                  const { RoadmapDetailPage } = await import("@/pages/dashboard/RoadmapDetailPage");
                  return { Component: RoadmapDetailPage };
                },
              },
            ],
          },
        ],
      },
    ],
  },
];

export const router = createBrowserRouter(routes);
