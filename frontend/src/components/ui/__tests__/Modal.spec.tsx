import { act, fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type PropsWithChildren, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Modal, type ModalProps } from "@/components/ui";
import { renderWithProviders } from "@/test/renderWithProviders";

// Modal controlado por props, para los escenarios que no necesitan cambiar `open`.
function Fixture({
  open = false,
  onClose = () => undefined,
  children = <p>Contenido del modal</p>,
  ...rest
}: PropsWithChildren<Partial<ModalProps>>) {
  return (
    <Modal open={open} onClose={onClose} aria-label="Diálogo de prueba" {...rest}>
      {children}
    </Modal>
  );
}

interface StatefulFixtureProps {
  onClose: () => void;
  /** Si es true, onClose también cierra (consumidor que obedece la petición). */
  closeOnRequest?: boolean;
}

// Modal con estado propio: el disparador abre, "Cerrar desde fuera" cierra sin pasar por onClose
// y "Quitar disparador" lo desmonta. Los botones externos se pulsan con fireEvent para no mover
// el foco.
function StatefulFixture({ onClose, closeOnRequest = false }: StatefulFixtureProps) {
  const [open, setOpen] = useState(false);
  const [showTrigger, setShowTrigger] = useState(true);
  return (
    <>
      {showTrigger && (
        <button type="button" onClick={() => setOpen(true)}>
          Disparador
        </button>
      )}
      <button type="button" onClick={() => setOpen(false)}>
        Cerrar desde fuera
      </button>
      <button type="button" onClick={() => setShowTrigger(false)}>
        Quitar disparador
      </button>
      <Modal
        open={open}
        aria-label="Diálogo de prueba"
        onClose={() => {
          onClose();
          if (closeOnRequest) setOpen(false);
        }}
      >
        <p>Contenido del modal</p>
      </Modal>
    </>
  );
}

const triggerButton = () => screen.getByRole("button", { name: "Disparador" });
const dialogElement = () => document.querySelector("dialog") as HTMLDialogElement;
const closeButton = () => screen.getByRole("button", { name: "Cerrar diálogo" });

function dispatchCancel(dialog: HTMLDialogElement) {
  const event = new Event("cancel", { cancelable: true });
  fireEvent(dialog, event);
  return event;
}

