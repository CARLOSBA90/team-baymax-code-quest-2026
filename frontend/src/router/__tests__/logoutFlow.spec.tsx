import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useSyncExternalStore } from "react";
import type { createMemoryRouter } from "react-router-dom";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { roadmapsKeys } from "@/api/queries/roadmaps";
import { getRoadmaps, signOut } from "@/api/services";
import { AuthError } from "@/lib";
import { ROADMAPS_LIST_RESULT } from "@/test/fixtures/roadmaps";
import { preloadLazyRoutes, renderRoutes } from "@/test/renderRoutes";

// Flujo de logout de punta a punta a nivel de rutas: `useLogout`, `useGuardSession`,
// `ProtectedRoute`/`GuestRoute` y las páginas son reales. Solo se sustituyen la sesión de
// better-auth (un store externo, como su atom) y la capa de servicios.
const session = vi.hoisted(() => {
  const listeners = new Set<() => void>();
  let current: unknown = null;
  return {
    get: () => current,
    set: (next: unknown) => {
      current = next;
      for (const listener of listeners) listener();
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
});

vi.mock("@/api/queries/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/api/queries/auth")>()),
  useSession: () => ({
    data: useSyncExternalStore(session.subscribe, session.get),
    isPending: false,
    error: null,
    refetch: vi.fn(),
  }),
}));
vi.mock("@/api/services", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/api/services")>()),
  deleteRoadmap: vi.fn(),
  getAssessmentQuestions: vi.fn(),
  getRoadmaps: vi.fn(),
  signOut: vi.fn(),
  submitAssessment: vi.fn(),
}));

const SESSION = {
  user: { name: "Ada Lovelace", email: "ada@example.com" },
  session: { id: "s1" },
};
const GENERIC_ERROR = "Ocurrió un error inesperado. Inténtalo de nuevo.";
const NETWORK_ERROR =
  "No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.";

let router: ReturnType<typeof createMemoryRouter>;

function renderApp(route = "/dashboard/roadmaps") {
  const rendered = renderRoutes([route]);
  router = rendered.router;
  return rendered;
}

function currentPath() {
  return router.state.location.pathname;
}

/** better-auth borra la sesión al completar `signOut`; el mock lo reproduce. */
function signOutSucceeds() {
  vi.mocked(signOut).mockImplementation(() => {
    session.set(null);
    return Promise.resolve();
  });
}

async function waitForDashboard() {
  await screen.findByRole("heading", { level: 1, name: "Mis Rutas" });
  expect(currentPath()).toBe("/dashboard/roadmaps");
}

function sidebar() {
  return screen.getByRole("complementary");
}

async function expectLoginPage() {
  expect(await screen.findByRole("heading", { name: "Iniciar sesión" })).toBeInTheDocument();
  expect(currentPath()).toBe("/auth/login");
  expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
  expect(screen.queryByRole("main")).not.toBeInTheDocument();
}

describe("flujo de logout", () => {
  beforeAll(() => preloadLazyRoutes());

  beforeEach(() => {
    session.set(SESSION);
    vi.mocked(getRoadmaps).mockResolvedValue(ROADMAPS_LIST_RESULT);
    signOutSucceeds();
  });

  it("'Cerrar sesión' del sidebar cierra la sesión y lleva a /auth/login", async () => {
    renderApp();
    await waitForDashboard();

    await userEvent.setup().click(within(sidebar()).getByRole("button", { name: "Cerrar sesión" }));

    await expectLoginPage();
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it("'Cerrar sesión' del menú del avatar cierra la sesión y lleva a /auth/login", async () => {
    renderApp();
    await waitForDashboard();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Menú de usuario de Ada Lovelace" }));
    await user.click(screen.getByRole("menuitem", { name: "Cerrar sesión" }));

    await expectLoginPage();
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it("vacía la caché de React Query y no vuelve a pedir las rutas sin sesión", async () => {
    const { queryClient } = renderApp();
    await waitForDashboard();
    await waitFor(() =>
      expect(queryClient.getQueryData(roadmapsKeys.list())).toEqual(ROADMAPS_LIST_RESULT),
    );

    await userEvent.setup().click(within(sidebar()).getByRole("button", { name: "Cerrar sesión" }));

    await expectLoginPage();
    expect(queryClient.getQueryData(roadmapsKeys.list())).toBeUndefined();
    expect(getRoadmaps).toHaveBeenCalledTimes(1);
  });

  it("si signOut falla se queda en el dashboard, muestra el error y permite reintentar", async () => {
    vi.mocked(signOut).mockRejectedValueOnce(new AuthError({ status: 500 }));
    const { queryClient } = renderApp();
    await waitForDashboard();
    const user = userEvent.setup();
    const button = within(sidebar()).getByRole("button", { name: "Cerrar sesión" });

    await user.click(button);

    expect(await within(sidebar()).findByRole("alert")).toHaveTextContent(GENERIC_ERROR);
    expect(currentPath()).toBe("/dashboard/roadmaps");
    expect(session.get()).toBe(SESSION);
    expect(queryClient.getQueryData(roadmapsKeys.list())).toEqual(ROADMAPS_LIST_RESULT);
    expect(button).toBeEnabled();

    await user.click(button);

    await expectLoginPage();
    expect(signOut).toHaveBeenCalledTimes(2);
  });

  it("un fallo de red en el menú del avatar muestra el aviso de conexión sin salir", async () => {
    vi.mocked(signOut).mockRejectedValueOnce(new AuthError({ status: 0 }));
    renderApp();
    await waitForDashboard();
    const user = userEvent.setup();
    const avatarButton = screen.getByRole("button", { name: "Menú de usuario de Ada Lovelace" });

    await user.click(avatarButton);
    await user.click(screen.getByRole("menuitem", { name: "Cerrar sesión" }));

    const topBar = avatarButton.closest("header");
    expect(topBar).not.toBeNull();
    expect(await within(topBar as HTMLElement).findByRole("alert")).toHaveTextContent(
      NETWORK_ERROR,
    );
    expect(currentPath()).toBe("/dashboard/roadmaps");
    expect(within(sidebar()).queryByRole("alert")).not.toBeInTheDocument();
  });
});
