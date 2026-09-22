import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useLogout, useSession } from "@/api/queries/auth";
import { DashboardSidebar } from "@/components/dashboard";
import { renderWithProviders } from "@/test/renderWithProviders";

vi.mock("@/api/queries/auth", () => ({ useSession: vi.fn(), useLogout: vi.fn() }));

function LocationProbe() {
  return <span data-testid="location">{useLocation().pathname}</span>;
}

function renderSidebar() {
  return renderWithProviders(
    <>
      <DashboardSidebar />
      <Routes>
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </>,
    { route: "/dashboard/roadmaps" },
  );
}

describe("DashboardSidebar", () => {
  beforeEach(() => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { name: "Ada Lovelace", email: "ada@example.com" } },
    } as unknown as ReturnType<typeof useSession>);
    vi.mocked(useLogout).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof useLogout>);
  });

  it("expone la navegación con nombre y el texto MENÚ", () => {
    renderSidebar();
    const nav = screen.getByRole("navigation", { name: "Navegación principal" });
    expect(within(nav).getByText("MENÚ")).toBeInTheDocument();
  });

  it("muestra Mis Rutas como enlace activo y Mi Perfil deshabilitado", () => {
    renderSidebar();
    const link = screen.getByRole("link", { name: "Mis Rutas" });
    expect(link).toHaveAttribute("href", "/dashboard/roadmaps");
    expect(link).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Mi Perfil" })).toBeDisabled();
  });

  it("incluye el enlace de marca a /dashboard/roadmaps", () => {
    renderSidebar();
    const brand = screen.getAllByRole("link").find((el) => el.textContent?.includes("devtalles"));
    expect(brand).toHaveAttribute("href", "/dashboard/roadmaps");
  });

  it("incluye la tarjeta de usuario al final", () => {
    renderSidebar();
    const aside = screen.getByRole("complementary");
    expect(within(aside).getByText("Ada Lovelace")).toBeInTheDocument();
    expect(within(aside).getByRole("button", { name: "Cerrar sesión" })).toBeInTheDocument();
    expect(aside.lastElementChild).toContainElement(screen.getByText("Ada Lovelace"));
  });

  it("ordena marca, navegación y tarjeta de usuario", () => {
    renderSidebar();
    const aside = screen.getByRole("complementary");
    const [brand, nav, card] = Array.from(aside.children);
    expect(brand.tagName).toBe("A");
    expect(nav).toBe(screen.getByRole("navigation"));
    expect(card).toContainElement(screen.getByRole("button", { name: "Cerrar sesión" }));
  });

  it("oculta a las tecnologías de asistencia todos los SVG de iconos", () => {
    renderSidebar();
    const svgs = screen.getByRole("complementary").querySelectorAll("svg");
    expect(svgs.length).toBeGreaterThan(0);
    for (const svg of svgs) expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("clic en Mi Perfil no cambia la ubicación", async () => {
    renderSidebar();
    await userEvent.setup().click(screen.getByRole("button", { name: "Mi Perfil" }));
    expect(screen.getByTestId("location")).toHaveTextContent("/dashboard/roadmaps");
  });

  it("usa .sidebar-surface y no .nebula", () => {
    renderSidebar();
    const aside = screen.getByRole("complementary");
    expect(aside).toHaveClass("sidebar-surface");
    expect(aside).not.toHaveClass("nebula");
    expect(aside.querySelector(".nebula")).toBeNull();
  });
});
