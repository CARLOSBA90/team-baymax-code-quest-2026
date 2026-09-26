import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ConfirmCompleteDialog,
  type ConfirmCompleteDialogProps,
} from "@/components/roadmap-detail";
import { buildRoadmapItem } from "@/test/fixtures/roadmap-detail";
import { renderWithProviders } from "@/test/renderWithProviders";

const TITLE = "¿Marcar este paso como completado?";

const ITEM = buildRoadmapItem({
  roadmapItemId: "item-1",
  name: "Fundamentos de Node",
  image: "https://cdn.example.com/courses/node.png",
});

function renderDialog(overrides: Partial<ConfirmCompleteDialogProps> = {}) {
  const props: ConfirmCompleteDialogProps = {
    item: ITEM,
    pending: false,
    errorMessage: null,
    onCancel: vi.fn(),
    onConfirm: vi.fn(),
    ...overrides,
  };
  const result = renderWithProviders(<ConfirmCompleteDialog {...props} />);
  return { props, ...result };
}

function dialogElement() {
  const dialog = document.querySelector("dialog");
  if (!dialog) throw new Error("dialog no encontrado");
  return dialog;
}

function dispatchCancel(dialog: HTMLDialogElement) {
  fireEvent(dialog, new Event("cancel", { cancelable: true }));
}

describe("ConfirmCompleteDialog", () => {
  afterEach(() => {
    document.documentElement.classList.remove("overflow-hidden");
  });

  it("con item=null no hay diálogo abierto", () => {
    renderDialog({ item: null });

    expect(dialogElement().open).toBe(false);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sí, completar" })).not.toBeInTheDocument();
  });

  it("abierto: nombrado por el h2, descrito por la advertencia, con el ítem y foco en Cancelar", () => {
    renderDialog();

    const dialog = screen.getByRole("dialog", { name: TITLE });
    expect(screen.getByRole("heading", { level: 2, name: TITLE })).toBeInTheDocument();
    expect(dialog).toHaveAccessibleDescription(
      expect.stringContaining("Esta acción no se puede deshacer."),
    );
    expect(within(dialog).getByText("no se puede deshacer").tagName).toBe("STRONG");
    expect(within(dialog).getByText("Fundamentos de Node")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancelar" })).toHaveFocus();
    expect(screen.queryByRole("button", { name: "Cerrar diálogo" })).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sí, completar" })).toBeEnabled();
  });

  it.each([
    ["MEDIA", "READING"],
    ["CHALLENGE", "COMPLETION"],
  ] as const)("con un ítem %s usa el mismo título", (type, tracking) => {
    renderDialog({
      item: buildRoadmapItem({
        type,
        name: "Guía de hooks",
        tracking: { type: tracking, enabled: true, disabledReason: null },
      }),
    });

    expect(screen.getByRole("dialog", { name: TITLE })).toBeInTheDocument();
    expect(screen.getByText("Guía de hooks")).toBeInTheDocument();
  });

  it("«Sí, completar» llama a onConfirm una vez y no a onCancel", async () => {
    const user = userEvent.setup();
    const { props } = renderDialog();

    await user.click(screen.getByRole("button", { name: "Sí, completar" }));

    expect(props.onConfirm).toHaveBeenCalledTimes(1);
    expect(props.onCancel).not.toHaveBeenCalled();
  });

  it("«Cancelar» llama a onCancel una vez", async () => {
    const user = userEvent.setup();
    const { props } = renderDialog();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(props.onCancel).toHaveBeenCalledTimes(1);
    expect(props.onConfirm).not.toHaveBeenCalled();
  });

  it("Esc llama a onCancel una vez", () => {
    const { props } = renderDialog();

    dispatchCancel(dialogElement());

    expect(props.onCancel).toHaveBeenCalledTimes(1);
  });

  it("click en el backdrop llama a onCancel una vez", async () => {
    const user = userEvent.setup();
    const { props } = renderDialog();

    await user.click(dialogElement());

    expect(props.onCancel).toHaveBeenCalledTimes(1);
  });

  describe("pendiente", () => {
    it("muestra «Completando…» y deshabilita ambos botones", () => {
      renderDialog({ pending: true });

      const confirm = screen.getByRole("button", { name: "Completando…" });
      expect(confirm).toBeDisabled();
      expect(confirm).toHaveAttribute("aria-busy", "true");
      expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
      expect(screen.queryByRole("button", { name: "Sí, completar" })).not.toBeInTheDocument();
    });

    it("Esc y backdrop no llaman a onCancel y el diálogo sigue abierto", async () => {
      const user = userEvent.setup();
      const { props } = renderDialog({ pending: true });

      dispatchCancel(dialogElement());
      await user.click(dialogElement());

      expect(props.onCancel).not.toHaveBeenCalled();
      expect(props.onConfirm).not.toHaveBeenCalled();
      expect(dialogElement().open).toBe(true);
    });
  });

  it("errorMessage se muestra como alerta dentro del diálogo, con los botones habilitados", () => {
    renderDialog({ errorMessage: "No se pudo marcar como completado. Inténtalo de nuevo." });

    const dialog = screen.getByRole("dialog", { name: TITLE });
    expect(within(dialog).getByRole("alert")).toHaveTextContent(
      "No se pudo marcar como completado. Inténtalo de nuevo.",
    );
    expect(screen.getByRole("button", { name: "Sí, completar" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeEnabled();
  });

  it("si la miniatura falla se queda el placeholder", () => {
    renderDialog();

    const img = dialogElement().querySelector("img");
    expect(img).toHaveAttribute("alt", "");
    fireEvent.error(img as HTMLImageElement);

    expect(dialogElement().querySelector("img")).not.toBeInTheDocument();
  });

  it("«Cancelar» va antes que «Sí, completar» en el DOM", () => {
    renderDialog();

    const cancel = screen.getByRole("button", { name: "Cancelar" });
    const confirm = screen.getByRole("button", { name: "Sí, completar" });
    expect(cancel.compareDocumentPosition(confirm) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
