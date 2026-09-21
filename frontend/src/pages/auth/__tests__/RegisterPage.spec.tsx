import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { signUpEmail } from "@/api/services";
import { AuthError } from "@/lib";
import { renderWithProviders } from "@/test/renderWithProviders";
import { RegisterPage } from "../RegisterPage";

vi.mock("@/api/services", () => ({
  signInEmail: vi.fn(),
  signInSocial: vi.fn(),
  signUpEmail: vi.fn(),
  signOut: vi.fn(),
}));

const nameInput = () => screen.getByLabelText("Nombre");
const emailInput = () => screen.getByLabelText("Email");
const passwordInput = () => screen.getByLabelText(/^contraseña$/i);
const confirmInput = () => screen.getByLabelText(/^confirmar contraseña$/i);
const termsCheckbox = () =>
  screen.getByRole("checkbox", { name: "Acepto los términos y condiciones" });
const submitButton = () => screen.getByRole("button", { name: "Crear cuenta" });

type User = ReturnType<typeof userEvent.setup>;

function renderRegister() {
  return renderWithProviders(
    <Routes>
      <Route path="/auth/register" element={<RegisterPage />} />
      <Route path="/auth/login" element={<div>Pantalla de login</div>} />
    </Routes>,
    { route: "/auth/register" },
  );
}

// Testing Library solo detecta fake timers de Jest (global `jest`); sin este stub su asyncWrapper
// (usado por user-event y findBy*) espera un setTimeout falso y se cuelga. unstubGlobals lo revierte.
function useFakeTimersForTestingLibrary() {
  vi.useFakeTimers();
  vi.stubGlobal("jest", { advanceTimersByTime: vi.advanceTimersByTime.bind(vi) });
}

// Vacía las promesas pendientes (mutación resuelta/rechazada) dentro de act.
async function flushPending() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
}

