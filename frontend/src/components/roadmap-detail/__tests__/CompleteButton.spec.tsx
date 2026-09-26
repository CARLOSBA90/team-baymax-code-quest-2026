import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CompleteButton } from "@/components/roadmap-detail";
import { renderWithProviders } from "@/test/renderWithProviders";

const NAME = "Introducción a React";

describe("CompleteButton", () => {
  it("es un botón deshabilitado nombrado con el ítem", () => {
    renderWithProviders(<CompleteButton itemName={NAME} />);

    const button = screen.getByRole("button", { name: `Marcar como completado ${NAME}` });
    expect(button).toBeDisabled();
    expect(button).not.toHaveAttribute("aria-describedby");
    expect(button.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("enlaza la descripción si se pasa", () => {
    renderWithProviders(
      <>
        <p id="paused-description">Mientras esté pausada no se registra tu avance.</p>
        <CompleteButton itemName={NAME} describedBy="paused-description" />
      </>,
    );

    expect(screen.getByRole("button")).toHaveAccessibleDescription(
      "Mientras esté pausada no se registra tu avance.",
    );
  });

  it("sm (timeline, por defecto): 44px a ancho completo en móvil, 40px ajustado desde sm:", () => {
    renderWithProviders(<CompleteButton itemName={NAME} />);

    const button = screen.getByRole("button", { name: `Marcar como completado ${NAME}` });
    expect(button).toHaveClass("text-sm", "h-11", "w-full", "sm:h-10", "sm:w-fit", "sm:px-4");
    for (const cls of ["h-10", "w-fit"]) expect(button).not.toHaveClass(cls);
  });

  it("md («Continúa aquí»): 48px a ancho completo en móvil, 44px ajustado desde sm:", () => {
    renderWithProviders(<CompleteButton itemName={NAME} size="md" />);

    const button = screen.getByRole("button", { name: `Marcar como completado ${NAME}` });
    expect(button).toBeDisabled();
    expect(button).toHaveClass("text-sm", "h-12", "w-full", "sm:h-11", "sm:w-fit");
    for (const cls of ["h-11", "w-fit"]) expect(button).not.toHaveClass(cls);
  });

  it("al hacer clic no pasa nada", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CompleteButton itemName={NAME} />);

    const button = screen.getByRole("button");
    await user.click(button);

    expect(button).toBeDisabled();
    expect(button).not.toHaveFocus();
  });
});
