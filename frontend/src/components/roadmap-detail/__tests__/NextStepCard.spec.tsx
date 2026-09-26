import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NextStepCard } from "@/components/roadmap-detail";
import { buildRoadmapItem, ROADMAP_DETAIL } from "@/test/fixtures/roadmap-detail";
import { renderWithProviders } from "@/test/renderWithProviders";

const NEXT_ITEM = ROADMAP_DETAIL.items[1];

describe("NextStepCard", () => {
  it("es la región «Continúa aquí» con el nombre del paso como h2 y su meta con posición", () => {
    renderWithProviders(<NextStepCard item={NEXT_ITEM} stepNumber={2} total={4} />);

    const region = screen.getByRole("region", { name: "Continúa aquí" });
    expect(
      within(region).getByRole("heading", { level: 2, name: "Introducción a React" }),
    ).toBeInTheDocument();
    expect(within(region).getByText("Paso 2 de 4 · Intermedio · 3 h")).toBeInTheDocument();
  });

  it("enlace primario de 48px en móvil (44px desde sm:) a la url en pestaña nueva", () => {
    renderWithProviders(<NextStepCard item={NEXT_ITEM} stepNumber={2} total={4} />);

    const link = screen.getByRole("link", {
      name: "Ir al curso Introducción a React (se abre en una pestaña nueva)",
    });
    expect(link).toHaveAttribute("href", NEXT_ITEM.url);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveClass("h-12", "sm:h-11");
  });

  it("sin url no pinta enlace", () => {
    renderWithProviders(
      <NextStepCard item={{ ...NEXT_ITEM, url: null }} stepNumber={2} total={4} />,
    );

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("completable → «Marcar como completado» deshabilitado de 48px en móvil (44px desde sm:)", () => {
    const item = buildRoadmapItem({ name: "Node.js", url: "https://example.com/node" });
    renderWithProviders(<NextStepCard item={item} stepNumber={1} total={3} />);

    const button = screen.getByRole("button", { name: "Marcar como completado Node.js" });
    expect(button).toBeDisabled();
    expect(button).toHaveClass("h-12", "sm:h-11");
  });

  it("tracking automático (VIDEO) → mensaje y sin botón", () => {
    renderWithProviders(<NextStepCard item={NEXT_ITEM} stepNumber={2} total={4} />);

    expect(
      screen.getByText("El avance de este curso se registra automáticamente."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("tracking por lecciones (LESSONS) → mensaje por lección y sin botón", () => {
    const item = buildRoadmapItem({
      name: "Curso por lecciones",
      tracking: { type: "LESSONS", enabled: true, disabledReason: null },
    });
    renderWithProviders(<NextStepCard item={item} stepNumber={1} total={3} />);

    expect(
      screen.getByText("El avance de este curso se registra por lección."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Marcar como completado/ }),
    ).not.toBeInTheDocument();
  });

  it("defensivo: ítem completado sin url → sin acciones, botón ni mensaje de tracking", () => {
    const item = buildRoadmapItem({
      name: "Curso terminado",
      progress: 100,
      tracking: { type: "LESSONS", enabled: true, disabledReason: null },
    });
    renderWithProviders(<NextStepCard item={item} stepNumber={1} total={3} />);

    const region = screen.getByRole("region", { name: "Continúa aquí" });
    expect(within(region).queryByRole("link")).not.toBeInTheDocument();
    expect(within(region).queryByRole("button")).not.toBeInTheDocument();
    expect(within(region).queryByText(/registra|registrar/)).not.toBeInTheDocument();
  });

  it("descripción en una línea; sin descripción no hay párrafo", () => {
    const { unmount } = renderWithProviders(
      <NextStepCard item={NEXT_ITEM} stepNumber={2} total={4} />,
    );
    expect(screen.getByText("Componentes, props y estado.")).toHaveClass("line-clamp-1");
    unmount();

    const { container: empty } = renderWithProviders(
      <NextStepCard item={{ ...NEXT_ITEM, description: null }} stepNumber={2} total={4} />,
    );
    expect(empty.querySelector(".line-clamp-1")).toBeNull();
  });

  it("no muestra el `reason` aunque llegue en el ítem", () => {
    const item = { ...NEXT_ITEM, reason: "Recommended because…" } as typeof NEXT_ITEM;
    renderWithProviders(<NextStepCard item={item} stepNumber={2} total={4} />);

    expect(screen.queryByText(/Recommended because/)).not.toBeInTheDocument();
  });
});
