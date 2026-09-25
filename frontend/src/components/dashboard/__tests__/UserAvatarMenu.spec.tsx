import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useLogout, useSession } from "@/api/queries/auth";
import { UserAvatarMenu } from "@/components/dashboard";
import { renderWithProviders } from "@/test/renderWithProviders";

vi.mock("@/api/queries/auth", () => ({ useSession: vi.fn(), useLogout: vi.fn() }));

type SessionResult = ReturnType<typeof useSession>;
type LogoutResult = ReturnType<typeof useLogout>;

function mockSession(user: Record<string, unknown> | null) {
  vi.mocked(useSession).mockReturnValue({
    data: user ? { user } : null,
  } as unknown as SessionResult);
}

function mockLogout(overrides: Record<string, unknown> = {}) {
  const mutate = vi.fn();
  vi.mocked(useLogout).mockReturnValue({
    mutate,
    isPending: false,
    error: null,
    ...overrides,
  } as unknown as LogoutResult);
  return mutate;
}

describe("UserAvatarMenu", () => {
  beforeEach(() => {
    mockSession({ name: "Ada Lovelace", email: "ada@example.com" });
    mockLogout();
  });

  it("el disparador se nombra con el nombre del usuario y muestra sus iniciales", () => {
    renderWithProviders(<UserAvatarMenu />);
    const trigger = screen.getByRole("button", { name: "Menú de usuario de Ada Lovelace" });
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(within(trigger).getByText("AL")).toBeInTheDocument();
  });

  it("usa el email o 'Usuario' como nombre accesible de respaldo", () => {
    mockSession({ name: "", email: "zed@example.com" });
    const { unmount } = renderWithProviders(<UserAvatarMenu />);
    expect(
      screen.getByRole("button", { name: "Menú de usuario de zed@example.com" }),
    ).toBeInTheDocument();
    unmount();

    mockSession(null);
    renderWithProviders(<UserAvatarMenu />);
    expect(screen.getByRole("button", { name: "Menú de usuario de Usuario" })).toBeInTheDocument();
  });

  it("abre el menú con 'Cerrar sesión' y llama a logout una vez al seleccionarlo", async () => {
    const mutate = mockLogout();
    const user = userEvent.setup();
    renderWithProviders(<UserAvatarMenu />);

    const trigger = screen.getByRole("button", { name: "Menú de usuario de Ada Lovelace" });
    await user.click(trigger);
    const menu = screen.getByRole("menu");
    const item = within(menu).getByRole("menuitem", { name: "Cerrar sesión" });
    expect(item).toHaveFocus();

    await user.click(item);
    expect(mutate).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("deshabilita 'Cerrar sesión' mientras isPending", async () => {
    const mutate = mockLogout({ isPending: true });
    const user = userEvent.setup();
    renderWithProviders(<UserAvatarMenu />);

    await user.click(screen.getByRole("button", { name: "Menú de usuario de Ada Lovelace" }));
    const item = screen.getByRole("menuitem", { name: "Cerrar sesión" });
    expect(item).toBeDisabled();
    await user.click(item);
    expect(mutate).not.toHaveBeenCalled();
  });

  it("muestra el error de logout con role=alert", () => {
    mockLogout({ error: { code: "UNKNOWN", message: "boom" } });
    renderWithProviders(<UserAvatarMenu />);
    expect(screen.getByRole("alert")).not.toBeEmptyDOMElement();
  });

  it("sin error no hay alerta", () => {
    renderWithProviders(<UserAvatarMenu />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
