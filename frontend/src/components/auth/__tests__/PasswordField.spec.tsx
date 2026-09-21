import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { PasswordField, type PasswordFieldProps } from "../PasswordField";

function renderField(props: Partial<PasswordFieldProps> = {}) {
  return render(<PasswordField id="password" name="password" label="Contraseña" {...props} />);
}

const input = () => screen.getByLabelText(/^contraseña$/i);
const toggle = () => screen.getByRole("button", { name: /(mostrar|ocultar) contraseña/i });

describe("PasswordField", () => {
  it("renderiza el label asociado y el input como password oculto", () => {
    renderField();

    expect(input()).toHaveAttribute("type", "password");
    expect(input()).toHaveAttribute("name", "password");
    expect(toggle()).toHaveAccessibleName("Mostrar contraseña");
    expect(toggle()).toHaveAttribute("aria-pressed", "false");
  });

  it("alterna la visibilidad al pulsar el botón", async () => {
    const user = userEvent.setup();
    renderField();

    await user.click(toggle());
    expect(input()).toHaveAttribute("type", "text");
    expect(toggle()).toHaveAccessibleName("Ocultar contraseña");
    expect(toggle()).toHaveAttribute("aria-pressed", "true");

    await user.click(toggle());
    expect(input()).toHaveAttribute("type", "password");
    expect(toggle()).toHaveAccessibleName("Mostrar contraseña");
    expect(toggle()).toHaveAttribute("aria-pressed", "false");
  });

  it("el botón es type=button y no envía el formulario", async () => {
    const user = userEvent.setup();
    let submitted = false;
    render(
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitted = true;
        }}
      >
        <PasswordField id="password" name="password" label="Contraseña" />
      </form>,
    );

    expect(toggle()).toHaveAttribute("type", "button");
    await user.click(toggle());
    expect(submitted).toBe(false);
  });

  it("sin error no marca aria-invalid ni aria-describedby ni muestra mensaje", () => {
    renderField();

    expect(input()).not.toHaveAttribute("aria-invalid");
    expect(input()).not.toHaveAttribute("aria-describedby");
    expect(screen.queryByText(/obligatoria/i)).not.toBeInTheDocument();
  });

  it("con error marca aria-invalid, enlaza aria-describedby y muestra el mensaje", () => {
    renderField({ error: "La contraseña es obligatoria" });

    expect(input()).toHaveAttribute("aria-invalid", "true");
    expect(input()).toHaveAttribute("aria-describedby", "password-error");
    expect(input()).toHaveAccessibleDescription("La contraseña es obligatoria");
    expect(screen.getByText("La contraseña es obligatoria")).toHaveAttribute(
      "id",
      "password-error",
    );
  });

  it("muestra el enlace de recuperación solo con showForgotPassword", () => {
    const { unmount } = renderField();
    expect(screen.queryByRole("link", { name: /olvidaste/i })).not.toBeInTheDocument();
    unmount();

    renderField({ showForgotPassword: true });
    expect(screen.getByRole("link", { name: /olvidaste/i })).toHaveAttribute(
      "href",
      "/auth/forgot-password",
    );
  });

  it("deshabilita input y botón con disabled", () => {
    renderField({ disabled: true });

    expect(input()).toBeDisabled();
    expect(toggle()).toBeDisabled();
  });

  it("propaga autoComplete y props extra al input", () => {
    renderField({ autoComplete: "new-password", placeholder: "••••••••", className: "extra" });

    expect(input()).toHaveAttribute("autocomplete", "new-password");
    expect(input()).toHaveAttribute("placeholder", "••••••••");
    expect(input()).toHaveClass("extra");
  });
});
