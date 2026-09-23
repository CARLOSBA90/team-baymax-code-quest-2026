import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AssessmentNav, type AssessmentNavProps } from "@/components/assessment";
import { renderWithProviders } from "@/test/renderWithProviders";

const CTA = "Descubrir mi ruta de aprendizaje";

function renderNav(props: Partial<AssessmentNavProps> = {}) {
  const handlers = { onPrev: vi.fn(), onNext: vi.fn(), onSubmit: vi.fn() };
  renderWithProviders(
    <AssessmentNav isFirst={false} isLast={false} canGoNext {...handlers} {...props} />,
  );
  return handlers;
}

describe("AssessmentNav", () => {
  it("en la primera pregunta sin respuesta, Anterior y Siguiente están deshabilitados", () => {
    renderNav({ isFirst: true, canGoNext: false });

    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeDisabled();
  });

  it("Anterior habilitado fuera de la primera pregunta llama a onPrev", async () => {
    const user = userEvent.setup();
    const { onPrev } = renderNav({ canGoNext: false });

    const prev = screen.getByRole("button", { name: "Anterior" });
    expect(prev).toBeEnabled();
    await user.click(prev);

    expect(onPrev).toHaveBeenCalledTimes(1);
  });

  it("Siguiente deshabilitado sin respuesta no llama a onNext", async () => {
    const user = userEvent.setup();
    const { onNext } = renderNav({ canGoNext: false });

    const next = screen.getByRole("button", { name: "Siguiente" });
    expect(next).toBeDisabled();
    await user.click(next);

    expect(onNext).not.toHaveBeenCalled();
  });

  it("Siguiente habilitado con respuesta llama a onNext", async () => {
    const user = userEvent.setup();
    const { onNext, onSubmit } = renderNav();

    await user.click(screen.getByRole("button", { name: "Siguiente" }));

    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("en la última pregunta no existe Siguiente y el CTA llama a onSubmit", async () => {
    const user = userEvent.setup();
    const { onNext, onSubmit } = renderNav({ isLast: true });

    expect(screen.queryByRole("button", { name: "Siguiente" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: CTA }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onNext).not.toHaveBeenCalled();
  });

  it("el CTA final está deshabilitado sin respuesta en la última pregunta", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderNav({ isLast: true, canGoNext: false });

    const cta = screen.getByRole("button", { name: CTA });
    expect(cta).toBeDisabled();
    await user.click(cta);

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("con una sola pregunta, Anterior está deshabilitado y el principal es el CTA final", () => {
    renderNav({ isFirst: true, isLast: true });

    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
    expect(screen.getByRole("button", { name: CTA })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Siguiente" })).not.toBeInTheDocument();
  });

  it("con isSubmitting el CTA lleva aria-busy y está deshabilitado", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderNav({ isLast: true, isSubmitting: true });

    const cta = screen.getByRole("button", { name: "Enviando…" });
    expect(cta).toHaveAttribute("aria-busy", "true");
    expect(cta).toBeDisabled();
    await user.click(cta);

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("los iconos de los botones son decorativos", () => {
    renderNav();

    for (const button of screen.getAllByRole("button")) {
      for (const svg of button.querySelectorAll("svg")) {
        expect(svg).toHaveAttribute("aria-hidden", "true");
      }
    }
  });
});
