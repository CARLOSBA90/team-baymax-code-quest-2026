import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RoadmapTimeline } from "@/components/roadmap-detail";
import { buildRoadmapItem, ROADMAP_DETAIL } from "@/test/fixtures/roadmap-detail";
import { renderWithProviders } from "@/test/renderWithProviders";

const NEXT_ID = "item-2";

describe("RoadmapTimeline", () => {
  it("sección nombrada por el h2 «Pasos de la ruta» con contador visible y accesible", () => {
    renderWithProviders(
      <RoadmapTimeline
        items={ROADMAP_DETAIL.items}
        nextStepId={NEXT_ID}
        completed={1}
        isPaused={false}
      />,
    );

    const heading = screen.getByRole("heading", { level: 2, name: "Pasos de la ruta" });
    expect(screen.getByRole("region", { name: "Pasos de la ruta" })).toContainElement(heading);
    expect(screen.getByText("1 de 4")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("1 de 4 pasos completados")).toHaveClass("sr-only");
  });

  it("lista los pasos en orden con su h3 y el estado de cada uno", () => {
    renderWithProviders(
      <RoadmapTimeline
        items={ROADMAP_DETAIL.items}
        nextStepId={NEXT_ID}
        completed={1}
        isPaused={false}
      />,
    );

    const list = screen.getByRole("list", { name: "Pasos de la ruta" });
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(4);
    expect(
      items.map((item) => within(item).getByRole("heading", { level: 3 }).textContent),
    ).toEqual(ROADMAP_DETAIL.items.map((item, i) => `Paso ${i + 1} de 4: ${i + 1} · ${item.name}`));
    expect(items.map((item) => item.getAttribute("data-state"))).toEqual([
      "completed",
      "next",
      "pending",
      "pending",
    ]);
  });

  it("solo el último ítem no tiene riel", () => {
    renderWithProviders(
      <RoadmapTimeline
        items={ROADMAP_DETAIL.items}
        nextStepId={NEXT_ID}
        completed={1}
        isPaused={false}
      />,
    );

    const items = within(screen.getByRole("list", { name: "Pasos de la ruta" })).getAllByRole(
      "listitem",
    );
    expect(items.map((item) => within(item).queryByTestId("timeline-rail") !== null)).toEqual([
      true,
      true,
      true,
      false,
    ]);
  });

  it("sin ítems pinta la lista vacía sin fallar", () => {
    renderWithProviders(
      <RoadmapTimeline items={[]} nextStepId={null} completed={0} isPaused={false} />,
    );

    expect(screen.getByRole("list", { name: "Pasos de la ruta" })).toBeEmptyDOMElement();
    expect(screen.getByText("0 de 0 pasos completados")).toBeInTheDocument();
  });

  it("con 5 ítems con url, cada enlace «Ir al curso» tiene un nombre distinto", () => {
    const items = Array.from({ length: 5 }, (_, i) =>
      buildRoadmapItem({
        roadmapItemId: `item-${i + 1}`,
        name: `Curso ${i + 1}`,
        url: `https://example.com/${i + 1}`,
      }),
    );
    renderWithProviders(
      <RoadmapTimeline items={items} nextStepId="item-1" completed={0} isPaused={false} />,
    );

    const names = screen.getAllByRole("link").map((link) => link.textContent);
    expect(screen.getAllByRole("link")).toHaveLength(5);
    expect(new Set(names).size).toBe(5);
  });

  it("en pausa describe cada botón de completar con el párrafo del banner", () => {
    renderWithProviders(
      <RoadmapTimeline
        items={ROADMAP_DETAIL.items}
        nextStepId={NEXT_ID}
        completed={1}
        isPaused
        pausedDescriptionId="paused-desc"
      />,
    );

    const buttons = screen.getAllByRole("button", { name: /^Marcar como completado/ });
    expect(buttons.length).toBeGreaterThan(0);
    for (const button of buttons) {
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute("aria-describedby", "paused-desc");
    }
  });
});
