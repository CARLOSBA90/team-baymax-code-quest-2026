import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RoadmapDetailView } from "@/components/roadmap-detail";
import {
  buildRoadmapDetail,
  buildRoadmapItem,
  ROADMAP_DETAIL,
} from "@/test/fixtures/roadmap-detail";
import { renderWithProviders } from "@/test/renderWithProviders";

describe("RoadmapDetailView", () => {
  it("enlaza a Mis Rutas y muestra nombre, resumen y estado con las etiquetas actuales", () => {
    renderWithProviders(<RoadmapDetailView roadmap={ROADMAP_DETAIL} />);

    expect(screen.getByRole("link", { name: "Mis Rutas" })).toHaveAttribute(
      "href",
      "/dashboard/roadmaps",
    );
    expect(
      screen.getByRole("heading", { level: 1, name: ROADMAP_DETAIL.name }),
    ).toBeInTheDocument();
    expect(screen.getByText(ROADMAP_DETAIL.summary)).toBeInTheDocument();
    expect(screen.getByText("Empezada")).toBeInTheDocument();
    expect(screen.queryByText("En curso")).not.toBeInTheDocument();
  });

  it("muestra la barra de progreso redondeada y «X de N pasos» contando todos los tipos", () => {
    renderWithProviders(<RoadmapDetailView roadmap={ROADMAP_DETAIL} />);

    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "33");
    // 1 completado de 4 ítems (COURSE, COURSE, MEDIA, CHALLENGE).
    expect(screen.getByText("1 de 4 pasos")).toBeInTheDocument();
  });

  it("lista los pasos en orden dentro de «Pasos de la ruta»", () => {
    renderWithProviders(<RoadmapDetailView roadmap={ROADMAP_DETAIL} />);

    const list = screen.getByRole("list", { name: "Pasos de la ruta" });
    const items = within(list).getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual(
      ROADMAP_DETAIL.items.map((item) => item.name),
    );
  });

  it("acota el progreso por encima de 100", () => {
    renderWithProviders(<RoadmapDetailView roadmap={buildRoadmapDetail({ progress: 100.4 })} />);

    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  });

  it("usa el singular con un único paso", () => {
    renderWithProviders(
      <RoadmapDetailView roadmap={buildRoadmapDetail({ items: [buildRoadmapItem()] })} />,
    );

    expect(screen.getByText("0 de 1 paso")).toBeInTheDocument();
  });

  it("sin pasos muestra «0 de 0 pasos» y ningún listitem", () => {
    renderWithProviders(<RoadmapDetailView roadmap={buildRoadmapDetail({ items: [] })} />);

    expect(screen.getByText("0 de 0 pasos")).toBeInTheDocument();
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });

  it("no tiene botones (vista mínima sin acciones)", () => {
    renderWithProviders(<RoadmapDetailView roadmap={ROADMAP_DETAIL} />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
