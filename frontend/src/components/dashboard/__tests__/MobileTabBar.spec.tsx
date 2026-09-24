import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { MobileTabBar } from "@/components/dashboard";
import { renderWithProviders } from "@/test/renderWithProviders";

function LocationProbe() {
  return <span data-testid="location">{useLocation().pathname}</span>;
}

function renderTabBar(route: string) {
  return renderWithProviders(
    <>
      <MobileTabBar />
      <Routes>
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </>,
    { route },
  );
}

describe("MobileTabBar", () => {
  it("es la navegación inferior, solo visible en móvil, con safe-area inferior y sin position fixed", () => {
    renderTabBar("/dashboard/roadmaps");
    const nav = screen.getByRole("navigation", { name: "Navegación inferior" });
    expect(nav).toHaveClass(
      "md:hidden",
      "shrink-0",
      "pb-[max(0.5rem,env(safe-area-inset-bottom))]",
    );
    expect(nav).not.toHaveClass("fixed");
  });

  it.each([
    "/dashboard/roadmaps",
    "/dashboard/roadmaps/new",
    "/dashboard/roadmaps/rm-frontend-react",
  ])("Mis Rutas está activo en %s", (route) => {
    renderTabBar(route);
    const nav = screen.getByRole("navigation", { name: "Navegación inferior" });
    const link = within(nav).getByRole("link", { name: "Mis Rutas" });
    expect(link).toHaveAttribute("href", "/dashboard/roadmaps");
    expect(link).toHaveAttribute("aria-current", "page");
    expect(link).toHaveClass("bg-bg-nav-active");
  });

  it("Mis Rutas no está activo fuera de /dashboard/roadmaps", () => {
    renderTabBar("/dashboard/otra");
    const link = screen.getByRole("link", { name: "Mis Rutas" });
    expect(link).not.toHaveAttribute("aria-current");
    expect(link).not.toHaveClass("bg-bg-nav-active");
  });

  it("Mi Perfil está deshabilitado y no navega", async () => {
    renderTabBar("/dashboard/roadmaps");
    const profile = screen.getByRole("button", { name: "Mi Perfil" });
    expect(profile).toBeDisabled();
    expect(profile).toHaveAttribute("aria-disabled", "true");
    await userEvent.setup().click(profile);
    expect(screen.getByTestId("location")).toHaveTextContent("/dashboard/roadmaps");
  });

  it("clic en Mis Rutas navega a /dashboard/roadmaps", async () => {
    renderTabBar("/dashboard/roadmaps/new");
    await userEvent.setup().click(screen.getByRole("link", { name: "Mis Rutas" }));
    expect(screen.getByTestId("location")).toHaveTextContent(/^\/dashboard\/roadmaps$/);
  });

  it("oculta los iconos a las tecnologías de asistencia", () => {
    renderTabBar("/dashboard/roadmaps");
    const svgs = screen.getByRole("navigation").querySelectorAll("svg");
    expect(svgs).toHaveLength(2);
    for (const svg of svgs) expect(svg).toHaveAttribute("aria-hidden", "true");
  });
});
