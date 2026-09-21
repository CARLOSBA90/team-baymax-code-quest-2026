import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { GuestRoute } from "@/router/GuestRoute";
import { useGuardSession } from "@/router/useGuardSession";
import { renderWithProviders } from "@/test/renderWithProviders";

vi.mock("@/router/useGuardSession", () => ({ useGuardSession: vi.fn() }));

type GuardState = ReturnType<typeof useGuardSession>;

function makeState(overrides: Partial<GuardState> = {}): GuardState {
  return {
    session: null,
    error: null,
    refetch: vi.fn(),
    isInitialLoading: false,
    ...overrides,
  } as GuardState;
}

const SESSION = { user: { id: "u1" }, session: { id: "s1" } } as unknown as GuardState["session"];

function renderGuard() {
  return renderWithProviders(
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/auth/login" element={<p>login-content</p>} />
      </Route>
      <Route path="/dashboard/roadmaps" element={<p>dashboard-content</p>} />
    </Routes>,
    { route: "/auth/login" },
  );
}

describe("GuestRoute", () => {
  it("muestra el spinner mientras carga la sesión inicial", () => {
    vi.mocked(useGuardSession).mockReturnValue(makeState({ isInitialLoading: true }));
    renderGuard();
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText("login-content")).not.toBeInTheDocument();
  });

  it("muestra SessionError y reintenta con refetch", async () => {
    const refetch = vi.fn();
    vi.mocked(useGuardSession).mockReturnValue(
      makeState({ error: new Error("network") as GuardState["error"], refetch }),
    );
    renderGuard();
    expect(screen.getByText(/no pudimos verificar tu sesión/i)).toBeInTheDocument();
    expect(screen.queryByText("login-content")).not.toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("button", { name: "Reintentar" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("prioriza el spinner sobre el error", () => {
    vi.mocked(useGuardSession).mockReturnValue(
      makeState({ isInitialLoading: true, error: new Error("x") as GuardState["error"] }),
    );
    renderGuard();
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reintentar" })).not.toBeInTheDocument();
  });

  it("prioriza el error sobre la redirección con sesión", () => {
    vi.mocked(useGuardSession).mockReturnValue(
      makeState({ session: SESSION, error: new Error("x") as GuardState["error"] }),
    );
    renderGuard();
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeInTheDocument();
    expect(screen.queryByText("dashboard-content")).not.toBeInTheDocument();
  });

  it("redirige a /dashboard/roadmaps si hay sesión", () => {
    vi.mocked(useGuardSession).mockReturnValue(makeState({ session: SESSION }));
    renderGuard();
    expect(screen.getByText("dashboard-content")).toBeInTheDocument();
    expect(screen.queryByText("login-content")).not.toBeInTheDocument();
  });

  it("renderiza el Outlet si no hay sesión", () => {
    vi.mocked(useGuardSession).mockReturnValue(makeState());
    renderGuard();
    expect(screen.getByText("login-content")).toBeInTheDocument();
  });
});