describe("Modal", () => {
  afterEach(() => {
    document.documentElement.classList.remove("overflow-hidden");
  });

  describe("modal controlado", () => {
    it("cerrado no muestra el diálogo ni monta los children", () => {
      renderWithProviders(<Fixture />);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(screen.queryByText("Contenido del modal")).not.toBeInTheDocument();
      expect(dialogElement().open).toBe(false);
    });

    it("abierto llama a showModal, muestra children, enfoca la X y bloquea el scroll", () => {
      const showModal = vi.spyOn(HTMLDialogElement.prototype, "showModal");
      renderWithProviders(<Fixture open />);

      expect(showModal).toHaveBeenCalledTimes(1);
      const dialog = screen.getByRole("dialog", { name: "Diálogo de prueba" });
      expect(dialog).toBeVisible();
      expect(screen.getByText("Contenido del modal")).toBeInTheDocument();
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
      expect(closeButton()).toHaveFocus();
      expect(document.documentElement).toHaveClass("overflow-hidden");
    });

    it("abre desde el disparador y cierra cuando el consumidor cambia open", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      renderWithProviders(<StatefulFixture onClose={onClose} closeOnRequest />);

      await user.click(triggerButton());
      expect(screen.getByRole("dialog")).toBeVisible();

      await user.click(closeButton());
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(triggerButton()).toHaveFocus();
    });

    it("cerrar desde el consumidor cierra el dialog, no llama a onClose y devuelve el foco", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      renderWithProviders(<StatefulFixture onClose={onClose} />);

      await user.click(triggerButton());
      expect(dialogElement().open).toBe(true);
      expect(closeButton()).toHaveFocus();

      fireEvent.click(screen.getByRole("button", { name: "Cerrar desde fuera" }));

      expect(dialogElement().open).toBe(false);
      expect(onClose).not.toHaveBeenCalled();
      expect(triggerButton()).toHaveFocus();
      expect(document.documentElement).not.toHaveClass("overflow-hidden");
    });

    it("desmontar abierto quita el bloqueo del scroll", () => {
      const { unmount } = renderWithProviders(<Fixture open />);
      expect(document.documentElement).toHaveClass("overflow-hidden");

      unmount();

      expect(document.documentElement).not.toHaveClass("overflow-hidden");
    });

    it("si el disparador ya no está en el DOM al cerrar, no lanza", async () => {
      const user = userEvent.setup();
      renderWithProviders(<StatefulFixture onClose={() => undefined} />);
      await user.click(triggerButton());
      fireEvent.click(screen.getByRole("button", { name: "Quitar disparador" }));

      expect(() =>
        fireEvent.click(screen.getByRole("button", { name: "Cerrar desde fuera" })),
      ).not.toThrow();
      expect(dialogElement().open).toBe(false);
      expect(screen.queryByRole("button", { name: "Disparador" })).not.toBeInTheDocument();
    });

    it("si el navegador cierra el dialog con open=true, llama a onClose", () => {
      const onClose = vi.fn();
      renderWithProviders(<Fixture open onClose={onClose} />);

      act(() => dialogElement().close());

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("tras un cierre nativo, al cambiar open a false quita el bloqueo y devuelve el foco", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      renderWithProviders(<StatefulFixture onClose={onClose} closeOnRequest />);
      await user.click(triggerButton());
      expect(document.documentElement).toHaveClass("overflow-hidden");

      act(() => dialogElement().close());

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(document.documentElement).not.toHaveClass("overflow-hidden");
      expect(triggerButton()).toHaveFocus();
    });
  });

  describe("contenido libre como children", () => {
    it("sin heading propio: solo el párrafo y la X", () => {
      renderWithProviders(<Fixture open />);

      expect(screen.queryByRole("heading")).not.toBeInTheDocument();
      expect(within(dialogElement()).getAllByRole("button")).toEqual([closeButton()]);
    });

    it('un botón "Cerrar" del consumidor no colisiona con la X', () => {
      renderWithProviders(
        <Fixture open>
          <button type="button">Cerrar</button>
        </Fixture>,
      );

      const consumerClose = screen.getByRole("button", { name: "Cerrar" });
      expect(consumerClose).not.toBe(closeButton());
    });
  });

  describe("botón de cierre X", () => {
    it("es el primer enfocable y va antes de los children", () => {
      renderWithProviders(
        <Fixture open>
          <button type="button">Acción</button>
        </Fixture>,
      );

      const x = closeButton();
      const action = screen.getByRole("button", { name: "Acción" });
      expect(x.compareDocumentPosition(action) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(x).toHaveAttribute("type", "button");
    });

    it.each([
      ["click", async (user: ReturnType<typeof userEvent.setup>) => user.click(closeButton())],
      [
        "Enter",
        async (user: ReturnType<typeof userEvent.setup>) => {
          closeButton().focus();
          await user.keyboard("{Enter}");
        },
      ],
      [
        "Space",
        async (user: ReturnType<typeof userEvent.setup>) => {
          closeButton().focus();
          await user.keyboard(" ");
        },
      ],
    ])("%s en la X llama a onClose una vez", async (_label, activate) => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      renderWithProviders(<Fixture open onClose={onClose} />);

      await activate(user);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("acepta un closeLabel personalizado", () => {
      renderWithProviders(<Fixture open closeLabel="Cerrar términos" />);

      expect(screen.getByRole("button", { name: "Cerrar términos" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Cerrar diálogo" })).not.toBeInTheDocument();
    });
  });

  describe("cierre con Esc", () => {
    it("llama a onClose una vez y previene el cierre nativo", () => {
      const onClose = vi.fn();
      renderWithProviders(<Fixture open onClose={onClose} />);

      const event = dispatchCancel(dialogElement());

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(event.defaultPrevented).toBe(true);
    });

    it("si el consumidor no cambia open, el diálogo sigue abierto", () => {
      const onClose = vi.fn();
      renderWithProviders(<StatefulFixture onClose={onClose} />);
      fireEvent.click(triggerButton());

      dispatchCancel(dialogElement());

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(dialogElement().open).toBe(true);
      expect(screen.getByRole("dialog")).toBeVisible();
    });
  });

  describe("cierre con click en el backdrop", () => {
    it("click en el backdrop llama a onClose", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      renderWithProviders(<Fixture open onClose={onClose} />);

      await user.click(dialogElement());

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("click en el contenido no cierra", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      renderWithProviders(<Fixture open onClose={onClose} />);

      await user.click(screen.getByText("Contenido del modal"));

      expect(onClose).not.toHaveBeenCalled();
    });

    it("mousedown dentro y click en el backdrop no cierra", () => {
      const onClose = vi.fn();
      renderWithProviders(<Fixture open onClose={onClose} />);

      fireEvent.mouseDown(screen.getByText("Contenido del modal"));
      fireEvent.click(dialogElement());

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe("nombre accesible del diálogo", () => {
    it("usa aria-labelledby", () => {
      renderWithProviders(
        <Fixture open aria-label={undefined} aria-labelledby="titulo" aria-describedby="desc">
          <h2 id="titulo">Título externo</h2>
          <p id="desc">Descripción</p>
        </Fixture>,
      );

      const dialog = screen.getByRole("dialog", { name: "Título externo" });
      expect(dialog).toHaveAccessibleDescription("Descripción");
    });

    it("usa aria-label", () => {
      renderWithProviders(<Fixture open aria-label="Etiqueta directa" />);

      expect(screen.getByRole("dialog", { name: "Etiqueta directa" })).toBeInTheDocument();
    });
  });
});
