import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { signInEmail, signInSocial } from "@/api/services";
import { AuthError } from "@/lib";
import { LoginPage } from "@/pages";
import { renderWithProviders } from "@/test/renderWithProviders";

vi.mock("@/api/services", () => ({
  signInEmail: vi.fn(),
  signInSocial: vi.fn(),
  signUpEmail: vi.fn(),
  signOut: vi.fn(),
}));

const NETWORK_MESSAGE =
  "No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.";

const emailInput = () => screen.getByLabelText("Email");
const passwordInput = () => screen.getByLabelText(/^contraseña$/i);
const submitButton = () => screen.getByRole("button", { name: "Entrar" });

function renderLogin(route = "/auth/login") {
  return renderWithProviders(<LoginPage />, { route });
}

describe("LoginPage", () => {
  beforeEach(() => {
    vi.mocked(signInEmail).mockReset().mockResolvedValue(undefined);
    vi.mocked(signInSocial).mockReset().mockResolvedValue(undefined);
  });

  describe("render", () => {
    it("muestra título, descripción, campos, botones y enlaces sin alertas", () => {
      renderLogin();

      expect(screen.getByRole("heading", { name: "Iniciar sesión" })).toBeInTheDocument();
      expect(screen.getByText("Entra con tu cuenta para retomar tu ruta.")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Ingresa con Discord" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "GitHub" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Google" })).toBeInTheDocument();
      expect(emailInput()).toBeInTheDocument();
      expect(passwordInput()).toBeInTheDocument();
      expect(submitButton()).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Regístrate" })).toHaveAttribute(
        "href",
        "/auth/register",
      );
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  describe("error OAuth por query param", () => {
    it("muestra aviso para access_denied", () => {
      renderLogin("/auth/login?error=access_denied");
      expect(screen.getByRole("alert")).toHaveTextContent("Cancelaste el inicio de sesión.");
    });

    it("muestra aviso genérico para otros errores", () => {
      renderLogin("/auth/login?error=server_error");
      expect(screen.getByRole("alert")).toHaveTextContent(
        "No se pudo iniciar sesión con el proveedor.",
      );
    });
  });

  describe("validación cliente", () => {
    it("formulario vacío muestra errores y no llama al servicio", async () => {
      const user = userEvent.setup();
      renderLogin();

      await user.click(submitButton());

      expect(screen.getByText("El email es obligatorio")).toBeInTheDocument();
      expect(screen.getByText("La contraseña es obligatoria")).toBeInTheDocument();
      expect(signInEmail).not.toHaveBeenCalled();
    });

    it("email inválido muestra error y no llama al servicio", async () => {
      const user = userEvent.setup();
      renderLogin();

      await user.type(emailInput(), "abc");
      await user.type(passwordInput(), "x");
      await user.click(submitButton());

      expect(screen.getByText("Email inválido")).toBeInTheDocument();
      expect(signInEmail).not.toHaveBeenCalled();
    });

    it("limpia el error del campo editado y conserva el otro", async () => {
      const user = userEvent.setup();
      renderLogin();

      await user.click(submitButton());
      await user.type(emailInput(), "a");

      expect(screen.queryByText("El email es obligatorio")).not.toBeInTheDocument();
      expect(screen.getByText("La contraseña es obligatoria")).toBeInTheDocument();
    });
  });

  describe("envío", () => {
    it("llama a signInEmail con email y contraseña", async () => {
      const user = userEvent.setup();
      renderLogin();

      await user.type(emailInput(), "a@b.com");
      await user.type(passwordInput(), "secret");
      await user.click(submitButton());

      expect(signInEmail).toHaveBeenCalledTimes(1);
      expect(vi.mocked(signInEmail).mock.calls[0]?.[0]).toEqual({
        email: "a@b.com",
        password: "secret",
      });
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("muestra estado de carga con botón y campos deshabilitados", async () => {
      vi.mocked(signInEmail).mockReturnValue(new Promise<void>(() => undefined));
      const user = userEvent.setup();
      renderLogin();

      await user.type(emailInput(), "a@b.com");
      await user.type(passwordInput(), "secret");
      await user.click(submitButton());

      const busy = await screen.findByRole("button", { name: "Entrando…" });
      expect(busy).toBeDisabled();
      expect(busy).toHaveAttribute("aria-busy", "true");
      expect(emailInput()).toBeDisabled();
      expect(passwordInput()).toBeDisabled();
    });
  });

  describe("errores del servidor", () => {
    async function submitValid(user: ReturnType<typeof userEvent.setup>) {
      await user.type(emailInput(), "a@b.com");
      await user.type(passwordInput(), "secret");
      await user.click(submitButton());
    }

    it("credenciales inválidas", async () => {
      vi.mocked(signInEmail).mockRejectedValue(
        new AuthError({ code: "INVALID_EMAIL_OR_PASSWORD", status: 401 }),
      );
      const user = userEvent.setup();
      renderLogin();

      await submitValid(user);

      expect(await screen.findByRole("alert")).toHaveTextContent("Email o contraseña incorrectos.");
    });

    it("error de red", async () => {
      vi.mocked(signInEmail).mockRejectedValue(new TypeError("Failed to fetch"));
      const user = userEvent.setup();
      renderLogin();

      await submitValid(user);

      expect(await screen.findByRole("alert")).toHaveTextContent(NETWORK_MESSAGE);
    });

    it("el alert desaparece al editar un campo", async () => {
      vi.mocked(signInEmail).mockRejectedValue(
        new AuthError({ code: "INVALID_EMAIL_OR_PASSWORD", status: 401 }),
      );
      const user = userEvent.setup();
      renderLogin();

      await submitValid(user);
      await screen.findByRole("alert");
      await user.type(emailInput(), "x");

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  describe("inicio de sesión social", () => {
    it("click en GitHub llama signInSocial('github')", async () => {
      const user = userEvent.setup();
      renderLogin();

      await user.click(screen.getByRole("button", { name: "GitHub" }));

      expect(signInSocial).toHaveBeenCalledTimes(1);
      expect(vi.mocked(signInSocial).mock.calls[0]?.[0]).toBe("github");
    });

    it("click en Discord y Google usan su proveedor", async () => {
      const user = userEvent.setup();
      renderLogin();

      await user.click(screen.getByRole("button", { name: "Ingresa con Discord" }));
      await user.click(screen.getByRole("button", { name: "Google" }));

      expect(vi.mocked(signInSocial).mock.calls.map((call) => call[0])).toEqual([
        "discord",
        "google",
      ]);
    });

    it("deshabilita los tres botones mientras está pendiente y marca busy solo el pulsado", async () => {
      vi.mocked(signInSocial).mockReturnValue(new Promise<void>(() => undefined));
      const user = userEvent.setup();
      renderLogin();

      await user.click(screen.getByRole("button", { name: "Google" }));

      const google = await screen.findByRole("button", { name: "Google" });
      const github = screen.getByRole("button", { name: "GitHub" });
      const discord = screen.getByRole("button", { name: "Ingresa con Discord" });
      expect(google).toBeDisabled();
      expect(github).toBeDisabled();
      expect(discord).toBeDisabled();
      expect(google).toHaveAttribute("aria-busy", "true");
      expect(github).toHaveAttribute("aria-busy", "false");
      expect(discord).toHaveAttribute("aria-busy", "false");
    });

    it("muestra alert si falla el proveedor", async () => {
      vi.mocked(signInSocial).mockRejectedValue(
        new AuthError({ code: "PROVIDER_NOT_FOUND", status: 404 }),
      );
      const user = userEvent.setup();
      renderLogin();

      await user.click(screen.getByRole("button", { name: "GitHub" }));

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Este proveedor no está disponible por ahora.",
      );
    });
  });
});
