import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DropdownMenu, type DropdownMenuItem, type DropdownMenuProps } from "@/components/ui";
import { renderWithProviders } from "@/test/renderWithProviders";

function buildItems(overrides: Partial<Record<string, Partial<DropdownMenuItem>>> = {}) {
  return ["Editar", "Duplicar", "Eliminar"].map<DropdownMenuItem>((label) => ({
    id: label.toLowerCase(),
    label,
    onSelect: vi.fn(),
    ...overrides[label],
  }));
}

function renderMenu(props: Partial<DropdownMenuProps> = {}) {
  const items = props.items ?? buildItems();
  renderWithProviders(
    <>
      <button type="button">Antes</button>
      <DropdownMenu triggerLabel="Más acciones" trigger={<span>⋮</span>} items={items} {...props} />
      <button type="button">Después</button>
    </>,
  );
  return {
    items,
    user: userEvent.setup(),
    trigger: screen.getByRole("button", { name: "Más acciones" }),
  };
}

const menuItem = (name: string) => screen.getByRole("menuitem", { name });

describe("DropdownMenu", () => {
  it("renderiza el disparador cerrado con la semántica de menu button", () => {
    const { trigger } = renderMenu();
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).not.toHaveAttribute("aria-controls");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("abre con clic, enlaza trigger y menú, y enfoca el primer item", async () => {
    const { trigger, user } = renderMenu();
    await user.click(trigger);
    const menu = screen.getByRole("menu", { name: "Más acciones" });
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger).toHaveAttribute("aria-controls", menu.id);
    expect(screen.getAllByRole("menuitem")).toHaveLength(3);
    expect(menuItem("Editar")).toHaveFocus();
    expect(menuItem("Editar")).toHaveAttribute("tabindex", "-1");
  });

  it("un segundo clic en el disparador cierra el menú", async () => {
    const { trigger, user } = renderMenu();
    await user.click(trigger);
    await user.click(trigger);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("abre con Enter y con Espacio desde el teclado", async () => {
    const { trigger, user } = renderMenu();
    trigger.focus();
    await user.keyboard("{Enter}");
    expect(menuItem("Editar")).toHaveFocus();
    await user.keyboard("{Escape}");
    await user.keyboard(" ");
    expect(menuItem("Editar")).toHaveFocus();
  });

  it("ArrowDown en el disparador abre y enfoca el primero; ArrowUp, el último", async () => {
    const { trigger, user } = renderMenu();
    trigger.focus();
    await user.keyboard("{ArrowDown}");
    expect(menuItem("Editar")).toHaveFocus();
    await user.keyboard("{Escape}");
    await user.keyboard("{ArrowUp}");
    expect(menuItem("Eliminar")).toHaveFocus();
  });

  it("otras teclas en el disparador no abren el menú", async () => {
    const { trigger, user } = renderMenu();
    trigger.focus();
    await user.keyboard("a");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("las flechas recorren los items de forma cíclica", async () => {
    const { trigger, user } = renderMenu();
    await user.click(trigger);
    await user.keyboard("{ArrowDown}");
    expect(menuItem("Duplicar")).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(menuItem("Eliminar")).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(menuItem("Editar")).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(menuItem("Eliminar")).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(menuItem("Duplicar")).toHaveFocus();
  });

  it("sin items habilitados, las flechas dejan el foco en el menú", () => {
    renderMenu({
      items: buildItems({
        Editar: { disabled: true },
        Duplicar: { disabled: true },
        Eliminar: { disabled: true },
      }),
    });
    fireEvent.click(screen.getByRole("button", { name: "Más acciones" }));
    const menu = screen.getByRole("menu");
    expect(menu).toHaveFocus();
    fireEvent.keyDown(menu, { key: "ArrowUp" });
    expect(menu).toHaveFocus();
  });

  it("Home y End saltan al primer y último item", async () => {
    const { trigger, user } = renderMenu();
    await user.click(trigger);
    await user.keyboard("{End}");
    expect(menuItem("Eliminar")).toHaveFocus();
    await user.keyboard("{Home}");
    expect(menuItem("Editar")).toHaveFocus();
  });

  it("teclas sin manejar no mueven el foco ni cierran", async () => {
    const { trigger, user } = renderMenu();
    await user.click(trigger);
    await user.keyboard("x");
    expect(menuItem("Editar")).toHaveFocus();
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("Esc cierra y devuelve el foco al disparador", async () => {
    const { trigger, user } = renderMenu();
    await user.click(trigger);
    await user.keyboard("{ArrowDown}{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("seleccionar un item llama a onSelect, cierra y devuelve el foco", async () => {
    const { items, trigger, user } = renderMenu();
    await user.click(trigger);
    await user.click(menuItem("Duplicar"));
    expect(items[1].onSelect).toHaveBeenCalledTimes(1);
    expect(items[0].onSelect).not.toHaveBeenCalled();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("seleccionar con Enter desde el teclado", async () => {
    const { items, trigger, user } = renderMenu();
    trigger.focus();
    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");
    expect(items[1].onSelect).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("los items deshabilitados no disparan y se saltan al navegar", async () => {
    const items = buildItems({ Editar: { disabled: true } });
    const { trigger, user } = renderMenu({ items });
    await user.click(trigger);
    expect(menuItem("Editar")).toBeDisabled();
    expect(menuItem("Duplicar")).toHaveFocus();
    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(menuItem("Duplicar")).toHaveFocus();
    await user.keyboard("{Home}");
    expect(menuItem("Duplicar")).toHaveFocus();
    await user.click(menuItem("Editar"));
    expect(items[0].onSelect).not.toHaveBeenCalled();
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("si todos los items están deshabilitados, el foco va al menú", async () => {
    const { trigger, user } = renderMenu({
      items: buildItems({
        Editar: { disabled: true },
        Duplicar: { disabled: true },
        Eliminar: { disabled: true },
      }),
    });
    await user.click(trigger);
    expect(screen.getByRole("menu")).toHaveFocus();
  });

  it("clic fuera cierra sin mover el foco al disparador", async () => {
    const { trigger, user } = renderMenu();
    await user.click(trigger);
    await user.click(document.body);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("clic dentro del menú (no en un item) no lo cierra", async () => {
    const { trigger, user } = renderMenu();
    await user.click(trigger);
    await user.pointer({ keys: "[MouseLeft]", target: screen.getByRole("menu") });
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("Tab fuera del componente cierra el menú", async () => {
    const { trigger, user } = renderMenu();
    await user.click(trigger);
    await user.tab();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Después" })).toHaveFocus();
  });

  it("el foco que vuelve al disparador no cierra el menú", async () => {
    const { trigger, user } = renderMenu();
    await user.click(trigger);
    await user.tab({ shift: true });
    expect(trigger).toHaveFocus();
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("un blur sin destino (relatedTarget nulo) no cierra el menú", async () => {
    const { trigger, user } = renderMenu();
    await user.click(trigger);
    fireEvent.blur(menuItem("Editar"), { relatedTarget: null });
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("solo un menú abierto a la vez (ratón y teclado)", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <DropdownMenu triggerLabel="Menú A" trigger="A" items={buildItems()} />
        <DropdownMenu triggerLabel="Menú B" trigger="B" items={buildItems()} />
      </>,
    );
    const triggerA = screen.getByRole("button", { name: "Menú A" });
    const triggerB = screen.getByRole("button", { name: "Menú B" });

    await user.click(triggerA);
    await user.click(triggerB);
    expect(screen.getAllByRole("menu")).toHaveLength(1);
    expect(screen.getByRole("menu", { name: "Menú B" })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await user.keyboard("{Shift>}{Tab}{/Shift}");
    expect(triggerA).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("menu", { name: "Menú A" })).toBeInTheDocument();
    await user.tab();
    expect(triggerB).toHaveFocus();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("aplica alineación, tono, icono y clases del disparador", async () => {
    const items = buildItems({ Eliminar: { tone: "danger", icon: <svg data-testid="icono" /> } });
    const { trigger, user } = renderMenu({ items, align: "start", triggerClassName: "size-8" });
    expect(trigger).toHaveClass("size-8");
    await user.click(trigger);
    expect(screen.getByRole("menu")).toHaveClass("absolute", "top-full", "left-0");
    expect(menuItem("Eliminar")).toHaveClass("text-danger");
    expect(menuItem("Editar")).toHaveClass("text-text-body");
    expect(screen.getByTestId("icono").parentElement).toHaveAttribute("aria-hidden", "true");
  });

  it("por defecto se alinea al final del disparador", async () => {
    const { trigger, user } = renderMenu();
    await user.click(trigger);
    expect(screen.getByRole("menu")).toHaveClass("right-0");
  });
});
