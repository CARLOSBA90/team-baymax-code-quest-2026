import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useSyncExternalStore } from "react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { useLogout, useSession } from "@/api/queries/auth";
import { getAssessmentQuestions, getRoadmaps } from "@/api/services";
import { routes } from "@/router/router";
import { ASSESSMENT_QUESTIONS_MOCK } from "@/test/fixtures/assessments";
import { EMPTY_ROADMAPS_RESULT, ROADMAPS_LIST_RESULT } from "@/test/fixtures/roadmaps";
import { preloadLazyRoutes } from "@/test/renderRoutes";

const store = vi.hoisted(() => {
  const listeners = new Set<() => void>();
  let session: unknown = null;
  return {
    get: () => session,
    set: (next: unknown) => {
      session = next;
      for (const l of listeners) l();
    },
    subscribe: (l: () => void) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
  };
});

vi.mock("@/router/useGuardSession", () => ({
  useGuardSession: () => ({
    session: useSyncExternalStore(store.subscribe, store.get),
    error: null,
    refetch: vi.fn(),
    isInitialLoading: false,
  }),
}));
vi.mock("@/api/queries/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/api/queries/auth")>()),
  useSession: vi.fn(),
  useLogout: vi.fn(),
}));
vi.mock("@/api/services", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/api/services")>()),
  deleteRoadmap: vi.fn(),
  getAssessmentQuestions: vi.fn(),
  getRoadmaps: vi.fn(),
  submitAssessment: vi.fn(),
}));

const USER = { name: "Ada Lovelace", email: "ada@example.com" };
// El sidebar añade el total al nombre accesible ("Mis Rutas, 5 rutas") cuando la lista ha
// cargado; la tab bar no lleva pill.
const ROUTES_LINK_NAME = /^Mis Rutas(, \d+ rutas?)?$/;

function sidebarRoutesLink() {
  const nav = screen.getByRole("navigation", { name: "Navegación principal" });
  return within(nav).getByRole("link", { name: ROUTES_LINK_NAME });
}

function tabBarRoutesLink() {
  const nav = screen.getByRole("navigation", { name: "Navegación inferior" });
  return within(nav).getByRole("link", { name: "Mis Rutas" });
}
const SESSION = { user: USER, session: { id: "s1" } };

function renderRoutes(initialEntries: string[]) {
  const router = createMemoryRouter(routes, { initialEntries });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
}

