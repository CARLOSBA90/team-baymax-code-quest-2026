import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RoadmapDetailMenu, type RoadmapDetailMenuProps } from "@/components/roadmap-detail";
import { renderWithProviders } from "@/test/renderWithProviders";
import type { RoadmapStatus } from "@/types";

const NAME = "Frontend moderno";
const TRIGGER_NAME = `Más acciones para ${NAME}`;

function renderMenu(props: Partial<RoadmapDetailMenuProps> = {}) {
  const handlers = { onPause: vi.fn(), onResume: vi.fn(), onDelete: vi.fn() };
  renderWithProviders(
    <RoadmapDetailMenu
      roadmapName={NAME}
      status="IN_PROGRESS"
      disabled={false}
      {...handlers}
      {...props}
    />,
  );
  return {
    ...handlers,
    user: userEvent.setup(),
    trigger: screen.getByRole("button", { name: TRIGGER_NAME }),
  };
}

describe("RoadmapDetailMenu", () => {
  it("disparador «Más acciones para {nombre}» de 44px con borde, sin segundo radio", () => {
    const { trigger } = renderMenu();

    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    expect(trigger).toHaveClass("size-11", "border", "border-border-card", "rounded-lg");
    for (const cls of ["rounded-xl", "rounded-md", "rounded-full", "rounded-control", "size-9"]) {
      expect(trigger).not.toHaveClass(cls);
    }
    const icon = trigger.querySelector("svg");
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icon).toHaveClass("size-5");
  });

  it.each<[RoadmapStatus, string[]]>([
    ["IN_PROGRESS", ["Pausar ruta", "Eliminar ruta"]],
    ["PAUSED", ["Reanudar ruta", "Eliminar ruta"]],
    ["NOT_STARTED", ["Eliminar ruta"]],
    ["COMPLETED", ["Eliminar ruta"]],
  ])("%s ofrece %j, todos habilitados", async (status, labels) => {
    const { trigger, user } = renderMenu({ status });

    await user.click(trigger);

    const menu = screen.getByRole("menu", { name: TRIGGER_NAME });
    const items = within(menu).getAllByRole("menuitem");
    expect(items.map((item) => item.textContent)).toEqual(labels);
    for (const item of items) expect(item).toBeEnabled();
  });

  it("«Eliminar ruta» usa el tono danger y el menú se alinea a la derecha", async () => {
    const { trigger, user } = renderMenu();

    await user.click(trigger);

    expect(screen.getByRole("menuitem", { name: "Eliminar ruta" })).toHaveClass("text-danger");
    expect(screen.getByRole("menuitem", { name: "Pausar ruta" })).not.toHaveClass("text-danger");
    expect(screen.getByRole("menu")).toHaveClass("right-0");
  });

  it.each([
    ["IN_PROGRESS", "Pausar ruta", "onPause"],
    ["PAUSED", "Reanudar ruta", "onResume"],
    ["IN_PROGRESS", "Eliminar ruta", "onDelete"],
    ["COMPLETED", "Eliminar ruta", "onDelete"],
  ] as const)(
    "%s: «%s» llama a %s una vez, cierra y devuelve el foco",
    async (status, label, cb) => {
      const menu = renderMenu({ status });

      await menu.user.click(menu.trigger);
      await menu.user.click(screen.getByRole("menuitem", { name: label }));

      expect(menu[cb]).toHaveBeenCalledTimes(1);
      for (const other of ["onPause", "onResume", "onDelete"] as const) {
        if (other !== cb) expect(menu[other]).not.toHaveBeenCalled();
      }
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
      expect(menu.trigger).toHaveFocus();
    },
  );

  it("disabled: el disparador queda deshabilitado, no abre y no llama a nada", async () => {
    const { trigger, user, onPause, onResume, onDelete } = renderMenu({ disabled: true });

    expect(trigger).toHaveAttribute("aria-disabled", "true");
    await user.click(trigger);
    trigger.focus();
    await user.keyboard("{Enter}");
    await user.keyboard("{ArrowDown}");

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    for (const cb of [onPause, onResume, onDelete]) expect(cb).not.toHaveBeenCalled();
  });

  it("disabled: muestra un spinner decorativo en vez del ⋯", () => {
    const { trigger } = renderMenu({ disabled: true });

    const icon = trigger.querySelector("svg");
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icon).toHaveClass("animate-spin", "size-5");
  });

  it("habilitado: no muestra el spinner, solo el icono ⋯", () => {
    const { trigger } = renderMenu({ disabled: false });

    const icon = trigger.querySelector("svg");
    expect(icon).not.toHaveClass("animate-spin");
  });
});
