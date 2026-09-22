import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useLogout, useSession } from "@/api/queries/auth";
import { SidebarUserCard } from "@/components/dashboard";
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

describe("SidebarUserCard", () => {
  beforeEach(() => {
    mockLogout();
  });

  it("muestra iniciales, nombre y email", () => {
    mockSession({ name: "Ada Lovelace", email: "ada@example.com" });
    renderWithProviders(<SidebarUserCard />);
    expect(screen.getByText("AL")).toBeInTheDocument();
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
  });

  it("maneja un nombre de una palabra", () => {
    mockSession({ name: "Ada", email: "ada@example.com" });
    renderWithProviders(<SidebarUserCard />);
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("Ada")).toBeInTheDocument();
  });

  it("usa el email si el nombre está vacío", () => {
    mockSession({ name: "", email: "zed@example.com" });
    renderWithProviders(<SidebarUserCard />);
    expect(screen.getByText("Z")).toBeInTheDocument();
    expect(screen.getAllByText("zed@example.com")).toHaveLength(2);
  });

  it('muestra "?" y "Usuario" sin sesión, sin error', () => {
    mockSession(null);
    renderWithProviders(<SidebarUserCard />);
    expect(screen.getByText("?")).toBeInTheDocument();
    expect(screen.getByText("Usuario")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("llama a logout una vez al pulsar Cerrar sesión", async () => {
    mockSession({ name: "Ada Lovelace", email: "ada@example.com" });
    const mutate = mockLogout();
    renderWithProviders(<SidebarUserCard />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Cerrar sesión" }));
    expect(mutate).toHaveBeenCalledTimes(1);
  });

  it("deshabilita el botón con aria-busy mientras isPending", () => {
    mockSession({ name: "Ada Lovelace", email: "ada@example.com" });
    mockLogout({ isPending: true });
    renderWithProviders(<SidebarUserCard />);
    const button = screen.getByRole("button", { name: "Cerrar sesión" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("muestra el error con role=alert y deja el botón habilitado", () => {
    mockSession({ name: "Ada Lovelace", email: "ada@example.com" });
    mockLogout({ error: { code: "UNKNOWN", message: "boom" } });
    renderWithProviders(<SidebarUserCard />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    const button = screen.getByRole("button", { name: "Cerrar sesión" });
    expect(button).toBeEnabled();
    expect(button).not.toHaveAttribute("aria-busy", "true");
  });

  it("ignora la imagen de la sesión", () => {
    mockSession({ name: "Ada Lovelace", email: "ada@example.com", image: "https://x.test/a.png" });
    renderWithProviders(<SidebarUserCard />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(document.querySelector("img")).toBeNull();
  });
});
