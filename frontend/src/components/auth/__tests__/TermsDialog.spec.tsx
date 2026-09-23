import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  TERMS_CLOSING,
  TERMS_INTRO,
  TERMS_SECTIONS,
  TermsDialog,
  termsParagraphText,
} from "@/components/auth";
import { renderWithProviders } from "@/test/renderWithProviders";

const SCROLL_HINT = "Desplázate hasta el final para aceptar.";

const dialog = () => screen.getByRole("dialog", { name: "Términos y condiciones" });
const termsRegion = () =>
  screen.getByRole("region", { name: "Texto de los términos y condiciones" });
const acceptButton = () => screen.getByRole("button", { name: "Aceptar" });
const closeButton = () => screen.getByRole("button", { name: "Cerrar" });

// jsdom no tiene layout: se simulan las alturas del contenido y del contenedor.
function mockLayout(scrollHeight: number, clientHeight: number) {
  vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(scrollHeight);
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(clientHeight);
}

function mockOverflow() {
  mockLayout(1000, 300);
}

function scrollRegionTo(scrollTop: number) {
  const region = termsRegion();
  region.scrollTop = scrollTop;
  fireEvent.scroll(region);
}

// Mantiene el mismo TermsDialog montado y alterna `open` desde fuera (con fireEvent, sin foco).
function ToggleFixture() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen((prev) => !prev)}>
        Alternar
      </button>
      <TermsDialog open={open} onClose={() => undefined} onAccept={() => undefined} />
    </>
  );
}

function renderTerms(open = true) {
  const onClose = vi.fn();
  const onAccept = vi.fn();
  const view = renderWithProviders(
    <TermsDialog open={open} onClose={onClose} onAccept={onAccept} />,
  );
  return { ...view, onClose, onAccept };
}

describe("TermsDialog", () => {
  it("abierto: diálogo con nombre, región enfocable con el texto y botones", () => {
    renderTerms();

    expect(dialog()).toBeVisible();
    const region = termsRegion();
    expect(region).toHaveAttribute("tabIndex", "0");
    const paragraphs = [
      ...TERMS_INTRO,
      ...TERMS_SECTIONS.flatMap((section) => section.paragraphs),
      TERMS_CLOSING,
    ];
    for (const paragraph of paragraphs) {
      expect(region).toHaveTextContent(termsParagraphText(paragraph));
    }
    expect(closeButton()).toBeInTheDocument();
    expect(acceptButton()).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cerrar diálogo" })).toBeInTheDocument();
  });

  it("estructura del texto: una sección h3 por apartado, negritas como <strong> y separador", () => {
    renderTerms();

    const region = within(termsRegion());
    const headings = region.getAllByRole("heading", { level: 3 });
    expect(headings.map((heading) => heading.textContent)).toEqual(
      TERMS_SECTIONS.map((section) => section.heading),
    );
    expect(headings).toHaveLength(11);
    expect(region.getByText("Última actualización:").tagName).toBe("STRONG");
    expect(region.getByText("educativo y orientativo").tagName).toBe("STRONG");
    expect(region.getByText("contacto@devtallespaths.com").tagName).toBe("STRONG");
    expect(region.getByRole("separator")).toBeInTheDocument();
  });

  it("cerrado no muestra el diálogo", () => {
    renderTerms(false);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("con contenido largo: Aceptar deshabilitado, Cerrar habilitado y pista visible", () => {
    mockOverflow();
    renderTerms();

    expect(acceptButton()).toBeDisabled();
    expect(acceptButton()).toHaveAccessibleDescription(SCROLL_HINT);
    expect(closeButton()).toBeEnabled();
    expect(screen.getByText(SCROLL_HINT)).toBeInTheDocument();
  });

  it("scroll parcial mantiene Aceptar deshabilitado", () => {
    mockOverflow();
    renderTerms();

    scrollRegionTo(350);

    expect(acceptButton()).toBeDisabled();
  });

  it("scroll hasta el final habilita Aceptar, quita la pista y llama a onAccept", async () => {
    const user = userEvent.setup();
    mockOverflow();
    const { onAccept, onClose } = renderTerms();

    scrollRegionTo(700);

    expect(acceptButton()).toBeEnabled();
    expect(acceptButton()).not.toHaveAttribute("aria-describedby");
    expect(screen.queryByText(SCROLL_HINT)).not.toBeInTheDocument();

    await user.click(acceptButton());
    expect(onAccept).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("volver a subir mantiene Aceptar habilitado", () => {
    mockOverflow();
    renderTerms();

    scrollRegionTo(700);
    scrollRegionTo(0);

    expect(acceptButton()).toBeEnabled();
  });

  it("contenido sin overflow: Aceptar habilitado de inicio", () => {
    mockLayout(300, 300);
    renderTerms();

    expect(acceptButton()).toBeEnabled();
    expect(screen.queryByText(SCROLL_HINT)).not.toBeInTheDocument();
  });

  it("sin layout al montar (dialog aún sin mostrar), Aceptar sigue deshabilitado", () => {
    mockLayout(0, 0);
    renderTerms();

    expect(acceptButton()).toBeDisabled();
    expect(screen.getByText(SCROLL_HINT)).toBeInTheDocument();
  });

  it("Cerrar llama a onClose y no a onAccept", async () => {
    const user = userEvent.setup();
    const { onAccept, onClose } = renderTerms();

    await user.click(closeButton());

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onAccept).not.toHaveBeenCalled();
  });

  it("reapertura con contenido largo vuelve a deshabilitar Aceptar", () => {
    mockOverflow();
    renderWithProviders(<ToggleFixture />);
    fireEvent.click(screen.getByRole("button", { name: "Alternar" }));
    scrollRegionTo(700);
    expect(acceptButton()).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Alternar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Alternar" }));

    expect(acceptButton()).toBeDisabled();
  });
});
