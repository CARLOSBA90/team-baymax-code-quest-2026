import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PrimaryButton } from "@/components/auth";

describe("PrimaryButton", () => {
  it("sin variant, mantiene w-full (compatibilidad con los usos existentes)", () => {
    render(<PrimaryButton>Enviar</PrimaryButton>);

    const button = screen.getByRole("button", { name: "Enviar" });
    expect(button).toHaveClass("w-full");
    expect(button).not.toHaveClass("w-fit");
    expect(button).not.toHaveClass("px-6");
  });

  it('con variant="form" explícito, mantiene w-full', () => {
    render(<PrimaryButton variant="form">Enviar</PrimaryButton>);

    const button = screen.getByRole("button", { name: "Enviar" });
    expect(button).toHaveClass("w-full");
  });

  it('con variant="cta", usa w-fit y px-6, no w-full', () => {
    render(<PrimaryButton variant="cta">Crear mi primera ruta</PrimaryButton>);

    const button = screen.getByRole("button", { name: "Crear mi primera ruta" });
    expect(button).toHaveClass("w-fit");
    expect(button).toHaveClass("px-6");
    expect(button).not.toHaveClass("w-full");
  });
});
