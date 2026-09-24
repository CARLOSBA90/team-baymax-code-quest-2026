import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createBrowserRouter,
  createMemoryRouter,
  Link,
  Outlet,
  type RouteObject,
  RouterProvider,
} from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isChunkReloadPending, reloadOnceForChunkError } from "@/lib";
import { RouteErrorBoundary } from "@/router/RouteErrorBoundary";

vi.mock("@/lib", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib")>()),
  isChunkReloadPending: vi.fn(),
  reloadOnceForChunkError: vi.fn(),
}));

const CHUNK_ERROR = new TypeError(
  "Failed to fetch dynamically imported module: https://app/assets/RoadmapsPage-abc.js",
);

function Boom(): never {
  throw new Error("Cannot read properties of undefined (reading 'map')");
}

function renderWithFailingChild(child: RouteObject) {
  const routes: RouteObject[] = [
    {
      path: "/",
      element: <Outlet />,
      errorElement: <RouteErrorBoundary />,
      children: [{ path: "pagina", ...child }],
    },
  ];
  const router = createMemoryRouter(routes, { initialEntries: ["/pagina"] });
  render(<RouterProvider router={router} />);
}

const failingLazy = (error: Error): RouteObject => ({ lazy: () => Promise.reject(error) });

describe("RouteErrorBoundary", () => {
  let reload: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    reload = vi.fn();
    vi.stubGlobal("location", { ...window.location, reload });
    vi.mocked(isChunkReloadPending).mockReturnValue(false);
    vi.mocked(reloadOnceForChunkError).mockReturnValue(true);
    // React y el router registran en consola los errores que captura el boundary.
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("si falla el import() de una ruta lazy recarga una vez y muestra el spinner", async () => {
    renderWithFailingChild(failingLazy(CHUNK_ERROR));

    await vi.waitFor(() => expect(reloadOnceForChunkError).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("status")).toHaveTextContent("Cargando…");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("si ya se recargó hace poco muestra el aviso de chunk con 'Recargar'", async () => {
    vi.mocked(reloadOnceForChunkError).mockReturnValue(false);
    renderWithFailingChild(failingLazy(CHUNK_ERROR));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No se pudo cargar esta parte de la aplicación",
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole("button", { name: "Recargar" }));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("con una recarga ya pedida (StrictMode, segundo efecto) no la pide otra vez", async () => {
    vi.mocked(isChunkReloadPending).mockReturnValue(true);
    renderWithFailingChild(failingLazy(CHUNK_ERROR));

    expect(await screen.findByRole("status")).toHaveTextContent("Cargando…");
    expect(reloadOnceForChunkError).not.toHaveBeenCalled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("otro error de ruta muestra el aviso genérico sin recargar solo", async () => {
    renderWithFailingChild({ element: <Boom /> });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Algo salió mal al mostrar esta página",
    );
    expect(reloadOnceForChunkError).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();

    await userEvent.setup().click(screen.getByRole("button", { name: "Recargar" }));
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

describe("RouteErrorBoundary con createBrowserRouter: recarga la URL destino", () => {
  // Rutas mínimas con la forma de las reales: origen cargado y destino cuyo chunk no existe.
  const browserRoutes: RouteObject[] = [
    {
      path: "/",
      element: <Outlet />,
      errorElement: <RouteErrorBoundary />,
      children: [
        {
          path: "dashboard/roadmaps",
          element: <Link to="/dashboard/roadmaps/new">Crear nueva ruta de aprendizaje</Link>,
        },
        { path: "dashboard/roadmaps/new", lazy: () => Promise.reject(CHUNK_ERROR) },
      ],
    },
  ];
  let router: ReturnType<typeof createBrowserRouter> | undefined;
  let pathnameAtReload: string | undefined;

  beforeEach(() => {
    pathnameAtReload = undefined;
    vi.mocked(isChunkReloadPending).mockReturnValue(false);
    // Se lee `window.location` real (no se stubbea): es lo que recargaría `location.reload()`.
    vi.mocked(reloadOnceForChunkError).mockImplementation(() => {
      pathnameAtReload = window.location.pathname;
      return true;
    });
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    router?.dispose();
    router = undefined;
    window.history.replaceState(null, "", "/");
  });

  it("si falla el chunk al navegar, el router confirma la URL destino antes de recargar", async () => {
    window.history.replaceState(null, "", "/dashboard/roadmaps");
    router = createBrowserRouter(browserRoutes);
    render(<RouterProvider router={router} />);

    await userEvent
      .setup()
      .click(await screen.findByRole("link", { name: "Crear nueva ruta de aprendizaje" }));

    await vi.waitFor(() => expect(reloadOnceForChunkError).toHaveBeenCalledTimes(1));
    expect(pathnameAtReload).toBe("/dashboard/roadmaps/new");
    expect(router.state.location.pathname).toBe("/dashboard/roadmaps/new");
    expect(screen.getByRole("status")).toHaveTextContent("Cargando…");
  });

  it("en un deep link con el chunk perdido recarga esa misma URL", async () => {
    window.history.replaceState(null, "", "/dashboard/roadmaps/new");
    router = createBrowserRouter(browserRoutes);
    render(<RouterProvider router={router} />);

    await vi.waitFor(() => expect(reloadOnceForChunkError).toHaveBeenCalledTimes(1));
    expect(pathnameAtReload).toBe("/dashboard/roadmaps/new");
    expect(screen.getByRole("status")).toHaveTextContent("Cargando…");
  });
});
