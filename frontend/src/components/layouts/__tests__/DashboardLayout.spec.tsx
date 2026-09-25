import { screen, within } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useLogout, useSession } from "@/api/queries/auth";
import { roadmapsKeys } from "@/api/queries/roadmaps";
import { getRoadmaps } from "@/api/services";
import { DashboardLayout } from "@/components/layouts";
import { ROADMAPS_LIST_RESULT } from "@/test/fixtures/roadmaps";
import { renderWithProviders } from "@/test/renderWithProviders";

vi.mock("@/api/queries/auth", () => ({ useSession: vi.fn(), useLogout: vi.fn() }));
vi.mock("@/api/services", () => ({ getRoadmaps: vi.fn() }));

function renderLayout() {
  return renderWithProviders(
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard/roadmaps" element={<p>child-content</p>} />
      </Route>
    </Routes>,
    { route: "/dashboard/roadmaps" },
  );
}

function sidebarRoutesLink() {
  const sidebarNav = screen.getByRole("navigation", { name: "Navegación principal" });
  return within(sidebarNav).getByRole("link", { name: /^Mis Rutas(, \d+ rutas?)?$/ });
}

describe("DashboardLayout", () => {
  beforeEach(() => {
    vi.mocked(getRoadmaps).mockResolvedValue(ROADMAPS_LIST_RESULT);
    vi.mocked(useSession).mockReturnValue({
      data: { user: { name: "Ada Lovelace", email: "ada@example.com" } },
    } as unknown as ReturnType<typeof useSession>);
    vi.mocked(useLogout).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof useLogout>);
  });

  it("renderiza el sidebar y un único main con el contenido del Outlet", () => {
    renderLayout();
    expect(screen.getByRole("complementary")).toBeInTheDocument();
    const mains = screen.getAllByRole("main");
    expect(mains).toHaveLength(1);
    expect(mains[0]).toHaveTextContent("child-content");
  });

  it("tiene dos landmarks de navegación: principal (sidebar) e inferior (tab bar)", () => {
    renderLayout();
    const navs = screen.getAllByRole("navigation");
    expect(navs).toHaveLength(2);
    expect(within(screen.getByRole("complementary")).getByRole("navigation")).toHaveAccessibleName(
      "Navegación principal",
    );
    expect(screen.getByRole("navigation", { name: "Navegación inferior" })).toBeInTheDocument();
  });

  it("renderiza la top bar móvil (banner) con el menú de usuario", () => {
    renderLayout();
    const banner = screen.getByRole("banner");
    expect(banner).toHaveClass("md:hidden");
    expect(
      within(banner).getByRole("button", { name: "Menú de usuario de Ada Lovelace" }),
    ).toBeInTheDocument();
  });

  it("ordena la columna: top bar, main y tab bar", () => {
    renderLayout();
    const column = screen.getByRole("main").parentElement as HTMLElement;
    const [top, main, tab] = Array.from(column.children);
    expect(top).toBe(screen.getByRole("banner"));
    expect(main).toBe(screen.getByRole("main"));
    expect(tab).toBe(screen.getByRole("navigation", { name: "Navegación inferior" }));
  });

  it("aplica las clases de layout y degradación", () => {
    renderLayout();
    expect(screen.getByRole("complementary")).toHaveClass(
      "hidden",
      "md:flex",
      "w-[calc(16rem+env(safe-area-inset-left))]",
      "shrink-0",
    );
    const main = screen.getByRole("main");
    expect(main).toHaveClass(
      "min-w-0",
      "flex-1",
      "overflow-auto",
      "px-5",
      "md:pl-12",
      "md:pr-[max(3rem,env(safe-area-inset-right))]",
      "md:pb-[max(2.5rem,env(safe-area-inset-bottom))]",
    );
    const column = main.parentElement as HTMLElement;
    expect(column).toHaveClass("flex", "min-w-0", "flex-1", "flex-col");
    expect(column).not.toHaveClass("overflow-hidden");
    expect(column.parentElement).toHaveClass("flex", "h-dvh", "overflow-hidden");
  });

  it("main es relative: contiene los descendientes absolutos (sr-only) y no estira el documento", () => {
    renderLayout();
    const main = screen.getByRole("main");
    expect(main).toHaveClass("relative", "overflow-auto");
    const shell = main.parentElement?.parentElement as HTMLElement;
    expect(shell).toHaveClass("h-dvh", "overflow-hidden");
  });

  it("la tab bar no es position:fixed", () => {
    renderLayout();
    expect(screen.getByRole("navigation", { name: "Navegación inferior" })).not.toHaveClass(
      "fixed",
    );
  });

  it("muestra la pill con el total de rutas en el sidebar tras cargar", async () => {
    renderLayout();
    expect(await within(sidebarRoutesLink()).findByText("5")).toBeInTheDocument();
    expect(sidebarRoutesLink()).toHaveAccessibleName("Mis Rutas, 5 rutas");
    expect(getRoadmaps).toHaveBeenCalledTimes(1);
  });

  it("no muestra pill mientras carga", () => {
    vi.mocked(getRoadmaps).mockReturnValue(new Promise(() => {}));
    renderLayout();
    expect(sidebarRoutesLink()).toHaveTextContent(/^Mis Rutas$/);
  });

  it("no muestra pill si la carga falla", async () => {
    vi.mocked(getRoadmaps).mockRejectedValue(new Error("boom"));
    const { queryClient } = renderLayout();
    await vi.waitFor(() =>
      expect(queryClient.getQueryState(roadmapsKeys.list())?.status).toBe("error"),
    );
    expect(sidebarRoutesLink()).toHaveTextContent(/^Mis Rutas$/);
  });

  it("no usa .nebula en el main", () => {
    renderLayout();
    const main = screen.getByRole("main");
    expect(main).not.toHaveClass("nebula");
    expect(main.querySelector(".nebula")).toBeNull();
  });
});
