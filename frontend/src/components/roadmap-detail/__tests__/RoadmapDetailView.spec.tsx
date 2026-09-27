import { QueryClient } from "@tanstack/react-query";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { roadmapsKeys } from "@/api/queries/roadmaps";
import { deleteRoadmap, getRoadmap, setRoadmapPaused, trackItemCompletion } from "@/api/services";
import { RoadmapDetailView } from "@/components/roadmap-detail";
import { buildAxiosError, buildNetworkError } from "@/test/fixtures/api-errors";
import {
  buildRoadmapItemNotFoundError,
  buildRoadmapPausedError,
  buildTrackingMismatchError,
  buildTrackProgressResult,
} from "@/test/fixtures/progress";
import {
  buildCompletedRoadmapDetail,
  buildNotStartedRoadmapDetail,
  buildPausedRoadmapDetail,
  buildRoadmapDetail,
  buildRoadmapItem,
  ROADMAP_DETAIL,
} from "@/test/fixtures/roadmap-detail";
import {
  buildInvalidRoadmapTransitionError,
  buildPausedRoadmapDetailResult,
  buildResumedRoadmapDetail,
  buildRoadmapNotFoundError,
  buildRoadmapVersionConflictError,
} from "@/test/fixtures/roadmap-pause";
import { renderWithProviders } from "@/test/renderWithProviders";
import { byTextContent } from "@/test/textContent";
import type { RoadmapDetail, TrackProgressResult } from "@/types";

vi.mock("@/api/services", () => ({
  deleteRoadmap: vi.fn(),
  getRoadmap: vi.fn(),
  setRoadmapPaused: vi.fn(),
  trackItemCompletion: vi.fn(),
}));

