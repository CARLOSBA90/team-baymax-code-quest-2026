import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { authClient } from "@/lib/auth-client";
import { useGuardSession } from "@/router/useGuardSession";

vi.mock("@/lib/auth-client", () => ({
  authClient: { useSession: vi.fn() },
  buildFrontendUrl: vi.fn(),
}));

type SessionState = ReturnType<typeof authClient.useSession>;

function setSession(state: Partial<SessionState>) {
  vi.mocked(authClient.useSession).mockReturnValue({
    data: null,
    isPending: false,
    error: null,
    refetch: vi.fn(),
    ...state,
  } as SessionState);
}

describe("useGuardSession", () => {
  it("isInitialLoading es true mientras la primera carga está pendiente", () => {
    setSession({ isPending: true });
    const { result } = renderHook(() => useGuardSession());
    expect(result.current.isInitialLoading).toBe(true);
  });

  it("pasa a false al resolverse la primera carga", () => {
    setSession({ isPending: true });
    const { result, rerender } = renderHook(() => useGuardSession());
    setSession({ isPending: false });
    rerender();
    expect(result.current.isInitialLoading).toBe(false);
  });

  it("no reactiva isInitialLoading en refetch posteriores", () => {
    setSession({ isPending: true });
    const { result, rerender } = renderHook(() => useGuardSession());
    setSession({ isPending: false });
    rerender();
    setSession({ isPending: true, data: null });
    rerender();
    expect(result.current.isInitialLoading).toBe(false);
  });

  it("expone session, error y refetch", () => {
    const refetch = vi.fn();
    const error = new Error("boom");
    setSession({ data: null, error: error as SessionState["error"], refetch });
    const { result } = renderHook(() => useGuardSession());
    expect(result.current.session).toBeNull();
    expect(result.current.error).toBe(error);
    expect(result.current.refetch).toBe(refetch);
  });
});
