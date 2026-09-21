import { createBrowserRouter } from "react-router-dom";
import { AuthLayout } from "@/components/layouts";
import { LoginPage, RegisterPage, RoadmapsPage } from "@/pages";
import { Root } from "@/Root";
import { GuestRoute } from "@/router/GuestRoute";
import { ProtectedRoute } from "@/router/ProtectedRoute";

export const router = createBrowserRouter([
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
            path: "roadmaps",
            element: <RoadmapsPage />,
          },
        ],
      },
    ],
  },
]);
