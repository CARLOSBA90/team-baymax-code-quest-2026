import { createBrowserRouter } from "react-router-dom";
import { AuthLayout } from "@/components/layouts";
import { LoginPage, RegisterPage } from "@/pages";
import { Root } from "@/Root";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      // Auth Routes
      {
        path: "auth",
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
]);