const CONTEXTUAL_BLOCKS = [
  "Continúa aquí",
  "Esta ruta está en pausa",
  "Completaste la ruta",
] as const;

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

  describe("móvil (base) / tablet (sm:)", () => {
    it("miga, cabecera y ⋯ comparten un grid con áreas: ⋯ en la fila de la miga y desde sm: junto al h1", () => {
      renderWithProviders(<RoadmapDetailView roadmap={ROADMAP_DETAIL} />);

      const link = screen.getByRole("link", { name: "Mis Rutas" });
      const heading = screen.getByRole("heading", { level: 1, name: ROADMAP_DETAIL.name });
      const trigger = screen.getByRole("button", {
        name: `Más acciones para ${ROADMAP_DETAIL.name}`,
      });
      const grid = link.parentElement;
      expect(grid).toHaveClass(
        "grid",
        "grid-cols-[minmax(0,1fr)_auto]",
        "[grid-template-areas:'back_menu'_'header_header']",
        "sm:[grid-template-areas:'back_back'_'header_menu']",
      );
      expect(link).toHaveClass("[grid-area:back]", "self-center");
      const header = heading.closest("header");
      expect(header).toHaveClass("[grid-area:header]");
      expect(header?.parentElement).toBe(grid);
      const menuCell = trigger.closest(".\\[grid-area\\:menu\\]");
      expect(menuCell).toHaveClass("self-center", "sm:self-start");
      expect(menuCell?.parentElement).toBe(grid);
      // DOM: miga → h1 → ⋯ (el h1 se lee antes que «Más acciones»).
      expect(link.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(
        heading.compareDocumentPosition(trigger) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    it("orden de lectura: miga → h1 → resumen → badge → actividad → barra → bloque → pasos", () => {
      renderWithProviders(<RoadmapDetailView roadmap={ROADMAP_DETAIL} />);

      const sequence = [
        screen.getByRole("link", { name: "Mis Rutas" }),
        screen.getByRole("heading", { level: 1, name: ROADMAP_DETAIL.name }),
        screen.getByText(ROADMAP_DETAIL.summary),
        screen.getByText("Empezada"),
        screen.getByText("Última actividad: hace 3 días"),
        screen.getByRole("progressbar", { name: ROADMAP_DETAIL.name }),
        screen.getByRole("region", { name: "Continúa aquí" }),
        screen.getByRole("heading", { level: 2, name: "Pasos de la ruta" }),
        screen.getByRole("list", { name: "Pasos de la ruta" }),
      ];
      for (let i = 1; i < sequence.length; i++) {
        expect(
          sequence[i - 1].compareDocumentPosition(sequence[i]) & Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBeTruthy();
      }
    });
  });

  describe("nombres accesibles únicos (un solo DOM para todos los breakpoints)", () => {
    const FIVE_ITEMS = [1, 2, 3, 4, 5].map((order) =>
      buildRoadmapItem({
        roadmapItemId: `item-${order}`,
        order,
        courseId: `course-${order}`,
        name: `Curso número ${order}`,
        url: `https://example.com/courses/${order}`,
        ...(order <= 2
          ? {
              progress: 100,
              startedAt: "2026-09-10T09:00:00.000Z",
              completedAt: "2026-09-15T17:00:00.000Z",
            }
          : {}),
      }),
    );
    const FIVE_ITEMS_ROADMAP = buildRoadmapDetail({
      status: "IN_PROGRESS",
      progress: 40,
      items: FIVE_ITEMS,
      nextStep: {
        roadmapItemId: "item-3",
        name: "Curso número 3",
        url: "https://example.com/courses/3",
      },
    });

    function expectUniqueNames(roadmap: RoadmapDetail) {
      const list = screen.getByRole("list", { name: "Pasos de la ruta" });
      const nextRegion = screen.queryByRole("region", { name: "Continúa aquí" });
      const total = roadmap.items.length;

      expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
      expect(screen.getByRole("heading", { level: 1, name: roadmap.name })).toBeInTheDocument();
      expect(screen.getAllByRole("progressbar")).toHaveLength(1);
      expect(within(list).getAllByRole("heading", { level: 3 })).toHaveLength(total);

      roadmap.items.forEach((item, index) => {
        expect(
          screen.getAllByRole("heading", {
            level: 3,
            name: `Paso ${index + 1} de ${total}: ${item.name}`,
          }),
        ).toHaveLength(1);
        if (!item.url) return;
        const linkName = `Ir al curso ${item.name} (se abre en una pestaña nueva)`;
        expect(within(list).getAllByRole("link", { name: linkName })).toHaveLength(1);
        const isNext =
          nextRegion !== null && roadmap.nextStep?.roadmapItemId === item.roadmapItemId;
        if (nextRegion) {
          expect(within(nextRegion).queryAllByRole("link", { name: linkName })).toHaveLength(
            isNext ? 1 : 0,
          );
        }
        expect(screen.getAllByRole("link", { name: linkName })).toHaveLength(isNext ? 2 : 1);
      });

      const indicators = [
        ...screen.getAllByTestId("timeline-node"),
        ...screen.getAllByTestId("item-state-dot"),
      ];
      expect(indicators).toHaveLength(total * 2);
      for (const indicator of indicators) {
        expect(indicator).toHaveAttribute("aria-hidden", "true");
      }
      // Un único ⋯ (una sola instancia para todos los anchos).
      expect(document.querySelectorAll("[aria-haspopup]")).toHaveLength(1);
      expect(
        screen.getAllByRole("button", { name: `Más acciones para ${roadmap.name}` }),
      ).toHaveLength(1);
    }

    it("en curso con 5 pasos: un h1, un h3 por paso, un enlace por paso y otro en «Continúa aquí»", () => {
      renderWithProviders(<RoadmapDetailView roadmap={FIVE_ITEMS_ROADMAP} />);

      const headings = within(screen.getByRole("list", { name: "Pasos de la ruta" })).getAllByRole(
        "heading",
        { level: 3 },
      );
      expect(headings).toHaveLength(5);
      FIVE_ITEMS.forEach((item, index) => {
        expect(headings[index]).toHaveAccessibleName(`Paso ${index + 1} de 5: ${item.name}`);
      });

      const nextRegion = screen.getByRole("region", { name: "Continúa aquí" });
      const nextLinkName = "Ir al curso Curso número 3 (se abre en una pestaña nueva)";
      expect(within(nextRegion).getAllByRole("link", { name: nextLinkName })).toHaveLength(1);
      expect(screen.getAllByRole("link", { name: nextLinkName })).toHaveLength(2);
      for (const order of [1, 2, 4, 5]) {
        expect(
          screen.getAllByRole("link", {
            name: `Ir al curso Curso número ${order} (se abre en una pestaña nueva)`,
          }),
        ).toHaveLength(1);
      }
      expectUniqueNames(FIVE_ITEMS_ROADMAP);
    });

    it.each([
      ["NOT_STARTED", buildNotStartedRoadmapDetail],
      ["IN_PROGRESS", () => ROADMAP_DETAIL],
      ["PAUSED", buildPausedRoadmapDetail],
      ["COMPLETED", buildCompletedRoadmapDetail],
    ] as const)("%s: ningún encabezado, enlace ni indicador accesible duplicado", (_, build) => {
      const roadmap = build();
      renderWithProviders(<RoadmapDetailView roadmap={roadmap} />);

      expectUniqueNames(roadmap);
    });
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
    expect(
      screen.getByText(byTextContent("1 de 4 pasos · 7 h en total · quedan ~5 h")),
    ).toBeInTheDocument();
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
    expect(
      screen.getByText(byTextContent("0 de 1 paso · 1 h en total · quedan ~1 h")),
    ).toBeInTheDocument();
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

  describe.each([
    {
      status: "IN_PROGRESS",
      menuItems: ["Pausar ruta", "Eliminar ruta"],
      build: () => ROADMAP_DETAIL,
      badge: "Empezada",
      block: "Continúa aquí",
      fill: "bg-status-started-bar",
      percent: "33%",
      percentClass: "text-accent-soft",
      completeButtons: "plain",
    },
    {
      status: "NOT_STARTED",
      menuItems: ["Eliminar ruta"],
      build: buildNotStartedRoadmapDetail,
      badge: "Sin empezar",
      block: "Continúa aquí",
      fill: "bg-status-started-bar",
      percent: "0%",
      percentClass: "text-accent-soft",
      completeButtons: "plain",
    },
    {
      status: "PAUSED",
      menuItems: ["Reanudar ruta", "Eliminar ruta"],
      build: buildPausedRoadmapDetail,
      badge: "En pausa",
      block: "Esta ruta está en pausa",
      fill: "bg-status-paused-bar",
      percent: "33%",
      percentClass: "text-status-paused-text",
      completeButtons: "described",
    },
    {
      status: "COMPLETED",
      menuItems: ["Eliminar ruta"],
      build: buildCompletedRoadmapDetail,
      badge: "Completada",
      block: "Completaste la ruta",
      fill: "bg-status-completed",
      percent: "100%",
      percentClass: "text-status-completed-text",
      completeButtons: "none",
    },
  ] as const)(
    "estado $status (tabla «Comportamiento por estado»)",
    ({ build, badge, block, fill, percent, percentClass, completeButtons, menuItems }) => {
      it(`muestra el badge «${badge}» y solo el bloque contextual «${block}»`, () => {
        renderWithProviders(<RoadmapDetailView roadmap={build()} />);

        expect(screen.getByText(badge)).toBeInTheDocument();
        for (const name of CONTEXTUAL_BLOCKS) {
          if (name === block) {
            expect(screen.getByRole("region", { name })).toBeInTheDocument();
          } else {
            expect(screen.queryByRole("region", { name })).not.toBeInTheDocument();
            expect(screen.queryByText(name)).not.toBeInTheDocument();
          }
        }
        // «Reanudar ruta» solo acompaña al banner de pausa.
        expect(Boolean(screen.queryByRole("button", { name: "Reanudar ruta" }))).toBe(
          block === "Esta ruta está en pausa",
        );
      });

      it(`tiñe la barra global con ${fill} y el ${percent} con ${percentClass}`, () => {
        renderWithProviders(<RoadmapDetailView roadmap={build()} />);

        expect(screen.getByTestId("roadmap-detail-progress-fill")).toHaveClass(fill);
        expect(screen.getByText(percent)).toHaveClass(percentClass);
      });

      it(`un solo ⋯ habilitado con ${menuItems.join(" + ")} y una única live region vacía`, async () => {
        const user = userEvent.setup();
        const roadmap = build();
        renderWithProviders(<RoadmapDetailView roadmap={roadmap} />);

        const triggers = screen.getAllByRole("button", {
          name: `Más acciones para ${roadmap.name}`,
        });
        expect(triggers).toHaveLength(1);
        expect(triggers[0]).not.toHaveAttribute("aria-disabled");
        await user.click(triggers[0]);
        const items = within(screen.getByRole("menu")).getAllByRole("menuitem");
        expect(items.map((item) => item.textContent)).toEqual(menuItems);

        const regions = document.querySelectorAll('[aria-live="polite"]');
        expect(regions).toHaveLength(1);
        expect(regions[0]).toBe(screen.getByTestId("roadmap-detail-announcer"));
        expect(regions[0]).toHaveAttribute("aria-atomic", "true");
        expect(regions[0]).not.toHaveAttribute("role");
        expect(regions[0]).toBeEmptyDOMElement();
      });

      it(`botones «Marcar como completado»: ${completeButtons}`, () => {
        renderWithProviders(<RoadmapDetailView roadmap={build()} />);

        const buttons = screen.queryAllByRole("button", { name: /^Marcar como completado/ });
        const resume = screen.queryByRole("button", { name: "Reanudar ruta" });
        if (completeButtons === "none") {
          expect(buttons).toHaveLength(0);
          expect(resume).not.toBeInTheDocument();
          return;
        }
        expect(buttons.length).toBeGreaterThan(0);
        for (const button of buttons) {
          if (completeButtons === "described") {
            // PAUSED: deshabilitados y descritos por el banner; «Reanudar ruta» habilitado.
            expect(button).toBeDisabled();
            expect(button).toHaveAccessibleDescription(/no se registra tu avance/);
          } else {
            // IN_PROGRESS / NOT_STARTED: habilitados y sin descripción.
            expect(button).toBeEnabled();
            expect(button).not.toHaveAttribute("aria-describedby");
          }
        }
        if (completeButtons === "described") expect(resume).toBeEnabled();
        else expect(resume).not.toBeInTheDocument();
      });
    },
  );

  it("en curso: «Continúa aquí» presenta el siguiente paso con su meta", () => {
    renderWithProviders(<RoadmapDetailView roadmap={ROADMAP_DETAIL} />);

    const region = screen.getByRole("region", { name: "Continúa aquí" });
    expect(
      within(region).getByRole("heading", { level: 2, name: "Introducción a React" }),
    ).toBeInTheDocument();
    expect(within(region).getByText("Paso 2 de 4 · Intermedio · 3 h")).toBeInTheDocument();
  });

  it("sin empezar se trata como en curso: «Continúa aquí» en el paso 1 y chip «Siguiente»", () => {
    renderWithProviders(<RoadmapDetailView roadmap={buildNotStartedRoadmapDetail()} />);

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

  it("en pausa: el banner fecha la pausa y el siguiente paso conserva su chip", () => {
    renderWithProviders(<RoadmapDetailView roadmap={buildPausedRoadmapDetail()} />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Esta ruta está en pausa" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/^La pausaste el 3 de septiembre\./)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reanudar ruta" })).toBeEnabled();

    // Sin atenuar: el siguiente paso conserva su chip (#224 Q1).
    const items = within(screen.getByRole("list", { name: "Pasos de la ruta" })).getAllByRole(
      "listitem",
    );
    expect(items[1]).toHaveAttribute("data-state", "next");
    expect(within(items[1]).getByText("Siguiente")).toBeInTheDocument();
  });

  it("completada: el panel resume la ruta, enlaza y todos los pasos quedan completados", () => {
    renderWithProviders(<RoadmapDetailView roadmap={buildCompletedRoadmapDetail()} />);

    const panel = screen.getByRole("region", { name: "Completaste la ruta" });
    // 4 ítems, 390 min.
    expect(
      within(panel).getByText(
        "4 de 4 pasos · 7 h de estudio. Ya puedes crear otra ruta para seguir avanzando.",
      ),
    ).toBeInTheDocument();
    expect(within(panel).getByRole("link", { name: "Crear otra ruta" })).toHaveAttribute(
      "href",
      "/dashboard/roadmaps/new",
    );
    expect(within(panel).getByRole("link", { name: "Volver a Mis Rutas" })).toHaveAttribute(
      "href",
      "/dashboard/roadmaps",
    );

    const items = within(screen.getByRole("list", { name: "Pasos de la ruta" })).getAllByRole(
      "listitem",
    );
    for (const item of items) expect(within(item).getByText("Completado")).toBeInTheDocument();

    expect(screen.getByText(byTextContent("4 de 4 pasos · 7 h en total"))).toBeInTheDocument();
    expect(screen.queryByText(/quedan/)).not.toBeInTheDocument();
  });
});

describe("RoadmapDetailView — «Marcar como completado»", () => {
  const ITEM_NAME = "Guía de hooks de React";
  const OTHER_NAME = "Reto: lista de tareas con React";
  const DIALOG_NAME = "¿Marcar este paso como completado?";

  /** item-3 (READING) es el siguiente paso e item-4 pasa a ser rastreable (COMPLETION). */
  function buildFlowRoadmap(): RoadmapDetail {
    const base = buildRoadmapDetail();
    return {
      ...base,
      items: base.items.map((item) =>
        item.roadmapItemId === "item-4"
          ? { ...item, tracking: { type: "COMPLETION", enabled: true, disabledReason: null } }
          : item,
      ),
      nextStep: {
        roadmapItemId: "item-3",
        name: ITEM_NAME,
        url: "https://react.dev/reference/react/hooks",
      },
    };
  }

  function timeline() {
    return screen.getByRole("list", { name: "Pasos de la ruta" });
  }

  function timelineButton(name = ITEM_NAME) {
    return within(timeline()).getByRole("button", { name: `Marcar como completado ${name}` });
  }

  function nextStepButton() {
    return within(screen.getByRole("region", { name: "Continúa aquí" })).getByRole("button", {
      name: `Marcar como completado ${ITEM_NAME}`,
    });
  }

  function itemHeading(step = 3, name = ITEM_NAME) {
    return within(timeline()).getByRole("heading", {
      level: 3,
      name: `Paso ${step} de 4: ${name}`,
    });
  }

  function mainHeading() {
    return screen.getByRole("heading", { level: 1, name: ROADMAP_DETAIL.name });
  }

  function announcer() {
    return screen.getByTestId("roadmap-detail-announcer");
  }

  function dialogElement() {
    const dialog = document.querySelector("dialog");
    if (!dialog) throw new Error("dialog no encontrado");
    return dialog;
  }

  function renderFlow(roadmap: RoadmapDetail = buildFlowRoadmap()) {
    const user = userEvent.setup();
    renderWithProviders(<RoadmapDetailView roadmap={roadmap} />);
    return user;
  }

  async function confirm(user: ReturnType<typeof userEvent.setup>) {
    await user.click(
      within(screen.getByRole("dialog", { name: DIALOG_NAME })).getByRole("button", {
        name: "Sí, completar",
      }),
    );
  }

  afterEach(() => {
    document.documentElement.classList.remove("overflow-hidden");
  });

  it.each([
    ["el timeline", () => timelineButton()],
    ["«Continúa aquí»", () => nextStepButton()],
  ])("abre el diálogo con el nombre del paso desde %s", async (_, getButton) => {
    const user = renderFlow();

    await user.click(getButton());

    const dialog = screen.getByRole("dialog", { name: DIALOG_NAME });
    expect(within(dialog).getByText(ITEM_NAME)).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Cancelar" })).toHaveFocus();
  });

  it.each([
    ["Cancelar", () => within(dialogElement()).getByRole("button", { name: "Cancelar" })],
    ["Esc", null],
  ] as const)(
    "con %s cierra sin llamar al servicio y devuelve el foco al botón",
    async (_, get) => {
      const user = renderFlow();
      const opener = nextStepButton();
      await user.click(opener);

      if (get) await user.click(get());
      else fireEvent(dialogElement(), new Event("cancel", { cancelable: true }));

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(trackItemCompletion).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(opener);
      expect(announcer()).toBeEmptyDOMElement();
    },
  );

  it.each([
    ["el timeline", () => timelineButton()],
    ["«Continúa aquí»", () => nextStepButton()],
  ])(
    "200 (abierto desde %s): cierra, anuncia y enfoca el h3 del timeline",
    async (_, getButton) => {
      vi.mocked(trackItemCompletion).mockResolvedValue(buildTrackProgressResult());
      const user = renderFlow();
      const region = announcer();

      await user.click(getButton());
      await confirm(user);

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      expect(vi.mocked(trackItemCompletion).mock.calls[0][0]).toBe("item-3");
      expect(trackItemCompletion).toHaveBeenCalledTimes(1);
      // Sin detalle en caché: se reconstruye desde la respuesta (item-3 al 100 → 2 de 4).
      expect(announcer()).toHaveTextContent(
        `${ITEM_NAME} marcado como completado. Progreso de la ruta: 60 por ciento, 2 de 4 pasos.`,
      );
      expect(announcer()).toBe(region);
      expect(document.activeElement).toBe(itemHeading());
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    },
  );

  it("200 que completa la ruta: el anuncio acaba en «Completaste la ruta.»", async () => {
    const completed = buildCompletedRoadmapDetail();
    const roadmap: RoadmapDetail = {
      ...completed,
      status: "IN_PROGRESS",
      progress: 75,
      items: completed.items.map((item) =>
        item.roadmapItemId === "item-3" ? { ...item, progress: 0, completedAt: null } : item,
      ),
      nextStep: { roadmapItemId: "item-3", name: ITEM_NAME, url: null },
    };
    vi.mocked(trackItemCompletion).mockResolvedValue(
      buildTrackProgressResult({
        roadmap: {
          id: roadmap.id,
          progress: 100,
          status: "COMPLETED",
          lastActivity: "2026-09-25T11:00:00.000Z",
          activityVersion: 13,
        },
      }),
    );
    const user = renderFlow(roadmap);

    await user.click(timelineButton());
    await confirm(user);

    await waitFor(() =>
      expect(announcer()).toHaveTextContent(
        `${ITEM_NAME} marcado como completado. Progreso de la ruta: 100 por ciento, 4 de 4 pasos. Completaste la ruta.`,
      ),
    );
    // Con la prop fija no hay panel «Completaste la ruta»: el foco cae al h1.
    expect(document.activeElement).toBe(mainHeading());
  });

  it("sin conexión: alerta dentro del diálogo, sin anuncio, y el reintento completa", async () => {
    vi.mocked(trackItemCompletion)
      .mockRejectedValueOnce(buildNetworkError())
      .mockResolvedValueOnce(buildTrackProgressResult());
    const user = renderFlow();

    await user.click(timelineButton());
    await confirm(user);

    const dialog = screen.getByRole("dialog", { name: DIALOG_NAME });
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.",
    );
    expect(announcer()).toBeEmptyDOMElement();

    await confirm(user);

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(trackItemCompletion).toHaveBeenCalledTimes(2);
    expect(announcer()).toHaveTextContent(`${ITEM_NAME} marcado como completado.`);
  });

  it.each([500, 401])("%s: mensaje genérico, nunca el `message` del back", async (status) => {
    vi.mocked(trackItemCompletion).mockRejectedValue(buildAxiosError(status, "Backend says no"));
    const user = renderFlow();

    await user.click(timelineButton());
    await confirm(user);

    const dialog = screen.getByRole("dialog", { name: DIALOG_NAME });
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "No se pudo marcar como completado. Inténtalo de nuevo.",
    );
    expect(screen.queryByText(/Backend says no/)).not.toBeInTheDocument();
    expect(announcer()).toBeEmptyDOMElement();
  });

  it("mientras está pendiente: «Completando…», Cancelar deshabilitado y Esc no cierra", async () => {
    let resolve: (value: TrackProgressResult) => void = () => {};
    vi.mocked(trackItemCompletion).mockReturnValue(
      new Promise<TrackProgressResult>((r) => {
        resolve = r;
      }),
    );
    const user = renderFlow();

    await user.click(timelineButton());
    await confirm(user);

    const dialog = screen.getByRole("dialog", { name: DIALOG_NAME });
    expect(await within(dialog).findByText("Completando…")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Cancelar" })).toBeDisabled();
    fireEvent(dialogElement(), new Event("cancel", { cancelable: true }));
    expect(screen.getByRole("dialog", { name: DIALOG_NAME })).toBeInTheDocument();

    resolve(buildTrackProgressResult());

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("409 pausada: cierra, anuncia la pausa sin alerta y enfoca el h1 (sin banner)", async () => {
    vi.mocked(trackItemCompletion).mockRejectedValue(buildRoadmapPausedError());
    const user = renderFlow();

    await user.click(timelineButton());
    await confirm(user);

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(announcer()).toHaveTextContent(
      "Esta ruta está pausada. Reanúdala para registrar tu avance.",
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(mainHeading());
  });

  it("404: aviso neutro (status, no alerta), sin anuncio, y foco en el h1", async () => {
    vi.mocked(trackItemCompletion).mockRejectedValue(buildRoadmapItemNotFoundError());
    const user = renderFlow();

    await user.click(timelineButton());
    await confirm(user);

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    const notice = screen.getByText("Este paso ya no existe. Hemos actualizado la ruta.");
    expect(notice).toHaveAttribute("role", "status");
    // Variante `info` (neutra), no `success`.
    expect(notice).toHaveClass("bg-notice-info-bg");
    expect(notice).not.toHaveClass("bg-notice-success-bg");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(announcer()).toBeEmptyDOMElement();
    expect(document.activeElement).toBe(mainHeading());
    // El aviso encabeza la columna.
    expect(notice.parentElement?.firstElementChild).toBe(notice);
  });

  it("422: cierra, anuncia que ya no se puede marcar y enfoca el h3 del paso", async () => {
    vi.mocked(trackItemCompletion).mockRejectedValue(buildTrackingMismatchError());
    const user = renderFlow();

    await user.click(nextStepButton());
    await confirm(user);

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(announcer()).toHaveTextContent(
      "Este paso ya no se puede marcar como completado desde aquí.",
    );
    expect(document.activeElement).toBe(itemHeading());
  });

  it.each([
    ["un error de red", buildNetworkError],
    ["un 404", buildRoadmapItemNotFoundError],
  ])("tras %s, abrir otro paso limpia alerta, aviso y anuncio", async (_, buildError) => {
    vi.mocked(trackItemCompletion).mockRejectedValue(buildError());
    const user = renderFlow();

    await user.click(timelineButton());
    await confirm(user);
    await waitFor(() => expect(trackItemCompletion).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(
        screen.queryByRole("alert") ??
          screen.queryByText("Este paso ya no existe. Hemos actualizado la ruta."),
      ).toBeInTheDocument(),
    );
    if (screen.queryByRole("dialog")) {
      await user.click(within(dialogElement()).getByRole("button", { name: "Cancelar" }));
    }

    await user.click(timelineButton(OTHER_NAME));

    const dialog = screen.getByRole("dialog", { name: DIALOG_NAME });
    expect(within(dialog).getByText(OTHER_NAME)).toBeInTheDocument();
    expect(within(dialog).queryByText(ITEM_NAME)).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Este paso ya no existe. Hemos actualizado la ruta."),
    ).not.toBeInTheDocument();
    expect(announcer()).toBeEmptyDOMElement();
  });
});

describe("RoadmapDetailView — pausar, reanudar y eliminar", () => {
  const NAME = ROADMAP_DETAIL.name;
  const TRIGGER_NAME = `Más acciones para ${NAME}`;
  const NETWORK_MESSAGE =
    "No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.";
  const UPDATED_ELSEWHERE =
    "Alguien actualizó esta ruta desde otro lugar. Ya tienes la versión más reciente.";

  function trigger() {
    return screen.getByRole("button", { name: TRIGGER_NAME });
  }

  function mainHeading() {
    return screen.getByRole("heading", { level: 1, name: NAME });
  }

  function announcer() {
    return screen.getByTestId("roadmap-detail-announcer");
  }

  function completeButtons() {
    return screen.getAllByRole("button", { name: /^Marcar como completado/ });
  }

  /** Muestra la ubicación actual para comprobar la navegación tras borrar. */
  function LocationProbe() {
    const location = useLocation();
    return (
      <output data-testid="location">
        {location.pathname} {JSON.stringify(location.state)}
      </output>
    );
  }

  function renderView(roadmap: RoadmapDetail = ROADMAP_DETAIL, queryClient?: QueryClient) {
    const user = userEvent.setup();
    const result = renderWithProviders(
      <>
        <RoadmapDetailView roadmap={roadmap} />
        <LocationProbe />
      </>,
      { route: `/dashboard/roadmaps/${roadmap.id}`, queryClient },
    );
    return { user, ...result };
  }

  async function selectMenuItem(user: ReturnType<typeof userEvent.setup>, label: string) {
    await user.click(trigger());
    await user.click(screen.getByRole("menuitem", { name: label }));
  }

  function deferred<T>() {
    let resolve: (value: T) => void = () => {};
    const promise = new Promise<T>((r) => {
      resolve = r;
    });
    return { promise, resolve };
  }

  afterEach(() => {
    document.documentElement.classList.remove("overflow-hidden");
  });

  it("pausar desde ⋯ envía la versión y, sin conexión, muestra la alerta arriba sin mover el foco", async () => {
    vi.mocked(setRoadmapPaused).mockRejectedValue(buildNetworkError());
    const { user } = renderView();

    await selectMenuItem(user, "Pausar ruta");

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(NETWORK_MESSAGE);
    expect(alert.parentElement?.firstElementChild).toBe(alert);
    expect(vi.mocked(setRoadmapPaused).mock.calls[0][0]).toBe(ROADMAP_DETAIL.id);
    expect(vi.mocked(setRoadmapPaused).mock.calls[0][1]).toEqual({
      paused: true,
      expectedActivityVersion: ROADMAP_DETAIL.activityVersion,
    });
    expect(setRoadmapPaused).toHaveBeenCalledTimes(1);
    expect(getRoadmap).not.toHaveBeenCalled();
    expect(announcer()).toBeEmptyDOMElement();
    expect(trigger()).toHaveFocus();
    expect(trigger()).not.toHaveAttribute("aria-disabled");
  });

  it("500 al reanudar desde el banner: copy genérico de reanudar, nunca el `message` del back", async () => {
    vi.mocked(setRoadmapPaused).mockRejectedValue(buildAxiosError(500, "Backend says no"));
    const { user } = renderView(buildPausedRoadmapDetail());

    await user.click(screen.getByRole("button", { name: "Reanudar ruta" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No se pudo reanudar la ruta. Inténtalo de nuevo.",
    );
    expect(vi.mocked(setRoadmapPaused).mock.calls[0][1]).toMatchObject({ paused: false });
    expect(screen.queryByText(/Backend says no/)).not.toBeInTheDocument();
    expect(announcer()).toBeEmptyDOMElement();
    expect(screen.getByRole("button", { name: "Reanudar ruta" })).toBeEnabled();
  });

  it("error al reanudar desde el banner: el foco vuelve a su «Reanudar ruta» aunque el navegador lo soltara", async () => {
    let reject: (reason: unknown) => void = () => {};
    vi.mocked(setRoadmapPaused).mockReturnValue(
      new Promise((_, rej) => {
        reject = rej;
      }),
    );
    const { user } = renderView(buildPausedRoadmapDetail());
    const banner = screen.getByRole("region", { name: "Esta ruta está en pausa" });

    await user.click(within(banner).getByRole("button", { name: "Reanudar ruta" }));
    const pendingButton = within(banner).getByRole("button", { name: "Reanudando…" });
    expect(pendingButton).toBeDisabled();
    // Chromium suelta en `<body>` el foco de un botón que pasa a `disabled`; jsdom no (y su `blur()`
    // ignora elementos no enfocables): se simula enfocando un elemento temporal y quitándolo.
    const sink = document.createElement("input");
    document.body.append(sink);
    sink.focus();
    sink.remove();
    expect(document.activeElement).toBe(document.body);

    reject(buildNetworkError());

    expect(await screen.findByRole("alert")).toHaveTextContent(NETWORK_MESSAGE);
    const resumeButton = within(banner).getByRole("button", { name: "Reanudar ruta" });
    await waitFor(() => expect(document.activeElement).toBe(resumeButton));
    expect(resumeButton).toBeEnabled();
    expect(announcer()).toBeEmptyDOMElement();
  });

  it("error al reanudar desde ⋯: el foco sigue en el ⋯ (aria-disabled, nunca `disabled` nativo)", async () => {
    let reject: (reason: unknown) => void = () => {};
    vi.mocked(setRoadmapPaused).mockReturnValue(
      new Promise((_, rej) => {
        reject = rej;
      }),
    );
    const { user } = renderView(buildPausedRoadmapDetail());

    await selectMenuItem(user, "Reanudar ruta");
    expect(trigger()).toHaveAttribute("aria-disabled", "true");
    expect(trigger()).not.toBeDisabled();
    expect(trigger()).toHaveFocus();

    reject(buildAxiosError(500, "Backend says no"));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No se pudo reanudar la ruta. Inténtalo de nuevo.",
    );
    expect(trigger()).not.toHaveAttribute("aria-disabled");
    expect(document.activeElement).toBe(trigger());
  });

  it.each([
    ["ROADMAP_VERSION_CONFLICT", buildRoadmapVersionConflictError],
    ["INVALID_ROADMAP_TRANSITION", buildInvalidRoadmapTransitionError],
  ])("409 %s: aviso neutro (status, sin alerta), sin anuncio y foco en el h1", async (_, build) => {
    vi.mocked(setRoadmapPaused).mockRejectedValue(build());
    const { user } = renderView();

    await selectMenuItem(user, "Pausar ruta");

    const notice = await screen.findByText(UPDATED_ELSEWHERE);
    expect(notice).toHaveAttribute("role", "status");
    expect(notice).toHaveClass("bg-notice-info-bg");
    expect(notice.parentElement?.firstElementChild).toBe(notice);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(announcer()).toBeEmptyDOMElement();
    await waitFor(() => expect(document.activeElement).toBe(mainHeading()));
    expect(setRoadmapPaused).toHaveBeenCalledTimes(1);
  });

  it("404 al pausar: sin aviso ni anuncio en la vista (la página pinta «No encontramos»)", async () => {
    vi.mocked(setRoadmapPaused).mockRejectedValue(buildRoadmapNotFoundError());
    const { user } = renderView();

    await selectMenuItem(user, "Pausar ruta");

    await waitFor(() => expect(trigger()).not.toHaveAttribute("aria-disabled"));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByText(UPDATED_ELSEWHERE)).not.toBeInTheDocument();
    expect(announcer()).toBeEmptyDOMElement();
  });

  it("mientras pausa: ⋯ y todos los «Marcar como completado» bloqueados, una sola petición", async () => {
    const pending = deferred<RoadmapDetail>();
    vi.mocked(setRoadmapPaused).mockReturnValue(pending.promise);
    const { user } = renderView();

    await selectMenuItem(user, "Pausar ruta");

    await waitFor(() => expect(trigger()).toHaveAttribute("aria-disabled", "true"));
    for (const button of completeButtons()) expect(button).toBeDisabled();
    await user.click(trigger());
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(setRoadmapPaused).toHaveBeenCalledTimes(1);

    pending.resolve(buildPausedRoadmapDetailResult());

    await waitFor(() => expect(trigger()).not.toHaveAttribute("aria-disabled"));
    for (const button of completeButtons()) expect(button).toBeEnabled();
  });

  it.each([
    ["el banner", "banner"],
    ["el ⋯", "menu"],
  ] as const)("mientras reanuda desde %s: banner «Reanudando…» y ⋯ bloqueados", async (_, from) => {
    const pending = deferred<RoadmapDetail>();
    vi.mocked(setRoadmapPaused).mockReturnValue(pending.promise);
    const { user } = renderView(buildPausedRoadmapDetail());

    if (from === "banner") await user.click(screen.getByRole("button", { name: "Reanudar ruta" }));
    else await selectMenuItem(user, "Reanudar ruta");

    const banner = screen.getByRole("region", { name: "Esta ruta está en pausa" });
    const resuming = await within(banner).findByRole("button", { name: "Reanudando…" });
    expect(resuming).toBeDisabled();
    expect(trigger()).toHaveAttribute("aria-disabled", "true");
    for (const button of completeButtons()) expect(button).toBeDisabled();
    await user.click(resuming);
    expect(setRoadmapPaused).toHaveBeenCalledTimes(1);

    pending.resolve(buildResumedRoadmapDetail());
    await waitFor(() => expect(trigger()).not.toHaveAttribute("aria-disabled"));
  });

  it("200 sin observador: anuncia la pausa y el foco no se queda en ⋯ (cota de espera → h1)", async () => {
    vi.mocked(setRoadmapPaused).mockResolvedValue(buildPausedRoadmapDetailResult());
    const { user } = renderView();

    await selectMenuItem(user, "Pausar ruta");

    await waitFor(() =>
      expect(announcer()).toHaveTextContent(
        "Ruta pausada. Mientras esté pausada no se registra tu avance.",
      ),
    );
    // La prop no cambia (sin página): el banner no llega y, pasada la cota, cae al h1.
    await waitFor(() => expect(document.activeElement).toBe(mainHeading()), { timeout: 2500 });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("reanudar → 200 COMPLETED: sin anuncio y foco en el h1", async () => {
    vi.mocked(setRoadmapPaused).mockResolvedValue(buildCompletedRoadmapDetail());
    const { user } = renderView(buildPausedRoadmapDetail());

    await user.click(screen.getByRole("button", { name: "Reanudar ruta" }));

    await waitFor(() => expect(document.activeElement).toBe(mainHeading()), { timeout: 2500 });
    expect(announcer()).toBeEmptyDOMElement();
  });

  it.each([
    ["abrir completar", "complete"],
    ["abrir eliminar", "delete"],
    ["volver a pausar", "pause"],
  ] as const)("con una alerta de pausa visible, %s la limpia", async (_, action) => {
    vi.mocked(setRoadmapPaused).mockRejectedValue(buildNetworkError());
    const { user } = renderView();
    await selectMenuItem(user, "Pausar ruta");
    await screen.findByRole("alert");

    if (action === "complete") await user.click(completeButtons()[0]);
    else if (action === "delete") await selectMenuItem(user, "Eliminar ruta");
    else {
      vi.mocked(setRoadmapPaused).mockReturnValue(new Promise(() => {}));
      await selectMenuItem(user, "Pausar ruta");
    }

    expect(screen.queryByText(NETWORK_MESSAGE)).not.toBeInTheDocument();
  });

  it("con el aviso neutro de conflicto visible, abrir eliminar lo limpia", async () => {
    vi.mocked(setRoadmapPaused).mockRejectedValue(buildRoadmapVersionConflictError());
    const { user } = renderView();
    await selectMenuItem(user, "Pausar ruta");
    await screen.findByText(UPDATED_ELSEWHERE);

    await selectMenuItem(user, "Eliminar ruta");

    expect(screen.queryByText(UPDATED_ELSEWHERE)).not.toBeInTheDocument();
  });

  it("⋯ → «Eliminar ruta» abre la confirmación; Cancelar no borra y devuelve el foco al ⋯", async () => {
    const { user } = renderView();

    await selectMenuItem(user, "Eliminar ruta");

    const dialog = screen.getByRole("dialog", { name: `¿Eliminar ${NAME}?` });
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(deleteRoadmap).not.toHaveBeenCalled();
    expect(trigger()).toHaveFocus();
  });

  it("error de red al borrar: alerta dentro del diálogo, que sigue abierto", async () => {
    vi.mocked(deleteRoadmap).mockRejectedValue(buildNetworkError());
    const { user } = renderView();

    await selectMenuItem(user, "Eliminar ruta");
    const dialog = screen.getByRole("dialog", { name: `¿Eliminar ${NAME}?` });
    await user.click(within(dialog).getByRole("button", { name: "Eliminar ruta" }));

    expect(await within(dialog).findByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: `¿Eliminar ${NAME}?` })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Eliminar ruta" })).toBeEnabled();
    expect(screen.getByTestId("location")).toHaveTextContent(
      `/dashboard/roadmaps/${ROADMAP_DETAIL.id}`,
    );
  });

  it.each([
    ["200", false],
    ["404", true],
  ] as const)(
    "%s al borrar: navega a Mis Rutas con replace y el state de borrado; el diálogo sigue en «Eliminando…»",
    async (_status, notFound) => {
      if (notFound) vi.mocked(deleteRoadmap).mockRejectedValue(buildRoadmapNotFoundError());
      else vi.mocked(deleteRoadmap).mockResolvedValue({ id: ROADMAP_DETAIL.id });
      const { user } = renderView();

      await selectMenuItem(user, "Eliminar ruta");
      const dialog = screen.getByRole("dialog", { name: `¿Eliminar ${NAME}?` });
      await user.click(within(dialog).getByRole("button", { name: "Eliminar ruta" }));

      await waitFor(() =>
        expect(screen.getByTestId("location")).toHaveTextContent(
          `/dashboard/roadmaps ${JSON.stringify({ roadmapDeleted: { name: NAME, notFound } })}`,
        ),
      );
      expect(vi.mocked(deleteRoadmap).mock.calls[0][0]).toBe(ROADMAP_DETAIL.id);
      // Sin <Routes>, la vista sigue montada: el diálogo se queda bloqueado en «Eliminando…».
      expect(within(dialog).getByRole("button", { name: "Eliminando…" })).toBeDisabled();
      expect(within(dialog).getByRole("button", { name: "Cancelar" })).toBeDisabled();
      expect(within(dialog).queryByRole("alert")).not.toBeInTheDocument();
    },
  );

  it("tras borrar, el detalle sigue en caché con la vista montada y sale al desmontarla", async () => {
    vi.mocked(deleteRoadmap).mockResolvedValue({ id: ROADMAP_DETAIL.id });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Number.POSITIVE_INFINITY } },
    });
    const detailKey = roadmapsKeys.detail(ROADMAP_DETAIL.id);
    const otherKey = roadmapsKeys.detail("otra-ruta");
    queryClient.setQueryData(detailKey, ROADMAP_DETAIL);
    queryClient.setQueryData(otherKey, ROADMAP_DETAIL);
    const { user, unmount } = renderView(ROADMAP_DETAIL, queryClient);

    await selectMenuItem(user, "Eliminar ruta");
    await user.click(
      within(screen.getByRole("dialog", { name: `¿Eliminar ${NAME}?` })).getByRole("button", {
        name: "Eliminar ruta",
      }),
    );
    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(/^\/dashboard\/roadmaps /),
    );

    expect(queryClient.getQueryData(detailKey)).toBe(ROADMAP_DETAIL);
    expect(queryClient.getQueryState(detailKey)?.isInvalidated).toBe(false);
    unmount();
    expect(queryClient.getQueryState(detailKey)).toBeUndefined();
    expect(queryClient.getQueryData(otherKey)).toBe(ROADMAP_DETAIL);
  });

  it("desmontar sin haber borrado no toca la caché del detalle", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Number.POSITIVE_INFINITY } },
    });
    const detailKey = roadmapsKeys.detail(ROADMAP_DETAIL.id);
    queryClient.setQueryData(detailKey, ROADMAP_DETAIL);
    const { unmount } = renderView(ROADMAP_DETAIL, queryClient);

    unmount();

    expect(queryClient.getQueryData(detailKey)).toBe(ROADMAP_DETAIL);
  });
});