async function fillValid(user: User, overrides: { password?: string; confirm?: string } = {}) {
  await user.type(nameInput(), "Ada");
  await user.type(emailInput(), "ada@b.com");
  await user.type(passwordInput(), overrides.password ?? "Abcdef1!");
  await user.type(confirmInput(), overrides.confirm ?? overrides.password ?? "Abcdef1!");
  await user.click(termsCheckbox());
}

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.mocked(signUpEmail).mockReset().mockResolvedValue({ verificationUrl: null });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("render", () => {
    it("muestra todos los elementos con checkbox desmarcado y sin alert ni status", () => {
      renderRegister();

      expect(screen.getByRole("heading", { name: "Crea tu cuenta" })).toBeInTheDocument();
      expect(nameInput()).toBeInTheDocument();
      expect(emailInput()).toBeInTheDocument();
      expect(passwordInput()).toBeInTheDocument();
      expect(confirmInput()).toBeInTheDocument();
      expect(termsCheckbox()).not.toBeChecked();
      expect(submitButton()).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Ingresa con Discord" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "GitHub" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Google" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Inicia sesión" })).toHaveAttribute(
        "href",
        "/auth/login",
      );
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
  });

  describe("validación cliente", () => {
    it("formulario vacío muestra errores y no llama al servicio", async () => {
      const user = userEvent.setup();
      renderRegister();

      await user.click(submitButton());

      expect(screen.getByText("El nombre es obligatorio")).toBeInTheDocument();
      expect(screen.getByText("El email es obligatorio")).toBeInTheDocument();
      expect(screen.getByText("Mínimo 6 caracteres")).toBeInTheDocument();
      expect(screen.getByText("Confirma tu contraseña")).toBeInTheDocument();
      expect(screen.getByText("Debes aceptar los términos y condiciones")).toBeInTheDocument();
      expect(signUpEmail).not.toHaveBeenCalled();
    });

    it.each([
      ["abcdef1!", "Debe incluir una mayúscula"],
      ["ABCDEF1!", "Debe incluir una minúscula"],
      ["Abcdefg!", "Debe incluir un número"],
      ["Abcdefg1", "Debe incluir un carácter especial (!@#$%^&*)"],
    ])("contraseña %s muestra %s", async (password, message) => {
      const user = userEvent.setup();
      renderRegister();

      await fillValid(user, { password });
      await user.click(submitButton());

      expect(screen.getByText(message)).toBeInTheDocument();
      expect(signUpEmail).not.toHaveBeenCalled();
    });

    it("contraseñas distintas", async () => {
      const user = userEvent.setup();
      renderRegister();

      await fillValid(user, { confirm: "Otra1234!" });
      await user.click(submitButton());

      expect(screen.getByText("Las contraseñas no coinciden")).toBeInTheDocument();
      expect(signUpEmail).not.toHaveBeenCalled();
    });

    it("términos no aceptados marca aria-invalid", async () => {
      const user = userEvent.setup();
      renderRegister();

      await fillValid(user);
      await user.click(termsCheckbox());
      await user.click(submitButton());

      expect(screen.getByText("Debes aceptar los términos y condiciones")).toBeInTheDocument();
      expect(termsCheckbox()).toHaveAttribute("aria-invalid", "true");
    });

    it("limpia errores al editar nombre y al marcar términos", async () => {
      const user = userEvent.setup();
      renderRegister();

      await user.click(submitButton());
      await user.type(nameInput(), "A");
      await user.click(termsCheckbox());

      expect(screen.queryByText("El nombre es obligatorio")).not.toBeInTheDocument();
      expect(
        screen.queryByText("Debes aceptar los términos y condiciones"),
      ).not.toBeInTheDocument();
      expect(screen.getByText("El email es obligatorio")).toBeInTheDocument();
    });
  });

  describe("registro exitoso", () => {
    it("llama a signUpEmail solo con name, email y password", async () => {
      const user = userEvent.setup();
      renderRegister();

      await fillValid(user);
      await user.click(submitButton());

      expect(signUpEmail).toHaveBeenCalledTimes(1);
      expect(vi.mocked(signUpEmail).mock.calls[0]?.[0]).toEqual({
        name: "Ada",
        email: "ada@b.com",
        password: "Abcdef1!",
      });
    });

    it("muestra estado de carga", async () => {
      vi.mocked(signUpEmail).mockReturnValue(new Promise(() => undefined));
      const user = userEvent.setup();
      renderRegister();

      await fillValid(user);
      await user.click(submitButton());

      const busy = await screen.findByRole("button", { name: "Creando cuenta…" });
      expect(busy).toBeDisabled();
      expect(nameInput()).toBeDisabled();
      expect(emailInput()).toBeDisabled();
      expect(passwordInput()).toBeDisabled();
      expect(confirmInput()).toBeDisabled();
      expect(termsCheckbox()).toBeDisabled();
    });

    it("muestra aviso de éxito con enlace y bloquea el formulario", async () => {
      const user = userEvent.setup();
      renderRegister();

      await fillValid(user);
      await user.click(submitButton());

      const status = await screen.findByRole("status");
      expect(status).toHaveTextContent("¡Cuenta creada con éxito!");
      expect(screen.getByRole("link", { name: "Ir a iniciar sesión" })).toHaveAttribute(
        "href",
        "/auth/login",
      );
      expect(submitButton()).toBeDisabled();
      expect(nameInput()).toBeDisabled();
      expect(emailInput()).toBeDisabled();
      expect(passwordInput()).toBeDisabled();
      expect(confirmInput()).toBeDisabled();
      expect(termsCheckbox()).toBeDisabled();
    });
  });

  describe("redirección diferida", () => {
    it("navega a /auth/login a los 4000 ms exactos", async () => {
      useFakeTimersForTestingLibrary();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
      renderRegister();

      await fillValid(user);
      await user.click(submitButton());
      await flushPending();
      expect(screen.getByRole("status")).toBeInTheDocument();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(3999);
      });
      expect(screen.queryByText("Pantalla de login")).not.toBeInTheDocument();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1);
      });
      expect(screen.getByText("Pantalla de login")).toBeInTheDocument();
    });

    it("cancela el timer si se desmonta antes", async () => {
      useFakeTimersForTestingLibrary();
      const errorSpy = vi.spyOn(console, "error").mockReturnValue(undefined);
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
      const { unmount } = renderRegister();

      await fillValid(user);
      await user.click(submitButton());
      await flushPending();
      expect(screen.getByRole("status")).toBeInTheDocument();

      unmount();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(5000);
      });

      expect(screen.queryByText("Pantalla de login")).not.toBeInTheDocument();
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it("sin éxito no hay redirección", async () => {
      vi.mocked(signUpEmail).mockRejectedValue(
        new AuthError({ code: "USER_ALREADY_EXISTS", status: 422 }),
      );
      useFakeTimersForTestingLibrary();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
      renderRegister();

      await fillValid(user);
      await user.click(submitButton());
      await flushPending();
      expect(screen.getByRole("alert")).toBeInTheDocument();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(4000);
      });

      expect(screen.queryByText("Pantalla de login")).not.toBeInTheDocument();
      expect(submitButton()).toBeInTheDocument();
    });
  });

  describe("errores del servidor", () => {
    it("email existente: alert y formulario editable", async () => {
      vi.mocked(signUpEmail).mockRejectedValue(
        new AuthError({ code: "USER_ALREADY_EXISTS", status: 422 }),
      );
      const user = userEvent.setup();
      renderRegister();

      await fillValid(user);
      await user.click(submitButton());

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Ya existe una cuenta con este email.",
      );
      expect(nameInput()).toBeEnabled();
      expect(submitButton()).toBeEnabled();
    });

    it("el alert desaparece al escribir en un campo de texto", async () => {
      vi.mocked(signUpEmail).mockRejectedValue(
        new AuthError({ code: "USER_ALREADY_EXISTS", status: 422 }),
      );
      const user = userEvent.setup();
      renderRegister();

      await fillValid(user);
      await user.click(submitButton());
      await screen.findByRole("alert");
      await user.type(nameInput(), "x");

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("rate limit (429)", async () => {
      vi.mocked(signUpEmail).mockRejectedValue(new AuthError({ status: 429 }));
      const user = userEvent.setup();
      renderRegister();

      await fillValid(user);
      await user.click(submitButton());

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Demasiados intentos. Espera un momento e inténtalo de nuevo.",
      );
    });
  });
});
