import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { describe, expect, it, vi } from "vitest";
import { ROADMAPS_STALE_TIME, roadmapsKeys, useRoadmaps } from "@/api/queries/roadmaps";
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

  it("usa un staleTime de 30 s", () => {
    expect(ROADMAPS_STALE_TIME).toBe(30_000);
  });

  it("no vuelve a pedir el listado al remontar mientras sigue fresco", async () => {
    vi.mocked(getRoadmaps).mockResolvedValue(ROADMAPS_LIST_RESULT);
    const wrapper = createWrapper(createQueryClient());

    const first = renderHook(() => useRoadmaps(), { wrapper });
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true));
    first.unmount();

    const { result } = renderHook(() => useRoadmaps(), { wrapper });

    expect(result.current.isSuccess).toBe(true);
    expect(result.current.data).toEqual(ROADMAPS_LIST_RESULT);
    expect(getRoadmaps).toHaveBeenCalledTimes(1);
  });

  it("vuelve a pedir el listado cuando la caché supera el staleTime", async () => {
    vi.mocked(getRoadmaps).mockResolvedValue(ROADMAPS_LIST_RESULT);
    const queryClient = createQueryClient();
    queryClient.setQueryData(roadmapsKeys.list(), ROADMAPS_LIST_RESULT, {
      updatedAt: Date.now() - ROADMAPS_STALE_TIME - 1,
    });

    const { result } = renderHook(() => useRoadmaps(), { wrapper: createWrapper(queryClient) });

    expect(result.current.data).toEqual(ROADMAPS_LIST_RESULT);
    await waitFor(() => expect(getRoadmaps).toHaveBeenCalledTimes(1));
  });

  it("vuelve a pedir el listado al invalidar roadmapsKeys.all aunque siga fresco", async () => {
    vi.mocked(getRoadmaps).mockResolvedValue(ROADMAPS_LIST_RESULT);
    const queryClient = createQueryClient();

    const { result } = renderHook(() => useRoadmaps(), { wrapper: createWrapper(queryClient) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    await act(async () => {
      await queryClient.invalidateQueries({ queryKey: roadmapsKeys.all });
    });

    expect(getRoadmaps).toHaveBeenCalledTimes(2);
  });
});
