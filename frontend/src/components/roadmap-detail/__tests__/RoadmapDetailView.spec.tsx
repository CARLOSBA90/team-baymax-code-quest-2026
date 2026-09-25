import { screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RoadmapDetailView } from "@/components/roadmap-detail";
import {
  buildNotStartedRoadmapDetail,
  buildPausedRoadmapDetail,
  buildRoadmapDetail,
  buildRoadmapItem,
  ROADMAP_DETAIL,
} from "@/test/fixtures/roadmap-detail";
import { renderWithProviders } from "@/test/renderWithProviders";

describe("RoadmapDetailView", () => {
  beforeEach(() => {
    // Solo Date: «Última actividad» depende del reloj (fixture: 2026-09-21T18:30Z).
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-25T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("enlaza a Mis Rutas y muestra nombre, resumen, estado y última actividad", () => {
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
    expect(screen.getByText("Última actividad: hace 3 días")).toBeInTheDocument();
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
    expect(items.map((item) => within(item).getByRole("heading", { level: 3 }))).toEqual(
      ROADMAP_DETAIL.items.map((item, i) =>
        screen.getByRole("heading", { level: 3, name: `Paso ${i + 1} de 4: ${item.name}` }),
      ),
    );
    expect(screen.getByRole("heading", { level: 2, name: "Pasos de la ruta" })).toBeInTheDocument();
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

  it("todos los botones están deshabilitados y no hay menú ⋯", () => {
    renderWithProviders(<RoadmapDetailView roadmap={ROADMAP_DETAIL} />);

    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
    for (const button of buttons) expect(button).toBeDisabled();
    expect(document.querySelector('[aria-haspopup="menu"]')).toBeNull();
    expect(screen.queryByRole("button", { name: /opciones/i })).not.toBeInTheDocument();
  });

  it("en curso muestra «Continúa aquí» con el siguiente paso", () => {
    renderWithProviders(<RoadmapDetailView roadmap={ROADMAP_DETAIL} />);

    const region = screen.getByRole("region", { name: "Continúa aquí" });
    expect(
      within(region).getByRole("heading", { level: 2, name: "Introducción a React" }),
    ).toBeInTheDocument();
    expect(within(region).getByText("Paso 2 de 4 · Intermedio · 3 h")).toBeInTheDocument();
  });

  it("sin empezar se trata como en curso: «Continúa aquí» en el paso 1, chip «Siguiente» y 0 % violeta", () => {
    renderWithProviders(<RoadmapDetailView roadmap={buildNotStartedRoadmapDetail()} />);

    expect(screen.getByText("Sin empezar")).toBeInTheDocument();
    const region = screen.getByRole("region", { name: "Continúa aquí" });
    expect(
      within(region).getByRole("heading", { level: 2, name: "Fundamentos de JavaScript" }),
    ).toBeInTheDocument();
    expect(within(region).getByText(/^Paso 1 de 4/)).toBeInTheDocument();

    const [first] = within(screen.getByRole("list", { name: "Pasos de la ruta" })).getAllByRole(
      "listitem",
    );
    expect(first).toHaveAttribute("data-state", "next");
    expect(within(first).getByText("Siguiente")).toBeInTheDocument();
    expect(screen.getByText("0%")).toHaveClass("text-accent-soft");
    expect(screen.getByTestId("roadmap-detail-progress-fill")).toHaveClass("bg-status-started-bar");
  });

  it("sin siguiente paso no muestra «Continúa aquí»", () => {
    renderWithProviders(<RoadmapDetailView roadmap={buildRoadmapDetail({ nextStep: null })} />);

    expect(screen.queryByRole("region", { name: "Continúa aquí" })).not.toBeInTheDocument();
  });

  it("con un siguiente paso huérfano no muestra «Continúa aquí» y no falla", () => {
    renderWithProviders(
      <RoadmapDetailView
        roadmap={buildRoadmapDetail({
          nextStep: { roadmapItemId: "item-x", name: "Fantasma", url: null },
        })}
      />,
    );

    expect(screen.queryByRole("region", { name: "Continúa aquí" })).not.toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Pasos de la ruta" })).toBeInTheDocument();
  });

  it("en pausa muestra el banner en vez de «Continúa aquí» y describe los botones de completar", () => {
    renderWithProviders(<RoadmapDetailView roadmap={buildPausedRoadmapDetail()} />);

    expect(screen.getByText("En pausa")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Esta ruta está en pausa" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/^La pausaste el 3 de septiembre\./)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reanudar ruta" })).toBeDisabled();
    expect(screen.queryByRole("region", { name: "Continúa aquí" })).not.toBeInTheDocument();

    // Sin atenuar: el siguiente paso conserva su chip (#224 Q1).
    const items = within(screen.getByRole("list", { name: "Pasos de la ruta" })).getAllByRole(
      "listitem",
    );
    expect(items[1]).toHaveAttribute("data-state", "next");
    expect(within(items[1]).getByText("Siguiente")).toBeInTheDocument();

    const completeButtons = screen.getAllByRole("button", { name: /^Marcar como completado/ });
    expect(completeButtons.length).toBeGreaterThan(0);
    for (const button of completeButtons) {
      expect(button).toBeDisabled();
      expect(button).toHaveAccessibleDescription(/no se registra tu avance/);
    }

    expect(screen.getByTestId("roadmap-detail-progress-fill")).toHaveClass("bg-status-paused-bar");
    expect(screen.getByText("33%")).toHaveClass("text-status-paused-text");
  });

  it("fuera de pausa no hay banner ni descripción en los botones de completar", () => {
    renderWithProviders(<RoadmapDetailView roadmap={ROADMAP_DETAIL} />);

    expect(screen.queryByText("Esta ruta está en pausa")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reanudar ruta" })).not.toBeInTheDocument();
    for (const button of screen.getAllByRole("button", { name: /^Marcar como completado/ })) {
      expect(button).not.toHaveAttribute("aria-describedby");
    }
  });
});
