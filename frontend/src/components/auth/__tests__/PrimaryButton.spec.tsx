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

  it("sin tone, usa el acento (compatibilidad con los usos existentes)", () => {
    render(<PrimaryButton>Enviar</PrimaryButton>);

    const button = screen.getByRole("button", { name: "Enviar" });
    expect(button).toHaveClass("bg-accent", "shadow-primary", "focus-visible:border-accent-hover");
    expect(button).not.toHaveClass("bg-danger-solid");
  });

  it('con tone="danger", usa los tokens danger (rojo) en fondo, sombra y foco', () => {
    render(<PrimaryButton tone="danger">Eliminar ruta</PrimaryButton>);

    const button = screen.getByRole("button", { name: "Eliminar ruta" });
    expect(button).toHaveClass(
      "bg-danger-solid",
      "shadow-danger",
      "focus-visible:border-danger",
      "focus-visible:shadow-ring-danger",
    );
    expect(button).not.toHaveClass("bg-accent");
    expect(button).not.toHaveClass("shadow-primary");
  });

  it('con tone="danger" y loading, conserva el rojo y muestra el loadingLabel', () => {
    render(
      <PrimaryButton tone="danger" loading loadingLabel="Eliminando…">
        Eliminar ruta
      </PrimaryButton>,
    );

    const button = screen.getByRole("button", { name: "Eliminando…" });
    expect(button).toBeDisabled();
    expect(button).toHaveClass("bg-danger-solid");
  });
});
