import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { GhostButton } from "@/components/ui";
import { renderWithProviders } from "@/test/renderWithProviders";

describe("GhostButton", () => {
  it('usa type="button" por defecto', () => {
    renderWithProviders(<GhostButton>Salir</GhostButton>);
    expect(screen.getByRole("button", { name: "Salir" })).toHaveAttribute("type", "button");
  });

  it("respeta un type explícito", () => {
    renderWithProviders(<GhostButton type="submit">Enviar</GhostButton>);
    expect(screen.getByRole("button", { name: "Enviar" })).toHaveAttribute("type", "submit");
  });

  it("llama a onClick al hacer clic", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderWithProviders(<GhostButton onClick={onClick}>Anterior</GhostButton>);

    await user.click(screen.getByRole("button", { name: "Anterior" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("disabled bloquea onClick", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderWithProviders(
      <GhostButton disabled onClick={onClick}>
        Anterior
      </GhostButton>,
    );

    const button = screen.getByRole("button", { name: "Anterior" });
    expect(button).toBeDisabled();
    await user.click(button);

    expect(onClick).not.toHaveBeenCalled();
  });

  it("usa el tamaño md por defecto", () => {
    renderWithProviders(<GhostButton>Anterior</GhostButton>);
    const button = screen.getByRole("button", { name: "Anterior" });
    expect(button).toHaveClass("h-11", "px-5");
    expect(button).not.toHaveClass("h-10");
  });

  it('aplica h-10 con size="sm"', () => {
    renderWithProviders(<GhostButton size="sm">Salir</GhostButton>);
    const button = screen.getByRole("button", { name: "Salir" });
    expect(button).toHaveClass("h-10", "px-4");
    expect(button).not.toHaveClass("h-11");
  });

  it('aplica h-11 con size="md"', () => {
    renderWithProviders(<GhostButton size="md">Anterior</GhostButton>);
    expect(screen.getByRole("button", { name: "Anterior" })).toHaveClass("h-11", "px-5");
  });

  it('aplica h-12 con size="lg"', () => {
    renderWithProviders(<GhostButton size="lg">Continuar</GhostButton>);
    const button = screen.getByRole("button", { name: "Continuar" });
    expect(button).toHaveClass("h-12", "px-5");
    expect(button).not.toHaveClass("h-11", "h-10");
  });

  it("añade className a las clases base", () => {
    renderWithProviders(<GhostButton className="w-full">Salir</GhostButton>);
    const button = screen.getByRole("button", { name: "Salir" });
    expect(button).toHaveClass("w-full", "border-border-ghost");
  });
});
