import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { SidebarNavItem } from "@/components/dashboard";
import { renderWithProviders } from "@/test/renderWithProviders";

const icon = <svg aria-hidden="true" data-testid="icon" />;

describe("SidebarNavItem (enlace)", () => {
  it("renderiza un enlace con el href correcto", () => {
    renderWithProviders(
      <SidebarNavItem to="/dashboard/roadmaps" icon={icon}>
        Mis Rutas
      </SidebarNavItem>,
    );
    expect(screen.getByRole("link", { name: "Mis Rutas" })).toHaveAttribute(
      "href",
      "/dashboard/roadmaps",
    );
  });

  it.each(["/dashboard/roadmaps", "/dashboard/roadmaps/abc"])(
    "marca aria-current=page en %s",
    (route) => {
      renderWithProviders(
        <SidebarNavItem to="/dashboard/roadmaps" icon={icon}>
          Mis Rutas
        </SidebarNavItem>,
        { route },
      );
      expect(screen.getByRole("link", { name: "Mis Rutas" })).toHaveAttribute(
        "aria-current",
        "page",
      );
    },
  );

  it("no marca aria-current en otra ruta", () => {
    renderWithProviders(
      <SidebarNavItem to="/dashboard/roadmaps" icon={icon}>
        Mis Rutas
      </SidebarNavItem>,
      { route: "/dashboard/profile" },
    );
    expect(screen.getByRole("link", { name: "Mis Rutas" })).not.toHaveAttribute("aria-current");
  });

  it("no muestra pill sin count", () => {
    renderWithProviders(
      <SidebarNavItem to="/dashboard/roadmaps" icon={icon}>
        Mis Rutas
      </SidebarNavItem>,
    );
    expect(screen.getByRole("link")).toHaveTextContent(/^Mis Rutas$/);
  });

  it.each([3, 0])("muestra la pill con count=%i", (count) => {
    renderWithProviders(
      <SidebarNavItem to="/dashboard/roadmaps" icon={icon} count={count}>
        Mis Rutas
      </SidebarNavItem>,
    );
    expect(screen.getByText(String(count))).toHaveAttribute("aria-hidden", "true");
    // Sin countLabel el texto accesible es el número, separado por coma (no "Mis Rutas3").
    expect(screen.getByRole("link")).toHaveAccessibleName(`Mis Rutas, ${count}`);
  });

  it("usa countLabel como texto accesible de la pill", () => {
    renderWithProviders(
      <SidebarNavItem to="/dashboard/roadmaps" icon={icon} count={5} countLabel="5 rutas">
        Mis Rutas
      </SidebarNavItem>,
    );
    expect(screen.getByRole("link")).toHaveAccessibleName("Mis Rutas, 5 rutas");
    expect(screen.getByText("5")).toHaveAttribute("aria-hidden", "true");
  });
});

describe("SidebarNavItem (deshabilitado)", () => {
  it("es un botón deshabilitado, sin href ni rol de enlace", () => {
    renderWithProviders(
      <SidebarNavItem disabled icon={icon}>
        Mi Perfil
      </SidebarNavItem>,
    );
    const button = screen.getByRole("button", { name: "Mi Perfil" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).not.toHaveAttribute("href");
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("el clic no navega, al ser un botón deshabilitado sin to", async () => {
    renderWithProviders(
      <SidebarNavItem disabled icon={icon}>
        Mi Perfil
      </SidebarNavItem>,
      { route: "/dashboard/roadmaps" },
    );
    await userEvent.setup().click(screen.getByRole("button", { name: "Mi Perfil" }));
    expect(screen.getByRole("button", { name: "Mi Perfil" })).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
