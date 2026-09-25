import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { RoadmapRowMenu } from "@/components/roadmaps";
import { renderWithProviders } from "@/test/renderWithProviders";

function LocationProbe() {
  const location = useLocation();
  return <p data-testid="location">{location.pathname + location.search}</p>;
}

function renderMenu(onDelete = vi.fn()) {
  return renderWithProviders(
    <>
      <RoadmapRowMenu roadmapName="Frontend moderno con React" onDelete={onDelete} />
      <LocationProbe />
    </>,
    { route: "/dashboard/roadmaps?status=in_progress" },
  );
}

describe("RoadmapRowMenu", () => {
  it("abre un menú con exactamente 'Eliminar ruta'", async () => {
    const user = userEvent.setup();
    renderMenu();

    const trigger = screen.getByRole("button", {
      name: "Más acciones para Frontend moderno con React",
    });
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    await user.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const items = screen.getAllByRole("menuitem");
    expect(items).toHaveLength(1);
    expect(items[0]).toHaveTextContent("Eliminar ruta");
    expect(items[0]).toHaveClass("text-danger");
  });

  it("'Eliminar ruta' cierra el menú y llama a onDelete una vez, sin navegar", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    renderMenu(onDelete);

    const trigger = screen.getByRole("button", {
      name: "Más acciones para Frontend moderno con React",
    });
    await user.click(trigger);
    await user.click(screen.getByRole("menuitem", { name: "Eliminar ruta" }));

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/dashboard/roadmaps?status=in_progress",
    );
  });

  it("Esc cierra el menú sin llamar a onDelete y devuelve el foco al kebab", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    renderMenu(onDelete);

    const trigger = screen.getByRole("button", {
      name: "Más acciones para Frontend moderno con React",
    });
    await user.click(trigger);
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it("Enter abre el menú y enfoca 'Eliminar ruta'", async () => {
    const user = userEvent.setup();
    renderMenu();

    screen.getByRole("button", { name: "Más acciones para Frontend moderno con React" }).focus();
    await user.keyboard("{Enter}");

    expect(screen.getByRole("menuitem", { name: "Eliminar ruta" })).toHaveFocus();
  });
});
