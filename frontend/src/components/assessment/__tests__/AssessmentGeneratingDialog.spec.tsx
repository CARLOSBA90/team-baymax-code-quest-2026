import { act, fireEvent, screen, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { AssessmentGeneratingDialog, MAX_GENERATING_REOPENS } from "@/components/assessment";
import {
  ASSESSMENT_GENERATING_DESCRIPTION,
  ASSESSMENT_GENERATING_STAGES,
  ASSESSMENT_GENERATING_TITLE,
  type AssessmentGeneratingStage,
} from "@/lib";
import { renderWithProviders } from "@/test/renderWithProviders";

const [SAVING, , BUILDING] = ASSESSMENT_GENERATING_STAGES;

const SCROLL_LOCK = "overflow-hidden";

interface HarnessProps {
  initialOpen?: boolean;
  initialStage?: AssessmentGeneratingStage | null;
}

function Harness({ initialOpen = true, initialStage = SAVING }: HarnessProps) {
  const [open, setOpen] = useState(initialOpen);
  const [stage, setStage] = useState<AssessmentGeneratingStage | null>(initialStage);

  return (
    <>
      <button type="button" onClick={() => setOpen((value) => !value)}>
        alternar
      </button>
      <button type="button" onClick={() => setStage(BUILDING)}>
        avanzar
      </button>
      <AssessmentGeneratingDialog open={open} stage={stage} />
    </>
  );
}

function getDialog() {
  return screen.getByRole("dialog");
}

function closeNatively() {
  const dialog = getDialog() as HTMLDialogElement;
  act(() => {
    dialog.close();
  });
}

function toggleOpen() {
  fireEvent.click(screen.getByRole("button", { name: "alternar" }));
}

describe("AssessmentGeneratingDialog", () => {
  it("cerrado: no hay diálogo ni bloqueo de scroll", () => {
    expect(document.documentElement).not.toHaveClass(SCROLL_LOCK);

    renderWithProviders(<Harness initialOpen={false} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.documentElement).not.toHaveClass(SCROLL_LOCK);
  });

  it("abierto: se nombra con el encabezado, se describe con el texto de espera y muestra la etapa", () => {
    renderWithProviders(<Harness />);

    const dialog = screen.getByRole("dialog", { name: ASSESSMENT_GENERATING_TITLE });
    expect(dialog).toHaveAccessibleName(ASSESSMENT_GENERATING_TITLE);
    expect(dialog).toHaveAccessibleDescription(ASSESSMENT_GENERATING_DESCRIPTION);
    expect(
      within(dialog).getByRole("heading", { name: ASSESSMENT_GENERATING_TITLE }),
    ).toBeVisible();
    expect(screen.getByTestId("assessment-generating-stage")).toHaveTextContent(SAVING.message);
  });

  it("abierto: bloquea el scroll de la página", () => {
    renderWithProviders(<Harness />);

    expect(document.documentElement).toHaveClass(SCROLL_LOCK);
  });

  it("el panel es enfocable programáticamente", () => {
    renderWithProviders(<Harness />);

    expect(screen.getByTestId("assessment-generating-panel")).toHaveAttribute("tabindex", "-1");
  });

  it("el spinner es decorativo y respeta «reducir movimiento»", () => {
    renderWithProviders(<Harness />);

    const spinner = screen.getByTestId("assessment-generating-spinner");
    expect(spinner).toHaveAttribute("aria-hidden", "true");
    expect(spinner).toHaveClass("animate-spin");
    expect(spinner).toHaveClass("motion-reduce:animate-none");
    expect(spinner.parentElement).toHaveAttribute("aria-hidden", "true");
  });

  it("no ofrece ninguna salida: sin botones dentro del diálogo", () => {
    renderWithProviders(<Harness />);

    const dialog = getDialog();
    expect(within(dialog).queryAllByRole("button")).toEqual([]);
    expect(
      within(dialog).queryByRole("button", { name: "Cerrar diálogo" }),
    ).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Cancelar" })).not.toBeInTheDocument();
  });

  it("Esc no cierra ni gasta cota", () => {
    renderWithProviders(<Harness />);
    const panel = screen.getByTestId("assessment-generating-panel");

    fireEvent(getDialog(), new Event("cancel", { cancelable: true }));

    expect(getDialog()).toBeInTheDocument();
    expect(document.documentElement).toHaveClass(SCROLL_LOCK);
    expect(screen.getByTestId("assessment-generating-panel")).toBe(panel);
  });

  it("el click en el backdrop no cierra", () => {
    renderWithProviders(<Harness />);
    const panel = screen.getByTestId("assessment-generating-panel");

    const dialog = getDialog();
    fireEvent.mouseDown(dialog);
    fireEvent.click(dialog);

    expect(getDialog()).toBeInTheDocument();
    expect(screen.getByTestId("assessment-generating-panel")).toBe(panel);
  });

  it("un cierre nativo restablece la espera", () => {
    renderWithProviders(<Harness />);
    const panel = screen.getByTestId("assessment-generating-panel");

    closeNatively();

    expect(getDialog()).toBeInTheDocument();
    expect(document.documentElement).toHaveClass(SCROLL_LOCK);
    expect(screen.getByTestId("assessment-generating-panel")).not.toBe(panel);
  });

  it("superada la cota deja de reabrir y libera el bloqueo de scroll", () => {
    renderWithProviders(<Harness />);

    for (let i = 0; i < MAX_GENERATING_REOPENS; i += 1) {
      closeNatively();
      expect(getDialog()).toBeInTheDocument();
    }
    closeNatively();

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.documentElement).not.toHaveClass(SCROLL_LOCK);
  });

  it("la cota se reinicia en el envío siguiente", () => {
    renderWithProviders(<Harness />);

    for (let i = 0; i <= MAX_GENERATING_REOPENS; i += 1) {
      closeNatively();
    }
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    toggleOpen();
    toggleOpen();

    expect(getDialog()).toBeInTheDocument();
    expect(document.documentElement).toHaveClass(SCROLL_LOCK);

    closeNatively();

    expect(getDialog()).toBeInTheDocument();
    expect(document.documentElement).toHaveClass(SCROLL_LOCK);
  });

  it("cambiar de etapa cambia el texto sin remontar el panel", () => {
    renderWithProviders(<Harness />);
    const panel = screen.getByTestId("assessment-generating-panel");

    fireEvent.click(screen.getByRole("button", { name: "avanzar" }));

    expect(screen.getByTestId("assessment-generating-stage")).toHaveTextContent(BUILDING.message);
    expect(screen.getByTestId("assessment-generating-panel")).toBe(panel);
  });

  it("abierto sin etapa: el diálogo existe pero no pinta el panel", () => {
    renderWithProviders(<Harness initialStage={null} />);

    expect(getDialog()).toBeInTheDocument();
    expect(screen.queryByTestId("assessment-generating-panel")).not.toBeInTheDocument();
  });
});
