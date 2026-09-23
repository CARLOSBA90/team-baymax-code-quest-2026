import { createBrowserRouter, Navigate, type RouteObject } from "react-router-dom";
import { AuthLayout, DashboardLayout } from "@/components/layouts";
import { AssessmentPage, LoginPage, RegisterPage, RoadmapsPage } from "@/pages";
import { Root } from "@/Root";
import { GuestRoute } from "@/router/GuestRoute";
import { ProtectedRoute } from "@/router/ProtectedRoute";

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <Root />,
    children: [
      // Auth Routes (solo invitados)
      {
        path: "auth",
        element: <GuestRoute />,
        children: [
          {
            element: <AuthLayout />,
            children: [
              {
                path: "login",
                element: <LoginPage />,
              },
              {
                path: "register",
                element: <RegisterPage />,
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
            element: <DashboardLayout />,
            children: [
              {
                path: "roadmaps",
                element: <RoadmapsPage />,
              },
              {
                path: "roadmaps/new",
                element: <AssessmentPage />,
              },
            ],
          },
        ],
      },
    ],
  },
];

export const router = createBrowserRouter(routes);