describe("rutas del dashboard", () => {
  beforeAll(() => preloadLazyRoutes());

  beforeEach(() => {
    vi.mocked(getAssessmentQuestions).mockResolvedValue(ASSESSMENT_QUESTIONS_MOCK);
    vi.mocked(getRoadmaps).mockResolvedValue(EMPTY_ROADMAPS_RESULT);
    store.set(SESSION);
    vi.mocked(useSession).mockReturnValue({
      data: { user: USER },
    } as unknown as ReturnType<typeof useSession>);
    vi.mocked(useLogout).mockReturnValue({
      mutate: () => store.set(null),
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof useLogout>);
  });

  it("redirige /dashboard a /dashboard/roadmaps dentro del layout", async () => {
    const router = renderRoutes(["/dashboard"]);
    expect(await screen.findByRole("heading", { name: "Mis Rutas", level: 1 })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/dashboard/roadmaps");
    expect(screen.getByRole("complementary")).toBeInTheDocument();
    expect(screen.getByRole("main")).toContainElement(
      screen.getByRole("heading", { name: "Mis Rutas" }),
    );
  });

  it("la redirección usa replace: atrás no vuelve a /dashboard", async () => {
    const router = renderRoutes(["/auth/login-previa", "/dashboard"]);
    await screen.findByRole("heading", { name: "Mis Rutas" });
    await router.navigate(-1);
    expect(router.state.location.pathname).not.toBe("/dashboard");
  });

  it("sin sesión redirige a /auth/login sin sidebar", async () => {
    store.set(null);
    const router = renderRoutes(["/dashboard/roadmaps"]);
    await waitFor(() => expect(router.state.location.pathname).toBe("/auth/login"));
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
  });

  it("el logout exitoso lleva a /auth/login", async () => {
    const router = renderRoutes(["/dashboard/roadmaps"]);
    await userEvent.setup().click(await screen.findByRole("button", { name: "Cerrar sesión" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/auth/login"));
  });

  it("clic en Mis Rutas desde el índice (/dashboard) navega a /dashboard/roadmaps", async () => {
    const router = renderRoutes(["/dashboard"]);
    await screen.findByRole("heading", { name: "Mis Rutas" });
    await userEvent.setup().click(sidebarRoutesLink());
    await waitFor(() => expect(router.state.location.pathname).toBe("/dashboard/roadmaps"));
  });

  it("clic en Mis Rutas de la tab bar desde /new navega a /dashboard/roadmaps", async () => {
    const router = renderRoutes(["/dashboard/roadmaps/new"]);
    await screen.findByRole("heading", { level: 1, name: "Descubre tu ruta" });
    await userEvent.setup().click(tabBarRoutesLink());
    await waitFor(() => expect(router.state.location.pathname).toBe("/dashboard/roadmaps"));
  });

  it("el layout incluye top bar móvil y tab bar en todas las rutas del dashboard", async () => {
    renderRoutes(["/dashboard/roadmaps"]);
    await screen.findByRole("heading", { name: "Mis Rutas", level: 1 });
    const avatarMenu = screen.getByRole("button", { name: "Menú de usuario de Ada Lovelace" });
    expect(avatarMenu.closest("header")).toHaveClass("md:hidden");
    expect(tabBarRoutesLink()).toHaveAttribute("aria-current", "page");
    expect(sidebarRoutesLink()).toHaveAttribute("aria-current", "page");
  });

  it("el logout desde el menú del avatar lleva a /auth/login", async () => {
    const router = renderRoutes(["/dashboard/roadmaps"]);
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole("button", { name: "Menú de usuario de Ada Lovelace" }),
    );
    await user.click(screen.getByRole("menuitem", { name: "Cerrar sesión" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/auth/login"));
  });

  it("/dashboard/roadmaps/new renderiza el cuestionario dentro del layout con Mis Rutas activo", async () => {
    renderRoutes(["/dashboard/roadmaps/new"]);

    const title = await screen.findByRole("heading", { level: 1, name: "Descubre tu ruta" });
    expect(screen.getByRole("main")).toContainElement(title);
    expect(sidebarRoutesLink()).toHaveAttribute("aria-current", "page");
    expect(tabBarRoutesLink()).toHaveAttribute("aria-current", "page");
  });

  it("con ?status=paused el pill del sidebar sigue mostrando el total global", async () => {
    vi.mocked(getRoadmaps).mockResolvedValue(ROADMAPS_LIST_RESULT);
    renderRoutes(["/dashboard/roadmaps?status=paused"]);

    const nav = await screen.findByRole("navigation", { name: "Navegación principal" });
    expect(
      await within(nav).findByRole("link", { name: "Mis Rutas, 5 rutas" }),
    ).toBeInTheDocument();
  });

  it("en /dashboard/roadmaps/new el pill del sidebar muestra el total global", async () => {
    vi.mocked(getRoadmaps).mockResolvedValue(ROADMAPS_LIST_RESULT);
    renderRoutes(["/dashboard/roadmaps/new"]);

    await screen.findByRole("heading", { level: 1, name: "Descubre tu ruta" });
    const nav = screen.getByRole("navigation", { name: "Navegación principal" });
    expect(
      await within(nav).findByRole("link", { name: "Mis Rutas, 5 rutas" }),
    ).toBeInTheDocument();
  });

  it("/dashboard/roadmaps/new sin sesión redirige a /auth/login", async () => {
    store.set(null);
    const router = renderRoutes(["/dashboard/roadmaps/new"]);
    await waitFor(() => expect(router.state.location.pathname).toBe("/auth/login"));
    expect(screen.queryByRole("heading", { name: "Descubre tu ruta" })).not.toBeInTheDocument();
  });

  it("desde el CTA del estado vacío, atrás vuelve a /dashboard/roadmaps", async () => {
    const router = renderRoutes(["/dashboard/roadmaps"]);
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Crear mi primera ruta" }));
    expect(
      await screen.findByRole("heading", { level: 1, name: "Descubre tu ruta" }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/dashboard/roadmaps/new");

    await router.navigate(-1);
    await waitFor(() => expect(router.state.location.pathname).toBe("/dashboard/roadmaps"));
    expect(
      await screen.findByRole("button", { name: "Crear mi primera ruta" }),
    ).toBeInTheDocument();
  });

  it("/dashboard/roadmaps/:roadmapId renderiza el detalle vacío dentro del layout con Mis Rutas activo", async () => {
    renderRoutes(["/dashboard/roadmaps/rm-frontend-react"]);

    const detail = await screen.findByRole("region", { name: "Detalle de la ruta" });
    const main = screen.getByRole("main");
    expect(main).toContainElement(detail);
    expect(detail).toBeEmptyDOMElement();
    expect(within(main).queryByRole("heading")).not.toBeInTheDocument();
    expect(within(main).queryByRole("table")).not.toBeInTheDocument();
    expect(sidebarRoutesLink()).toHaveAttribute("aria-current", "page");
    expect(tabBarRoutesLink()).toHaveAttribute("aria-current", "page");
  });
});
