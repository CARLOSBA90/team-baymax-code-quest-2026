import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { NextStepCard } from "@/components/roadmap-detail";
import { buildRoadmapItem, ROADMAP_DETAIL } from "@/test/fixtures/roadmap-detail";
import { renderWithProviders } from "@/test/renderWithProviders";

const NEXT_ITEM = ROADMAP_DETAIL.items[1];

describe("NextStepCard", () => {
  it("es la región «Continúa aquí» con el nombre del paso como h2 y su meta con posición", () => {
    renderWithProviders(
      <NextStepCard item={NEXT_ITEM} stepNumber={2} total={4} onComplete={vi.fn()} />,
    );

    const region = screen.getByRole("region", { name: "Continúa aquí" });
    expect(
      within(region).getByRole("heading", { level: 2, name: "Introducción a React" }),
    ).toBeInTheDocument();
    expect(within(region).getByText("Paso 2 de 4 · Intermedio · 3 h")).toBeInTheDocument();
  });

  it("enlace primario de 48px en móvil (44px desde sm:) a la url en pestaña nueva", () => {
    renderWithProviders(
      <NextStepCard item={NEXT_ITEM} stepNumber={2} total={4} onComplete={vi.fn()} />,
    );

    const link = screen.getByRole("link", {
      name: "Ir al curso Introducción a React (se abre en una pestaña nueva)",
    });
    expect(link).toHaveAttribute("href", NEXT_ITEM.url);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveClass("h-12", "sm:h-11");
  });

  it("sin url no pinta enlace", () => {
    renderWithProviders(
      <NextStepCard
        item={{ ...NEXT_ITEM, url: null }}
        stepNumber={2}
        total={4}
        onComplete={vi.fn()}
      />,
    );

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("completable → «Marcar como completado» habilitado de 48px en móvil (44px desde sm:)", () => {
    const item = buildRoadmapItem({ name: "Node.js", url: "https://example.com/node" });
    renderWithProviders(<NextStepCard item={item} stepNumber={1} total={3} onComplete={vi.fn()} />);

    const button = screen.getByRole("button", { name: "Marcar como completado Node.js" });
    expect(button).toBeEnabled();
    expect(button).not.toHaveAttribute("aria-describedby");
    expect(button).toHaveClass("h-12", "sm:h-11");
  });

  it("clic en «Marcar como completado» llama a onComplete con el ítem", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    const item = buildRoadmapItem({ name: "Node.js" });
    renderWithProviders(
      <NextStepCard item={item} stepNumber={1} total={3} onComplete={onComplete} />,
    );

    await user.click(screen.getByRole("button", { name: "Marcar como completado Node.js" }));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(item);
  });

  it("su h2 no es destino de foco: sin id ni tabIndex (el foco va al h3 del timeline)", () => {
    const item = buildRoadmapItem({ name: "Node.js" });
    renderWithProviders(<NextStepCard item={item} stepNumber={1} total={3} onComplete={vi.fn()} />);

    const heading = screen.getByRole("heading", { level: 2, name: "Node.js" });
    expect(heading).not.toHaveAttribute("id");
    expect(heading).not.toHaveAttribute("tabindex");
  });

  it("tracking automático (VIDEO) → mensaje y sin botón", () => {
    renderWithProviders(
      <NextStepCard item={NEXT_ITEM} stepNumber={2} total={4} onComplete={vi.fn()} />,
    );

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
    renderWithProviders(<NextStepCard item={item} stepNumber={1} total={3} onComplete={vi.fn()} />);

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
    renderWithProviders(<NextStepCard item={item} stepNumber={1} total={3} onComplete={vi.fn()} />);

    const region = screen.getByRole("region", { name: "Continúa aquí" });
    expect(within(region).queryByRole("link")).not.toBeInTheDocument();
    expect(within(region).queryByRole("button")).not.toBeInTheDocument();
    expect(within(region).queryByText(/registra|registrar/)).not.toBeInTheDocument();
  });

  it("descripción en una línea; sin descripción no hay párrafo", () => {
    const { unmount } = renderWithProviders(
      <NextStepCard item={NEXT_ITEM} stepNumber={2} total={4} onComplete={vi.fn()} />,
    );
    expect(screen.getByText("Componentes, props y estado.")).toHaveClass("line-clamp-1");
    unmount();

    const { container: empty } = renderWithProviders(
      <NextStepCard
        item={{ ...NEXT_ITEM, description: null }}
        stepNumber={2}
        total={4}
        onComplete={vi.fn()}
      />,
    );
    expect(empty.querySelector(".line-clamp-1")).toBeNull();
  });

  describe("móvil (base) / tablet (sm:)", () => {
    const follows = (a: Node, b: Node) =>
      Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

    const COMPLETABLE = buildRoadmapItem({
      name: "Node.js",
      description: "Servidores con Node.",
      url: "https://example.com/node",
    });

    it("la región es un grid con áreas y padding mobile-first", () => {
      renderWithProviders(
        <NextStepCard item={COMPLETABLE} stepNumber={1} total={3} onComplete={vi.fn()} />,
      );

      const region = screen.getByRole("region", { name: "Continúa aquí" });
      expect(region).toHaveClass(
        "grid",
        "grid-cols-[auto_minmax(0,1fr)]",
        "gap-x-3",
        "sm:gap-x-5",
        "p-4",
        "sm:px-[22px]",
        "sm:py-5",
        "[grid-template-areas:'eyebrow_eyebrow'_'thumb_title'_'desc_desc'_'actions_actions']",
        "sm:[grid-template-areas:'thumb_eyebrow'_'thumb_title'_'thumb_desc'_'thumb_actions']",
      );
      for (const legacy of ["flex", "px-[22px]", "py-5"]) {
        expect(region).not.toHaveClass(legacy);
      }
    });

    it("el eyebrow «Continúa aquí» es el primer hijo y sigue nombrando la región", () => {
      renderWithProviders(
        <NextStepCard item={COMPLETABLE} stepNumber={1} total={3} onComplete={vi.fn()} />,
      );

      const region = screen.getByRole("region", { name: "Continúa aquí" });
      const eyebrow = within(region).getByText("Continúa aquí");
      expect(region.firstElementChild).toBe(eyebrow);
      expect(eyebrow).toHaveClass("[grid-area:eyebrow]");
      expect(region).toHaveAttribute("aria-labelledby", eyebrow.id);
    });

    it("orden DOM eyebrow → h2 → enlace → botón", () => {
      renderWithProviders(
        <NextStepCard item={COMPLETABLE} stepNumber={1} total={3} onComplete={vi.fn()} />,
      );

      const region = screen.getByRole("region", { name: "Continúa aquí" });
      const eyebrow = within(region).getByText("Continúa aquí");
      const heading = within(region).getByRole("heading", { level: 2, name: "Node.js" });
      const link = within(region).getByRole("link", {
        name: "Ir al curso Node.js (se abre en una pestaña nueva)",
      });
      const button = within(region).getByRole("button", {
        name: "Marcar como completado Node.js",
      });
      expect(follows(eyebrow, heading)).toBe(true);
      expect(follows(heading, link)).toBe(true);
      expect(follows(link, button)).toBe(true);
    });

    it("h2 de 17px en móvil y 19px desde sm:", () => {
      renderWithProviders(
        <NextStepCard item={COMPLETABLE} stepNumber={1} total={3} onComplete={vi.fn()} />,
      );

      const heading = screen.getByRole("heading", { level: 2, name: "Node.js" });
      expect(heading).toHaveClass("text-[17px]", "sm:text-[19px]");
      expect(heading).not.toHaveClass("text-[19px]");
      expect(heading.parentElement).toHaveClass("[grid-area:title]", "min-w-0");
    });

    it("descripción en su área, 1 línea, con margen desde sm:", () => {
      renderWithProviders(
        <NextStepCard item={COMPLETABLE} stepNumber={1} total={3} onComplete={vi.fn()} />,
      );

      expect(screen.getByText("Servidores con Node.")).toHaveClass(
        "[grid-area:desc]",
        "line-clamp-1",
        "sm:mt-1.5",
      );
    });

    it("acciones apiladas a ancho completo en móvil y en una fila sin wrap desde sm:", () => {
      renderWithProviders(
        <NextStepCard item={COMPLETABLE} stepNumber={1} total={3} onComplete={vi.fn()} />,
      );

      const link = screen.getByRole("link", {
        name: "Ir al curso Node.js (se abre en una pestaña nueva)",
      });
      const button = screen.getByRole("button", { name: "Marcar como completado Node.js" });
      const actions = link.parentElement;
      expect(button.parentElement).toBe(actions);
      expect(actions).toHaveClass("[grid-area:actions]", "flex", "flex-col", "sm:flex-row");
      expect(actions).not.toHaveClass("flex-wrap");
      for (const control of [link, button]) {
        expect(control).toHaveClass("h-12", "w-full", "sm:h-11", "sm:w-fit");
        expect(control).not.toHaveClass("w-fit");
      }
    });

    it("LESSONS → mensaje por lección tras el enlace y sin botón", () => {
      const item = buildRoadmapItem({
        name: "Curso por lecciones",
        url: "https://example.com/lessons",
        tracking: { type: "LESSONS", enabled: true, disabledReason: null },
      });
      renderWithProviders(
        <NextStepCard item={item} stepNumber={1} total={3} onComplete={vi.fn()} />,
      );

      const link = screen.getByRole("link", {
        name: "Ir al curso Curso por lecciones (se abre en una pestaña nueva)",
      });
      const message = screen.getByText("El avance de este curso se registra por lección.");
      expect(follows(link, message)).toBe(true);
      expect(message).toHaveClass("min-w-0");
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });

  it("no muestra el `reason` aunque llegue en el ítem", () => {
    const item = { ...NEXT_ITEM, reason: "Recommended because…" } as typeof NEXT_ITEM;
    renderWithProviders(<NextStepCard item={item} stepNumber={2} total={4} onComplete={vi.fn()} />);

    expect(screen.queryByText(/Recommended because/)).not.toBeInTheDocument();
  });
});
