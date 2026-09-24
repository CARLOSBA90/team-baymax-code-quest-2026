import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DeleteRoadmapDialog, type DeleteRoadmapDialogProps } from "@/components/roadmaps";
import { buildRoadmapSummary } from "@/test/fixtures/roadmaps";
import { renderWithProviders } from "@/test/renderWithProviders";

const FE = buildRoadmapSummary({ id: "rm-frontend-react", name: "Frontend moderno con React" });

function renderDialog(overrides: Partial<DeleteRoadmapDialogProps> = {}) {
  const props: DeleteRoadmapDialogProps = {
    roadmap: FE,
    pending: false,
    errorMessage: null,
    onCancel: vi.fn(),
    onConfirm: vi.fn(),
    ...overrides,
  };
  renderWithProviders(<DeleteRoadmapDialog {...props} />);
  return props;
}

function dialogElement() {
  const dialog = document.querySelector("dialog");
  if (!dialog) throw new Error("dialog no encontrado");
  return dialog;
}

function dispatchCancel(dialog: HTMLDialogElement) {
  fireEvent(dialog, new Event("cancel", { cancelable: true }));
}

describe("DeleteRoadmapDialog", () => {
  it("con roadmap=null no hay diálogo abierto", () => {
    renderDialog({ roadmap: null });

    expect(dialogElement().open).toBe(false);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Eliminar ruta" })).not.toBeInTheDocument();
  });

  it("abierto: se nombra por el título y se describe por el aviso", () => {
    renderDialog();

    const dialog = screen.getByRole("dialog", {
      name: "¿Eliminar Frontend moderno con React?",
    });
    expect(dialog).toHaveAccessibleDescription(
      "Se perderán tu progreso y tus entregas de esta ruta. Esta acción no se puede deshacer.",
    );
    expect(
      screen.getByRole("heading", { level: 2, name: "¿Eliminar Frontend moderno con React?" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Eliminar ruta" })).toBeEnabled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("el botón 'Eliminar ruta' usa la variante danger (roja), no el acento", () => {
    renderDialog();

    const confirm = screen.getByRole("button", { name: "Eliminar ruta" });
    expect(confirm).toHaveClass("bg-danger-solid");
    expect(confirm).not.toHaveClass("bg-accent");
  });

  it("'Eliminar ruta' llama a onConfirm y no a onCancel", async () => {
    const user = userEvent.setup();
    const { onConfirm, onCancel } = renderDialog();

    await user.click(screen.getByRole("button", { name: "Eliminar ruta" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("'Cancelar' llama a onCancel", async () => {
    const user = userEvent.setup();
    const { onCancel, onConfirm } = renderDialog();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("la X ('Cerrar diálogo') llama a onCancel", async () => {
    const user = userEvent.setup();
    const { onCancel } = renderDialog();

    await user.click(screen.getByRole("button", { name: "Cerrar diálogo" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("Esc llama a onCancel", () => {
    const { onCancel } = renderDialog();

    dispatchCancel(dialogElement());

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("click en el backdrop llama a onCancel", async () => {
    const user = userEvent.setup();
    const { onCancel } = renderDialog();

    await user.click(dialogElement());

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  describe("pendiente", () => {
    it("muestra 'Eliminando…' y deshabilita ambos botones", () => {
      renderDialog({ pending: true });

      const confirm = screen.getByRole("button", { name: "Eliminando…" });
      expect(confirm).toBeDisabled();
      expect(confirm).toHaveAttribute("aria-busy", "true");
      expect(confirm).toHaveClass("bg-danger-solid");
      expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
      expect(screen.queryByRole("button", { name: "Eliminar ruta" })).not.toBeInTheDocument();
    });

    it("X, Esc y backdrop no llaman a onCancel y el diálogo sigue abierto", async () => {
      const user = userEvent.setup();
      const { onCancel, onConfirm } = renderDialog({ pending: true });

      await user.click(screen.getByRole("button", { name: "Cerrar diálogo" }));
      dispatchCancel(dialogElement());
      await user.click(dialogElement());

      expect(onCancel).not.toHaveBeenCalled();
      expect(onConfirm).not.toHaveBeenCalled();
      expect(dialogElement().open).toBe(true);
    });
  });

  it("errorMessage se muestra como alerta dentro del diálogo, con los botones habilitados", () => {
    renderDialog({ errorMessage: "No se pudo eliminar la ruta. Inténtalo de nuevo." });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "No se pudo eliminar la ruta. Inténtalo de nuevo.",
    );
    expect(screen.getByRole("button", { name: "Eliminar ruta" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeEnabled();
  });
});
