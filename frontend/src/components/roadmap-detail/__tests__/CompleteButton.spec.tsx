import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CompleteButton } from "@/components/roadmap-detail";
import { renderWithProviders } from "@/test/renderWithProviders";

const NAME = "Introducción a React";

describe("CompleteButton", () => {
  it("es un botón habilitado por defecto nombrado con el ítem", () => {
    renderWithProviders(<CompleteButton itemName={NAME} onClick={vi.fn()} />);

    const button = screen.getByRole("button", { name: `Marcar como completado ${NAME}` });
    expect(button).toBeEnabled();
    expect(button).not.toHaveAttribute("aria-describedby");
    expect(button.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("disabled + describedBy: deshabilitado y descrito", () => {
    renderWithProviders(
      <>
        <p id="paused-description">Mientras esté pausada no se registra tu avance.</p>
        <CompleteButton
          itemName={NAME}
          describedBy="paused-description"
          disabled
          onClick={vi.fn()}
        />
      </>,
    );

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-describedby", "paused-description");
    expect(button).toHaveAccessibleDescription("Mientras esté pausada no se registra tu avance.");
  });

  it("sm (timeline, por defecto): 44px a ancho completo en móvil, 40px ajustado desde sm:", () => {
    renderWithProviders(<CompleteButton itemName={NAME} onClick={vi.fn()} />);

    const button = screen.getByRole("button", { name: `Marcar como completado ${NAME}` });
    expect(button).toHaveClass("text-sm", "h-11", "w-full", "sm:h-10", "sm:w-fit", "sm:px-4");
    for (const cls of ["h-10", "w-fit"]) expect(button).not.toHaveClass(cls);
  });

  it("md («Continúa aquí»): 48px a ancho completo en móvil, 44px ajustado desde sm:", () => {
    renderWithProviders(<CompleteButton itemName={NAME} size="md" onClick={vi.fn()} />);

    const button = screen.getByRole("button", { name: `Marcar como completado ${NAME}` });
    expect(button).toBeEnabled();
    expect(button).toHaveClass("text-sm", "h-12", "w-full", "sm:h-11", "sm:w-fit");
    for (const cls of ["h-11", "w-fit"]) expect(button).not.toHaveClass(cls);
  });

  it("al hacer clic llama a onClick una vez", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderWithProviders(<CompleteButton itemName={NAME} onClick={onClick} />);

    await user.click(screen.getByRole("button", { name: `Marcar como completado ${NAME}` }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("deshabilitado, el clic no llama a onClick", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderWithProviders(<CompleteButton itemName={NAME} onClick={onClick} disabled />);

    const button = screen.getByRole("button");
    await user.click(button);

    expect(button).toBeDisabled();
    expect(onClick).not.toHaveBeenCalled();
  });
});
