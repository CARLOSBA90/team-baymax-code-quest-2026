import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ItemStatusChip } from "@/components/roadmap-detail";
import { renderWithProviders } from "@/test/renderWithProviders";

describe("ItemStatusChip", () => {
  it("completed → «Completado» en verde", () => {
    renderWithProviders(<ItemStatusChip state="completed" progress={100} />);

    expect(screen.getByText("Completado")).toHaveClass("text-status-completed-text");
  });

  it("next → «Siguiente» en violeta y sin mini barra aunque tenga progreso", () => {
    const { container } = renderWithProviders(<ItemStatusChip state="next" progress={40} />);

    expect(screen.getByText("Siguiente")).toHaveClass("text-accent-soft");
    expect(container.querySelector("[data-testid='item-progress-fill']")).not.toBeInTheDocument();
    expect(container).not.toHaveTextContent("%");
  });

  it("in_progress con progreso parcial → «En curso» + mini barra decorativa y % oculto (#229)", () => {
    const { container } = renderWithProviders(
      <ItemStatusChip state="in_progress" progress={40.4} />,
    );

    const chip = screen.getByText("En curso", { exact: false });
    expect(chip).toHaveTextContent("En curso, 40 %");
    expect(screen.getByText(", 40 %")).toHaveClass("sr-only");

    const fill = screen.getByTestId("item-progress-fill");
    expect(fill).toHaveStyle({ width: "40%" });
    expect(fill.closest("[aria-hidden='true']")).toBeInTheDocument();
    expect(container.querySelector("[role='progressbar']")).not.toBeInTheDocument();
  });

  it.each([0, 100])("in_progress con progreso %s → sin mini barra ni %", (progress) => {
    const { container } = renderWithProviders(
      <ItemStatusChip state="in_progress" progress={progress} />,
    );

    expect(screen.getByText("En curso")).toBeInTheDocument();
    expect(screen.queryByTestId("item-progress-fill")).not.toBeInTheDocument();
    expect(container).not.toHaveTextContent("%");
  });

  it("añade className a la raíz", () => {
    renderWithProviders(
      <ItemStatusChip state="next" progress={0} className="order-2 self-start" />,
    );

    expect(screen.getByText("Siguiente")).toHaveClass("order-2", "self-start", "rounded-full");
  });

  it("pending → no pinta nada aunque reciba className", () => {
    const { container } = renderWithProviders(
      <ItemStatusChip state="pending" progress={0} className="order-2" />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("pending → no pinta nada", () => {
    const { container } = renderWithProviders(<ItemStatusChip state="pending" progress={0} />);

    expect(container).toBeEmptyDOMElement();
  });
});
