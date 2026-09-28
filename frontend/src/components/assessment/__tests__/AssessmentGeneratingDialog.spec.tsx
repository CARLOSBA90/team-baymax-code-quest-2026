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
  announcement?: string;
}

function Harness({
  initialOpen = true,
  initialStage = SAVING,
  announcement = SAVING.announcement ?? "",
}: HarnessProps) {
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
      <AssessmentGeneratingDialog open={open} stage={stage} announcement={announcement} />
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
    expect(dialog).toHaveAccessibleDescription(
      `${ASSESSMENT_GENERATING_DESCRIPTION} ${SAVING.message}`,
    );
    expect(
      within(dialog).getByRole("heading", { name: ASSESSMENT_GENERATING_TITLE }),
    ).toBeVisible();
    expect(screen.getByTestId("assessment-generating-stage")).toHaveTextContent(SAVING.message);
  });

  it("la descripción encadena el párrafo de espera y el de la etapa, y ambos idrefs existen", () => {
    renderWithProviders(<Harness />);

    const ids = getDialog().getAttribute("aria-describedby")?.split(" ") ?? [];
    expect(ids).toHaveLength(2);
    const [description, stage] = ids.map((id) => document.getElementById(id));
    expect(description).toHaveTextContent(ASSESSMENT_GENERATING_DESCRIPTION);
    expect(stage).toBe(screen.getByTestId("assessment-generating-stage"));
    expect(stage).toHaveTextContent(SAVING.message);
  });

  it("al cambiar de etapa la descripción sigue apuntando al párrafo de la etapa visible", () => {
    renderWithProviders(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: "avanzar" }));

    expect(getDialog()).toHaveAccessibleDescription(
      `${ASSESSMENT_GENERATING_DESCRIPTION} ${BUILDING.message}`,
    );
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

    const dialog = getDialog();
    expect(dialog).toBeInTheDocument();
    expect(screen.queryByTestId("assessment-generating-panel")).not.toBeInTheDocument();
    // Sin etapa no hay párrafos que describir: nada de idrefs colgando de nodos inexistentes.
    expect(dialog).not.toHaveAttribute("aria-describedby");
    expect(dialog).toHaveAccessibleDescription("");
  });

  describe("live region de la espera", () => {
    it("vive dentro del <dialog>, donde no la alcanza la inertness del fondo", () => {
      renderWithProviders(<Harness />);

      const dialog = getDialog();
      const region = screen.getByTestId("assessment-generating-announcer");
      expect(dialog.contains(region)).toBe(true);
      expect(region).toHaveAttribute("aria-live", "polite");
      expect(region).toHaveAttribute("aria-atomic", "true");
      expect(region).toHaveClass("sr-only");
      // Sin `role`: no debe colisionar con los `getByRole("status")` de la página.
      expect(region).not.toHaveAttribute("role");
      expect(region).toHaveTextContent(SAVING.announcement ?? "");
    });

    it("está montada siempre que el diálogo está abierto, incluso sin etapa", () => {
      renderWithProviders(<Harness initialStage={null} announcement="" />);

      const region = screen.getByTestId("assessment-generating-announcer");
      expect(getDialog().contains(region)).toBe(true);
      expect(region).toBeEmptyDOMElement();
    });

    it("no forma parte del nombre ni de la descripción del diálogo", () => {
      renderWithProviders(<Harness />);

      const dialog = getDialog();
      expect(dialog).toHaveAccessibleName(ASSESSMENT_GENERATING_TITLE);
      expect(dialog).toHaveAccessibleDescription(
        `${ASSESSMENT_GENERATING_DESCRIPTION} ${SAVING.message}`,
      );
    });

    it("cerrado el diálogo no queda región (la monta y desmonta con él)", () => {
      renderWithProviders(<Harness initialOpen={false} />);

      expect(screen.queryByTestId("assessment-generating-announcer")).not.toBeInTheDocument();

      toggleOpen();

      expect(screen.getByTestId("assessment-generating-announcer")).toBeInTheDocument();
    });
  });
});
