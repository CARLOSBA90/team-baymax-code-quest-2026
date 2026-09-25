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

function renderSidebar(roadmapsCount?: number) {
  return renderWithProviders(
    <>
      <DashboardSidebar roadmapsCount={roadmapsCount} />
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

  it("respeta el safe-area izquierdo e inferior con viewport-fit=cover", () => {
    renderSidebar();
    expect(screen.getByRole("complementary")).toHaveClass(
      "pl-[max(1rem,env(safe-area-inset-left))]",
      "pr-4",
      "pb-[max(1.25rem,env(safe-area-inset-bottom))]",
    );
  });

  it("se oculta en móvil y se muestra como flex desde md", () => {
    renderSidebar();
    expect(screen.getByRole("complementary")).toHaveClass(
      "hidden",
      "md:flex",
      "w-[calc(16rem+env(safe-area-inset-left))]",
      "shrink-0",
    );
  });

  it("muestra la pill con roadmapsCount en Mis Rutas", () => {
    renderSidebar(5);
    const link = screen.getByRole("link", { name: "Mis Rutas, 5 rutas" });
    expect(within(link).getByText("5")).toHaveAttribute("aria-hidden", "true");
  });

  it("muestra la pill aunque el total sea 0", () => {
    renderSidebar(0);
    const link = screen.getByRole("link", { name: "Mis Rutas, 0 rutas" });
    expect(within(link).getByText("0")).toBeInTheDocument();
  });

  it("con una sola ruta el nombre accesible va en singular", () => {
    renderSidebar(1);
    expect(screen.getByRole("link", { name: "Mis Rutas, 1 ruta" })).toBeInTheDocument();
  });

  it("sin roadmapsCount no muestra pill", () => {
    renderSidebar();
    expect(screen.getByRole("link", { name: "Mis Rutas" })).toHaveTextContent(/^Mis Rutas$/);
  });
});
