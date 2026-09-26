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

  it("al hacer clic no pasa nada", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CompleteButton itemName={NAME} />);

    const button = screen.getByRole("button");
    await user.click(button);

    expect(button).toBeDisabled();
    expect(button).not.toHaveFocus();
  });
});
