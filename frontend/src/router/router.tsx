import { createBrowserRouter } from "react-router-dom";
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
