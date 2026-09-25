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

  it("coloca el contenido en la columna de detalle de 920px", () => {
    renderWithProviders(<RoadmapDetailView roadmap={ROADMAP_DETAIL} />);

    const heading = screen.getByRole("heading", { level: 1, name: ROADMAP_DETAIL.name });
    expect(heading.closest(".max-w-detail")).toHaveClass("flex", "w-full", "flex-col", "gap-5.5");
  });

  it("muestra la barra global nombrada por el h1, redondeada, con resumen de pasos y horas", () => {
    renderWithProviders(<RoadmapDetailView roadmap={ROADMAP_DETAIL} />);

    const bar = screen.getByRole("progressbar", { name: ROADMAP_DETAIL.name });
    expect(bar).toHaveAttribute("aria-valuenow", "33");
    expect(bar).toHaveAttribute("aria-valuetext", "33 por ciento. 1 de 4 pasos completados.");
    // 1 completado de 4 ítems (COURSE, COURSE, MEDIA, CHALLENGE); 390 min en total, 270 restantes.
    expect(screen.getByText("1 de 4 pasos · 7 h en total · quedan ~5 h")).toBeInTheDocument();
    expect(screen.getByText("33%")).toHaveClass("text-accent-soft");
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

    expect(screen.getByRole("progressbar", { name: ROADMAP_DETAIL.name })).toHaveAttribute(
      "aria-valuenow",
      "100",
    );
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("usa el singular con un único paso", () => {
    renderWithProviders(
      <RoadmapDetailView roadmap={buildRoadmapDetail({ items: [buildRoadmapItem()] })} />,
    );

    // buildRoadmapItem: 60 min, sin completar.
    expect(screen.getByText("0 de 1 paso · 1 h en total · quedan ~1 h")).toBeInTheDocument();
  });

  it("sin pasos muestra «0 de 0 pasos» y ningún listitem", () => {
    renderWithProviders(<RoadmapDetailView roadmap={buildRoadmapDetail({ items: [] })} />);

    expect(screen.getByText("0 de 0 pasos")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: ROADMAP_DETAIL.name })).toHaveAttribute(
      "aria-valuetext",
      "33 por ciento. 0 de 0 pasos completados.",
    );
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });

  it("no tiene botones (vista mínima sin acciones)", () => {
    renderWithProviders(<RoadmapDetailView roadmap={ROADMAP_DETAIL} />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
