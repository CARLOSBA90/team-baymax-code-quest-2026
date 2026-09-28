import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { useLogout, useSession } from "@/api/queries/auth";
import { roadmapsKeys } from "@/api/queries/roadmaps";
import { deleteRoadmap, getRoadmap, getRoadmaps } from "@/api/services";
import { useGuardSession } from "@/router/useGuardSession";
import { buildNetworkError } from "@/test/fixtures/api-errors";
import { ROADMAP_DETAIL } from "@/test/fixtures/roadmap-detail";
import { buildRoadmapNotFoundError } from "@/test/fixtures/roadmap-pause";
import { ROADMAPS_LIST_RESULT } from "@/test/fixtures/roadmaps";
import { preloadLazyRoutes, renderRoutes } from "@/test/renderRoutes";

// Flujo completo con el router real (rutas `lazy`): borrar desde el detalle navega a Mis Rutas con
// `replace`, sin volver a pedir la ruta borrada ni pintar «No encontramos esta ruta».

vi.mock("@/router/useGuardSession", () => ({ useGuardSession: vi.fn() }));
vi.mock("@/api/queries/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/api/queries/auth")>()),
  useSession: vi.fn(),
  useLogout: vi.fn(),
}));
vi.mock("@/api/services", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/api/services")>()),
  deleteRoadmap: vi.fn(),
  getRoadmap: vi.fn(),
  getRoadmaps: vi.fn(),
  setRoadmapPaused: vi.fn(),
  trackItemCompletion: vi.fn(),
}));

const ID = ROADMAP_DETAIL.id;
const NAME = ROADMAP_DETAIL.name;
const DETAIL_PATH = `/dashboard/roadmaps/${ID}`;
const NOT_FOUND_TITLE = "No encontramos esta ruta";
const USER = { name: "Ada Lovelace", email: "ada@example.com" };

type GuardState = ReturnType<typeof useGuardSession>;

/** Registra si «No encontramos esta ruta» llega a aparecer en el DOM en algún momento. */
function watchNotFound() {
  let seen = false;
  const check = () => {
    if (document.body.textContent?.includes(NOT_FOUND_TITLE)) seen = true;
  };
  const observer = new MutationObserver(check);
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  return {
    wasSeen: () => {
      check();
      return seen;
    },
    stop: () => observer.disconnect(),
  };
}

async function deleteFromDetail(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole("button", { name: `Más acciones para ${NAME}` }));
  await user.click(screen.getByRole("menuitem", { name: "Eliminar ruta" }));
  const dialog = screen.getByRole("dialog", { name: `¿Eliminar ${NAME}?` });
  await user.click(within(dialog).getByRole("button", { name: "Eliminar ruta" }));
  return dialog;
}

function misRutasHeading() {
  return screen.findByRole("heading", { level: 1, name: "Mis Rutas" });
}

describe("eliminar una ruta desde el detalle (router real)", () => {
  let notFound: ReturnType<typeof watchNotFound>;

  beforeAll(() => preloadLazyRoutes());

  beforeEach(() => {
    vi.mocked(useGuardSession).mockReturnValue({
      session: { user: USER, session: { id: "s1" } },
      error: null,
      refetch: vi.fn(),
      isInitialLoading: false,
    } as unknown as GuardState);
    vi.mocked(useSession).mockReturnValue({
      data: { user: USER },
    } as unknown as ReturnType<typeof useSession>);
    vi.mocked(useLogout).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof useLogout>);
    vi.mocked(getRoadmaps).mockResolvedValue(ROADMAPS_LIST_RESULT);
    vi.mocked(getRoadmap).mockResolvedValue(ROADMAP_DETAIL);
    notFound = watchNotFound();
  });

  afterEach(() => {
    notFound.stop();
    document.documentElement.classList.remove("overflow-hidden");
  });

  it("200: replace a Mis Rutas con aviso, foco en el h1, state limpio y el detalle fuera de la caché", async () => {
    vi.mocked(deleteRoadmap).mockResolvedValue({ id: ID });
    const user = userEvent.setup();
    const { router, queryClient } = renderRoutes(["/dashboard/roadmaps", DETAIL_PATH]);
    expect(await screen.findByRole("heading", { level: 1, name: NAME })).toBeInTheDocument();

    await deleteFromDetail(user);

    const heading = await misRutasHeading();
    expect(router.state.location.pathname).toBe("/dashboard/roadmaps");
    expect(router.state.historyAction).toBe("REPLACE");
    expect(screen.getByText(`Ruta «${NAME}» eliminada`)).toHaveAttribute("role", "status");
    await waitFor(() => expect(heading).toHaveFocus());
    await waitFor(() => expect(router.state.location.state).toBeNull());
    expect(screen.getByText(`Ruta «${NAME}» eliminada`)).toBeInTheDocument();
    expect(vi.mocked(deleteRoadmap).mock.calls[0][0]).toBe(ID);
    expect(getRoadmap).toHaveBeenCalledTimes(1);
    expect(queryClient.getQueryState(roadmapsKeys.detail(ID))).toBeUndefined();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(notFound.wasSeen()).toBe(false);

    // El detalle borrado se reemplazó en el historial: atrás no vuelve a él.
    await router.navigate(-1);
    expect(router.state.location.pathname).toBe("/dashboard/roadmaps");
    await misRutasHeading();
    expect(getRoadmap).toHaveBeenCalledTimes(1);
    expect(notFound.wasSeen()).toBe(false);
  });

  it("404: mismo flujo con el aviso neutro de ruta inexistente", async () => {
    vi.mocked(deleteRoadmap).mockRejectedValue(buildRoadmapNotFoundError());
    const user = userEvent.setup();
    const { router, queryClient } = renderRoutes([DETAIL_PATH]);
    expect(await screen.findByRole("heading", { level: 1, name: NAME })).toBeInTheDocument();

    await deleteFromDetail(user);

    const heading = await misRutasHeading();
    expect(router.state.historyAction).toBe("REPLACE");
    expect(screen.getByText("Esa ruta ya no existe. Hemos actualizado tu lista.")).toHaveAttribute(
      "role",
      "status",
    );
    await waitFor(() => expect(heading).toHaveFocus());
    await waitFor(() => expect(router.state.location.state).toBeNull());
    expect(getRoadmap).toHaveBeenCalledTimes(1);
    expect(queryClient.getQueryState(roadmapsKeys.detail(ID))).toBeUndefined();
    expect(notFound.wasSeen()).toBe(false);
  });

  it("sin conexión: el error se queda en el diálogo y sigue en el detalle", async () => {
    vi.mocked(deleteRoadmap).mockRejectedValue(buildNetworkError());
    const user = userEvent.setup();
    const { router, queryClient } = renderRoutes([DETAIL_PATH]);
    expect(await screen.findByRole("heading", { level: 1, name: NAME })).toBeInTheDocument();

    const dialog = await deleteFromDetail(user);

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "No se pudo conectar con el servidor",
    );
    expect(router.state.location.pathname).toBe(DETAIL_PATH);
    expect(within(dialog).getByRole("button", { name: "Eliminar ruta" })).toBeEnabled();
    expect(queryClient.getQueryData(roadmapsKeys.detail(ID))).toBeDefined();
    expect(notFound.wasSeen()).toBe(false);
  });
});
