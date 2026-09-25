import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ItemMeta } from "@/components/roadmap-detail";
import { buildRoadmapItem, ROADMAP_DETAIL } from "@/test/fixtures/roadmap-detail";
import { renderWithProviders } from "@/test/renderWithProviders";

const NOW = new Date("2026-09-25T12:00:00Z");

describe("ItemMeta", () => {
  it("pinta la meta del ítem en un párrafo", () => {
    renderWithProviders(<ItemMeta item={ROADMAP_DETAIL.items[0]} now={NOW} />);

    const meta = screen.getByText("Básico · 2 h · completado el 15 sept");
    expect(meta.tagName).toBe("P");
  });

  it("antepone el paso si se pasa", () => {
    renderWithProviders(
      <ItemMeta item={ROADMAP_DETAIL.items[1]} step={{ number: 2, total: 4 }} now={NOW} />,
    );

    expect(screen.getByText("Paso 2 de 4 · Intermedio · 3 h")).toBeInTheDocument();
  });

  it("MEDIA sin nivel ni duración → «Recurso»", () => {
    renderWithProviders(<ItemMeta item={ROADMAP_DETAIL.items[2]} now={NOW} />);

    expect(screen.getByText("Recurso")).toBeInTheDocument();
  });

  it("sin partes no pinta nada", () => {
    const { container } = renderWithProviders(
      <ItemMeta item={buildRoadmapItem({ level: null, estimatedMinutes: null })} now={NOW} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
