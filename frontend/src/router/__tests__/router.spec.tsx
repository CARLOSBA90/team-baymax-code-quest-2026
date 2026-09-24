import { screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getRoadmaps } from "@/api/services";
import { RouteErrorBoundary } from "@/router/RouteErrorBoundary";
import { routes } from "@/router/router";
import { useGuardSession } from "@/router/useGuardSession";
import { EMPTY_ROADMAPS_RESULT } from "@/test/fixtures/roadmaps";
import { preloadLazyRoutes, renderRoutes } from "@/test/renderRoutes";

vi.mock("@/router/useGuardSession", () => ({ useGuardSession: vi.fn() }));
vi.mock("@/api/services", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/api/services")>()),
  getRoadmaps: vi.fn(),
}));

type GuardState = ReturnType<typeof useGuardSession>;

const SESSION = {
  user: { name: "Ada Lovelace", email: "ada@example.com" },
  session: { id: "s1" },
} as unknown as GuardState["session"];

function mockSession(session: GuardState["session"]) {
  vi.mocked(useGuardSession).mockReturnValue({
    session,
    error: null,
    refetch: vi.fn(),
    isInitialLoading: false,
  } as GuardState);
}

describe("router: rutas perezosas", () => {
  beforeEach(() => {
    vi.mocked(getRoadmaps).mockResolvedValue(EMPTY_ROADMAPS_RESULT);
    mockSession(null);
  });

  it("en la carga inicial muestra el fallback accesible y después la página", async () => {
    renderRoutes(["/auth/login"]);

    expect(screen.getByRole("status")).toHaveTextContent("Cargando…");
    expect(screen.queryByRole("heading", { name: "Iniciar sesión" })).not.toBeInTheDocument();

    expect(await screen.findByRole("heading", { name: "Iniciar sesión" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Tu ruta empieza aquí" })).toBeVisible();
    expect(screen.queryByText("Cargando…")).not.toBeInTheDocument();
  });

  it("el fallback inicial del dashboard no pinta el shell a medias", async () => {
    mockSession(SESSION);
    renderRoutes(["/dashboard/roadmaps"]);

    expect(screen.getByRole("status")).toHaveTextContent("Cargando…");
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
    expect(screen.queryByRole("main")).not.toBeInTheDocument();

    expect(await screen.findByRole("heading", { level: 1, name: "Mis Rutas" })).toBeInTheDocument();
    expect(screen.getByRole("complementary")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
  });

  it("/auth/register carga la página de registro dentro del layout de auth", async () => {
    renderRoutes(["/auth/register"]);

    expect(await screen.findByRole("heading", { name: "Crea tu cuenta" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Tu ruta empieza aquí" })).toBeVisible();
  });

  it("al navegar mantiene la página actual hasta que carga la siguiente, sin fallback", async () => {
    await preloadLazyRoutes();
    const { router } = renderRoutes(["/auth/login"]);
    await screen.findByRole("heading", { name: "Iniciar sesión" });

    const navigation = router.navigate("/auth/register");

    expect(router.state.navigation.state).toBe("loading");
    expect(screen.getByRole("heading", { name: "Iniciar sesión" })).toBeInTheDocument();
    expect(screen.queryByText("Cargando…")).not.toBeInTheDocument();

    await navigation;
    expect(await screen.findByRole("heading", { name: "Crea tu cuenta" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/auth/register");
  });

  it("la ruta raíz captura los errores (p. ej. un chunk perdido) con RouteErrorBoundary", () => {
    const [root] = routes;
    expect((root.errorElement as ReactElement).type).toBe(RouteErrorBoundary);
  });
});
