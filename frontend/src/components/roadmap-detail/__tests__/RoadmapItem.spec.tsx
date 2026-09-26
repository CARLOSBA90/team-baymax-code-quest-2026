import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RoadmapItem, type RoadmapItemProps } from "@/components/roadmap-detail";
import { buildRoadmapItem, ROADMAP_DETAIL } from "@/test/fixtures/roadmap-detail";
import { renderWithProviders } from "@/test/renderWithProviders";
import type { RoadmapItem as RoadmapItemData, RoadmapItemState } from "@/types";

const [COMPLETED_ITEM, NEXT_ITEM, MEDIA_ITEM, CHALLENGE_ITEM] = ROADMAP_DETAIL.items;

function renderItem(props: Partial<RoadmapItemProps> = {}) {
  return renderWithProviders(
    <ol>
      <RoadmapItem
        item={COMPLETED_ITEM}
        stepNumber={1}
        total={4}
        state="completed"
        isLast={false}
        isPaused={false}
        onComplete={vi.fn()}
        headingId="item-heading"
        {...props}
      />
    </ol>,
  );
}

describe("RoadmapItem", () => {
  beforeEach(() => {
    // «completado el 15 sept» depende del año de `now`.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-25T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("completado: li con data-state, h3 «Paso i de N: …», chip, meta y enlace, sin botón ni mensaje", () => {
    renderItem();

    const li = screen.getByRole("listitem");
    expect(li).toHaveAttribute("data-state", "completed");
    expect(
      screen.getByRole("heading", { level: 3, name: "Paso 1 de 4: Fundamentos de JavaScript" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Paso 1 de 4:")).toHaveClass("sr-only");
    expect(screen.getByText("1 ·")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("Completado")).toBeInTheDocument();
    expect(screen.getByText("Básico · 2 h · completado el 15 sept")).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "Ir al curso Fundamentos de JavaScript (se abre en una pestaña nueva)",
      }),
    ).toHaveAttribute("href", COMPLETED_ITEM.url);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByText(/registra|registrar/)).not.toBeInTheDocument();
  });

  it("completado: nodo relleno con check y riel verde, ambos aria-hidden", () => {
    renderItem();

    const node = screen.getByTestId("timeline-node");
    expect(node).toHaveAttribute("aria-hidden", "true");
    expect(node).toHaveClass("border-node-done", "bg-node-done");
    expect(node.querySelector("svg")).not.toBeNull();

    const rail = screen.getByTestId("timeline-rail");
    expect(rail).toHaveAttribute("aria-hidden", "true");
    expect(rail).toHaveClass("bg-rail-done");
  });

  it("completado: tarjeta y miniatura en tono verde", () => {
    renderItem();

    const card = screen.getByTestId("timeline-card");
    expect(card).toHaveClass("bg-bg-item-done", "border-border-item-done");
  });

  it("siguiente: chip «Siguiente», nodo con halo, tarjeta next y enlace variante next", () => {
    renderItem({ item: NEXT_ITEM, stepNumber: 2, state: "next" });

    expect(screen.getByRole("listitem")).toHaveAttribute("data-state", "next");
    expect(screen.getByText("Siguiente")).toBeInTheDocument();
    expect(screen.getByTestId("timeline-node")).toHaveClass(
      "border-node-next",
      "bg-accent",
      "shadow-node-next",
    );
    expect(screen.getByTestId("timeline-rail")).toHaveClass("bg-rail");
    expect(screen.getByTestId("timeline-card")).toHaveClass(
      "bg-bg-item-next",
      "border-border-item-next",
    );
    expect(screen.getByRole("link", { name: /^Ir al curso Introducción a React/ })).toHaveClass(
      "border-border-item-next",
    );
  });

  it("siguiente con tracking automático (VIDEO) → mensaje y sin botón", () => {
    renderItem({ item: NEXT_ITEM, stepNumber: 2, state: "next" });

    expect(
      screen.getByText("El avance de este curso se registra automáticamente."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("pendiente con tracking por lecciones (LESSONS) → mensaje por lección y sin botón", () => {
    const item = buildRoadmapItem({
      name: "Curso por lecciones",
      tracking: { type: "LESSONS", enabled: true, disabledReason: null },
    });
    renderItem({ item, stepNumber: 3, state: "pending" });

    expect(
      screen.getByText("El avance de este curso se registra por lección."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Marcar como completado/ }),
    ).not.toBeInTheDocument();
  });

  it("en curso con 40 % → chip «En curso, 40 %», nodo con punto interior y tarjeta activa", () => {
    const item = buildRoadmapItem({
      name: "Node.js",
      progress: 40,
      startedAt: "2026-09-20T10:00:00.000Z",
    });
    renderItem({ item, stepNumber: 3, state: "in_progress" });

    expect(screen.getByText("En curso", { exact: false })).toHaveTextContent("En curso, 40 %");
    const node = screen.getByTestId("timeline-node");
    expect(node).toHaveClass("border-accent-hover", "bg-bg-base");
    expect(node.querySelector("span")).toHaveClass("bg-accent-hover");
    expect(screen.getByTestId("timeline-card")).toHaveClass(
      "bg-bg-item",
      "border-border-item-active",
    );
  });

  it("pendiente completable → sin chip, enlace ghost y botón habilitado", () => {
    renderItem({ item: MEDIA_ITEM, stepNumber: 3, state: "pending" });

    expect(screen.getByRole("listitem")).toHaveAttribute("data-state", "pending");
    expect(screen.queryByText(/Completado|Siguiente|En curso/)).not.toBeInTheDocument();
    expect(screen.getByTestId("timeline-node")).toHaveClass("border-node-pending", "bg-bg-base");
    expect(screen.getByTestId("timeline-card")).toHaveClass("bg-bg-item", "border-border-item");
    expect(screen.getByText("Recurso")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /^Ir al curso Guía de hooks de React/ }),
    ).not.toHaveClass("border-border-item-next");
    const button = screen.getByRole("button", {
      name: "Marcar como completado Guía de hooks de React",
    });
    expect(button).toBeEnabled();
    expect(button).not.toHaveAttribute("aria-describedby");
  });

  it("sin url ni descripción → sin enlace ni párrafo; !canTrack → mensaje sin código crudo", () => {
    renderItem({ item: CHALLENGE_ITEM, stepNumber: 4, state: "pending", isLast: true });

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(
      screen.getByText("Aún no podemos registrar el avance de este curso."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/TRACKING_METADATA_MISSING/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("el último ítem no tiene riel", () => {
    renderItem({ item: CHALLENGE_ITEM, stepNumber: 4, state: "pending", isLast: true });

    expect(screen.queryByTestId("timeline-rail")).not.toBeInTheDocument();
  });

  it("descripción en una línea en móvil y dos desde sm:; sin descripción no hay párrafo", () => {
    renderItem();
    expect(screen.getByText(COMPLETED_ITEM.description ?? "")).toHaveClass(
      "line-clamp-1",
      "sm:line-clamp-2",
    );
  });

  it("sin descripción no pinta párrafo vacío", () => {
    const { container } = renderItem({ item: MEDIA_ITEM, stepNumber: 3, state: "pending" });

    expect(container.querySelector("p.line-clamp-1")).not.toBeInTheDocument();
  });

  it("el h3 lleva el headingId y tabIndex=-1 como destino de foco, con el mismo nombre", () => {
    renderItem({ item: MEDIA_ITEM, stepNumber: 3, state: "pending", headingId: "tl-step-item-3" });

    const heading = screen.getByRole("heading", {
      level: 3,
      name: "Paso 3 de 4: Guía de hooks de React",
    });
    expect(heading).toHaveAttribute("id", "tl-step-item-3");
    expect(heading).toHaveAttribute("tabindex", "-1");
    expect(heading).toHaveClass("outline-none");
  });

  it("clic en «Marcar como completado» llama a onComplete con el ítem", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    renderItem({ item: MEDIA_ITEM, stepNumber: 3, state: "pending", onComplete });

    await user.click(
      screen.getByRole("button", { name: "Marcar como completado Guía de hooks de React" }),
    );

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(MEDIA_ITEM);
  });

  it("en pausa: botón disabled con aria-describedby, el clic no llama y sin atenuación", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    renderItem({
      onComplete,
      item: MEDIA_ITEM,
      stepNumber: 3,
      state: "next",
      isPaused: true,
      pausedDescriptionId: "paused-desc",
    });

    const button = screen.getByRole("button", { name: /^Marcar como completado/ });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-describedby", "paused-desc");
    await user.click(button);
    expect(onComplete).not.toHaveBeenCalled();
    expect(screen.getByText("Siguiente")).toBeInTheDocument();
    const li = screen.getByRole("listitem");
    expect(li.className).not.toMatch(/opacity-/);
    expect(within(li).getByTestId("timeline-card").className).not.toMatch(/opacity-/);
  });

  it("no muestra el `reason` aunque llegue en el ítem", () => {
    const item = { ...MEDIA_ITEM, reason: "Recommended because…" } as typeof MEDIA_ITEM;
    renderItem({ item, stepNumber: 3, state: "pending" });

    expect(screen.queryByText(/Recommended because/)).not.toBeInTheDocument();
  });

  describe("móvil (base) / tablet (sm:)", () => {
    const IN_PROGRESS_ITEM = buildRoadmapItem({
      name: "Node.js",
      progress: 40,
      startedAt: "2026-09-20T10:00:00.000Z",
    });

    function isBefore(a: Node, b: Node) {
      return Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    }

    it("li con sangría solo desde sm: (28px) y lg:; sin pl-9", () => {
      renderItem();

      const li = screen.getByRole("listitem");
      expect(li).toHaveClass("sm:pl-7", "lg:pl-11");
      expect(li).not.toHaveClass("pl-9");
    });

    it("riel y nodo ocultos en móvil, visibles desde sm:, ambos aria-hidden", () => {
      renderItem();

      const node = screen.getByTestId("timeline-node");
      expect(node).toHaveClass("hidden", "sm:flex");
      expect(node).not.toHaveClass("flex");
      expect(node).toHaveAttribute("aria-hidden", "true");
      const rail = screen.getByTestId("timeline-rail");
      expect(rail).toHaveClass("hidden", "sm:block");
      expect(rail).toHaveAttribute("aria-hidden", "true");
    });

    it.each<[RoadmapItemState, RoadmapItemData]>([
      ["completed", COMPLETED_ITEM],
      ["next", NEXT_ITEM],
      ["in_progress", IN_PROGRESS_ITEM],
      ["pending", MEDIA_ITEM],
    ])("%s: un punto de estado móvil dentro del h3, aria-hidden y sm:hidden", (state, item) => {
      renderItem({ item, state });

      const li = screen.getByRole("listitem");
      const dots = within(li).getAllByTestId("item-state-dot");
      expect(dots).toHaveLength(1);
      const [dot] = dots;
      expect(dot).toHaveAttribute("aria-hidden", "true");
      expect(dot).toHaveClass("inline-flex", "size-3.75", "sm:hidden");
      for (const cls of ["flex", "hidden"]) expect(dot).not.toHaveClass(cls);
      expect(li).toHaveAttribute("data-state", state);
      const node = screen.getByTestId("timeline-node");
      const stateClasses = [...node.classList].filter((c) =>
        /^(border-node|border-accent|bg-|shadow-node|text-node)/.test(c),
      );
      expect(stateClasses.length).toBeGreaterThan(0);
      expect(dot).toHaveClass(...stateClasses);

      const heading = screen.getByRole("heading", {
        level: 3,
        name: `Paso 1 de 4: ${item.name}`,
      });
      expect(heading.contains(dot)).toBe(true);
      expect(heading.firstElementChild).toBe(dot);
    });

    it.each<[RoadmapItemState, RoadmapItemData, string]>([
      ["next", NEXT_ITEM, "Siguiente"],
      ["completed", COMPLETED_ITEM, "Completado"],
    ])("%s: el chip «%s» sigue accesible fuera del h3", (state, item, label) => {
      renderItem({ item, state });

      const chip = screen.getByText(label);
      expect(chip).toBeVisible();
      expect(screen.getByRole("heading", { level: 3 }).contains(chip)).toBe(false);
    });

    it("tarjeta en grid; h3 hasta dos líneas", () => {
      renderItem();

      expect(screen.getByTestId("timeline-card")).toHaveClass("grid");
      const heading = screen.getByRole("heading", { level: 3 });
      expect(heading).toHaveClass("line-clamp-2");
      for (const cls of ["truncate", "line-clamp-1"]) expect(heading).not.toHaveClass(cls);
    });

    it("chip bajo la meta solo en móvil (order) y descripción al final", () => {
      renderItem();

      const chips = screen.getAllByText("Completado");
      expect(chips).toHaveLength(1);
      expect(chips[0]).toHaveClass("order-2", "sm:order-none", "self-start");
      expect(screen.getByText("Básico · 2 h · completado el 15 sept")).toHaveClass(
        "order-1",
        "sm:order-none",
      );
      expect(screen.getByText(COMPLETED_ITEM.description ?? "")).toHaveClass(
        "order-3",
        "sm:order-none",
      );
    });

    it("acciones: enlace antes que el botón, apiladas en móvil y en fila sin wrap desde sm:", () => {
      renderItem({ item: MEDIA_ITEM, stepNumber: 3, state: "pending" });

      const link = screen.getByRole("link", { name: /^Ir al curso Guía de hooks de React/ });
      const button = screen.getByRole("button", {
        name: "Marcar como completado Guía de hooks de React",
      });
      expect(isBefore(link, button)).toBe(true);
      const actions = link.parentElement as HTMLElement;
      expect(actions).toBe(button.parentElement);
      expect(actions).toHaveClass("flex", "flex-col", "sm:flex-row");
      expect(actions).not.toHaveClass("flex-wrap");
      expect(link).toHaveClass("h-11", "w-full", "sm:h-10", "sm:w-fit");
      expect(button).toHaveClass("h-11", "w-full", "sm:h-10", "sm:w-fit");
    });

    it("sin url → solo el botón a ancho completo", () => {
      renderItem({ item: buildRoadmapItem({ name: "Sin enlace" }), state: "pending" });

      expect(screen.queryByRole("link")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Marcar como completado Sin enlace" })).toHaveClass(
        "w-full",
      );
    });

    it("tracking automático: mensaje tras el enlace en el DOM, a la izquierda desde sm:", () => {
      renderItem({ item: NEXT_ITEM, stepNumber: 2, state: "next" });

      const link = screen.getByRole("link", { name: /^Ir al curso Introducción a React/ });
      const message = screen.getByText("El avance de este curso se registra automáticamente.");
      expect(isBefore(link, message)).toBe(true);
      expect(message).toHaveClass("sm:order-first", "sm:mr-auto", "min-w-0");
      expect(message).not.toHaveClass("mr-auto");
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });
});
