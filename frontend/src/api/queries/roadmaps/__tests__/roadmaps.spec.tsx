import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { describe, expect, it, vi } from "vitest";
import { roadmapsKeys, useRoadmaps } from "@/api/queries/roadmaps";
import { getRoadmaps } from "@/api/services";
import { buildNetworkError } from "@/test/fixtures/api-errors";
import { ROADMAPS_LIST_RESULT } from "@/test/fixtures/roadmaps";

vi.mock("@/api/services", () => ({ getRoadmaps: vi.fn() }));

function createQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("roadmapsKeys", () => {
  it("usa una única key para el listado", () => {
    expect(roadmapsKeys.all).toEqual(["roadmaps"]);
    expect(roadmapsKeys.list()).toEqual(["roadmaps", "list"]);
  });
});

describe("useRoadmaps", () => {
  it("empieza pendiente y pasa a éxito con las 5 rutas y los counts globales", async () => {
    vi.mocked(getRoadmaps).mockResolvedValue(ROADMAPS_LIST_RESULT);

    const { result } = renderHook(() => useRoadmaps(), {
      wrapper: createWrapper(createQueryClient()),
    });

    expect(result.current.isPending).toBe(true);
    expect(result.current.data).toBeUndefined();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toHaveLength(5);
    expect(result.current.data?.counts.all).toBe(5);
  });

  it("dos consumidores comparten una sola petición sin argumentos", async () => {
    vi.mocked(getRoadmaps).mockResolvedValue(ROADMAPS_LIST_RESULT);
    const wrapper = createWrapper(createQueryClient());

    const first = renderHook(() => useRoadmaps(), { wrapper });
    const second = renderHook(() => useRoadmaps(), { wrapper });

    await waitFor(() => expect(first.result.current.isSuccess).toBe(true));
    await waitFor(() => expect(second.result.current.isSuccess).toBe(true));
    expect(getRoadmaps).toHaveBeenCalledTimes(1);
    expect(getRoadmaps).toHaveBeenCalledWith();
  });

  it("expone el error y se recupera con refetch", async () => {
    const error = buildNetworkError();
    vi.mocked(getRoadmaps).mockRejectedValueOnce(error).mockResolvedValue(ROADMAPS_LIST_RESULT);

    const { result } = renderHook(() => useRoadmaps(), {
      wrapper: createWrapper(createQueryClient()),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(error);

    await act(async () => {
      await result.current.refetch();
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(ROADMAPS_LIST_RESULT);
  });
});
