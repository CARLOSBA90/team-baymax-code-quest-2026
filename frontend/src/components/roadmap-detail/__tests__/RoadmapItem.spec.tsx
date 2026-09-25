import { screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RoadmapItem, type RoadmapItemProps } from "@/components/roadmap-detail";
import { buildRoadmapItem, ROADMAP_DETAIL } from "@/test/fixtures/roadmap-detail";
import { renderWithProviders } from "@/test/renderWithProviders";

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

  it("pendiente completable → sin chip, enlace ghost y botón disabled", () => {
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
    expect(button).toBeDisabled();
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

  it("descripción en dos líneas como máximo; sin descripción no hay párrafo", () => {
    renderItem();
    expect(screen.getByText(COMPLETED_ITEM.description ?? "")).toHaveClass("line-clamp-2");
  });

  it("sin descripción no pinta párrafo vacío", () => {
    const { container } = renderItem({ item: MEDIA_ITEM, stepNumber: 3, state: "pending" });

    expect(container.querySelector(".line-clamp-2")).not.toBeInTheDocument();
  });

  it("en pausa: botón disabled con aria-describedby y sin atenuación", () => {
    renderItem({
      item: MEDIA_ITEM,
      stepNumber: 3,
      state: "next",
      isPaused: true,
      pausedDescriptionId: "paused-desc",
    });

    const button = screen.getByRole("button", { name: /^Marcar como completado/ });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-describedby", "paused-desc");
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
});
