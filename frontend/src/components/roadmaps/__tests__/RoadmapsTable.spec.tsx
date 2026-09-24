import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { RoadmapsTable } from "@/components/roadmaps";
import { ROADMAPS_LIST_RESULT } from "@/test/fixtures/roadmaps";
import { renderWithProviders } from "@/test/renderWithProviders";

function renderTable() {
  return renderWithProviders(<RoadmapsTable roadmaps={ROADMAPS_LIST_RESULT.items} />);
}

describe("RoadmapsTable", () => {
  it("es una tabla nativa con caption y cabeceras de columna, sin 'Última actividad'", () => {
    renderTable();

    const table = screen.getByRole("table", { name: "Tus rutas de aprendizaje" });
    const headers = within(table).getAllByRole("columnheader");
    expect(headers.map((header) => header.textContent)).toEqual([
      "Ruta",
      "Estado",
      "Progreso",
      "Acciones",
      "Más acciones",
    ]);
    expect(within(table).queryByText(/última actividad/i)).not.toBeInTheDocument();
  });

  it("solo es visible desde lg y no recorta los menús", () => {
    renderTable();

    const table = screen.getByRole("table");
    expect(table).toHaveClass("hidden", "lg:table");
    expect(table).not.toHaveClass("overflow-hidden");
  });

  it("renderiza una fila por ruta en orden", () => {
    renderTable();

    const rows = within(screen.getByRole("table")).getAllByRole("row").slice(1);
    expect(rows).toHaveLength(5);
    expect(rows[0]).toHaveTextContent("Frontend moderno con React");
    expect(rows[4]).toHaveTextContent("Git, Docker y despliegue");
  });

  it("muestra la fila completa de Frontend moderno con React", () => {
    renderTable();

    const row = within(screen.getByRole("table"))
      .getAllByRole("row")
      .find((candidate) => candidate.textContent?.includes("Frontend moderno con React"));
    if (!row) throw new Error("Fila FE no encontrada");
    const cells = within(row);

    expect(cells.getByText("FE")).toBeInTheDocument();
    expect(cells.getByText("Frontend moderno con React", { selector: "p" })).toHaveAttribute(
      "title",
      "Frontend moderno con React",
    );
    expect(cells.getByText("Frontend moderno con React", { selector: "p" })).toHaveClass(
      "truncate",
    );
    expect(cells.getByText("7 cursos · Intermedio")).toBeInTheDocument();
    expect(cells.getByText("Empezada")).toBeInTheDocument();
    expect(cells.getByText("42%")).toBeInTheDocument();
    expect(
      cells.getByRole("progressbar", { name: "Progreso de Frontend moderno con React" }),
    ).toHaveAttribute("aria-valuenow", "42");
    expect(
      cells.getByRole("link", { name: "Continuar Frontend moderno con React" }),
    ).toHaveAttribute("href", "/dashboard/roadmaps/rm-frontend-react");
    expect(
      cells.getByRole("button", { name: "Más acciones para Frontend moderno con React" }),
    ).toBeInTheDocument();
  });

  it("da nombres distintos a las acciones de cada fila", () => {
    renderTable();

    const table = within(screen.getByRole("table"));
    expect(
      table.getByRole("link", { name: "Continuar Apps móviles con Flutter" }),
    ).toBeInTheDocument();
    expect(
      table.getByRole("link", { name: "Reanudar Backend con Node y NestJS" }),
    ).toBeInTheDocument();
    const kebabs = table.getAllByRole("button", { name: /^Más acciones para / });
    expect(new Set(kebabs.map((kebab) => kebab.getAttribute("aria-label"))).size).toBe(5);
  });

  it("abrir un kebab cierra el de otra fila", async () => {
    const user = userEvent.setup();
    renderTable();

    const table = within(screen.getByRole("table"));
    const feKebab = table.getByRole("button", {
      name: "Más acciones para Frontend moderno con React",
    });
    const beKebab = table.getByRole("button", {
      name: "Más acciones para Backend con Node y NestJS",
    });

    await user.click(feKebab);
    await user.click(beKebab);

    expect(feKebab).toHaveAttribute("aria-expanded", "false");
    expect(beKebab).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("menu")).toHaveLength(1);
  });
});
