import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { RoadmapCard, RoadmapCardList } from "@/components/roadmaps";
import { buildRoadmapSummary, ROADMAPS_LIST_RESULT } from "@/test/fixtures/roadmaps";
import { renderWithProviders } from "@/test/renderWithProviders";

function LocationProbe() {
  return <p data-testid="location">{useLocation().pathname}</p>;
}

function renderList() {
  return renderWithProviders(
    <>
      <Routes>
        <Route
          path="/dashboard/roadmaps"
          element={<RoadmapCardList roadmaps={ROADMAPS_LIST_RESULT.items} />}
        />
        <Route path="/dashboard/roadmaps/:roadmapId" element={<p>Detalle</p>} />
      </Routes>
      <LocationProbe />
    </>,
    { route: "/dashboard/roadmaps" },
  );
}

function getCard(name: string) {
  const list = screen.getByRole("list", { name: "Tus rutas de aprendizaje" });
  const item = within(list)
    .getAllByRole("listitem")
    .find((candidate) => candidate.textContent?.includes(name));
  if (!item) throw new Error(`Card ${name} no encontrada`);
  return item;
}

describe("RoadmapCardList", () => {
  it("es una lista de cards visible solo por debajo de lg", () => {
    renderList();

    const list = screen.getByRole("list", { name: "Tus rutas de aprendizaje" });
    expect(list).toHaveClass("lg:hidden");
    expect(list).not.toHaveClass("overflow-hidden");
    expect(within(list).getAllByRole("listitem")).toHaveLength(5);
  });

  it("la card muestra 'N cursos · Nivel' en vez de la última actividad", () => {
    renderList();

    const card = within(getCard("Backend con Node y NestJS"));
    expect(card.getByText("BE")).toBeInTheDocument();
    expect(card.getByText("6 cursos · Avanzado")).toBeInTheDocument();
    expect(card.getByText("En pausa")).toBeInTheDocument();
    expect(card.getByText("18%")).toBeInTheDocument();
    expect(card.queryByText(/hace/i)).not.toBeInTheDocument();
  });

  it("el enlace del título lleva al detalle de la ruta", async () => {
    const user = userEvent.setup();
    renderList();

    const link = within(getCard("Fundamentos de JavaScript y TypeScript")).getByRole("link", {
      name: "Fundamentos de JavaScript y TypeScript",
    });
    expect(link).toHaveAttribute("href", "/dashboard/roadmaps/rm-js-ts");
    await user.click(link);

    expect(screen.getByTestId("location")).toHaveTextContent("/dashboard/roadmaps/rm-js-ts");
  });

  it("el kebab abre su menú sin navegar", async () => {
    const user = userEvent.setup();
    renderList();

    const kebab = within(getCard("Frontend moderno con React")).getByRole("button", {
      name: "Más acciones para Frontend moderno con React",
    });
    await user.click(kebab);

    expect(kebab).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menuitem", { name: "Eliminar Roadmap" })).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent(/^\/dashboard\/roadmaps$/);
  });
});

describe("RoadmapCard", () => {
  it("usa el patrón stretched link sin interactivos anidados", () => {
    renderWithProviders(<RoadmapCard roadmap={buildRoadmapSummary({ name: "Ruta X" })} />);

    const link = screen.getByRole("link", { name: "Ruta X" });
    expect(link.closest("h3")).not.toBeNull();
    expect(link).toHaveClass("after:absolute", "after:inset-0");
    expect(link.querySelector("button")).toBeNull();
    const article = link.closest("article");
    expect(article).toHaveClass("relative");
    expect(article).not.toHaveClass("overflow-hidden");

    const kebab = screen.getByRole("button", { name: "Más acciones para Ruta X" });
    expect(link.contains(kebab)).toBe(false);
    expect(kebab.closest(".z-10")).not.toBeNull();
  });

  it("omite el nivel si es null", () => {
    renderWithProviders(
      <RoadmapCard roadmap={buildRoadmapSummary({ totalCourses: 3, level: null })} />,
    );

    expect(screen.getByText("3 cursos")).toBeInTheDocument();
  });
});
