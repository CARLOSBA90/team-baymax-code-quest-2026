import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { describe, expect, it, vi } from "vitest";
import { roadmapsKeys, useRoadmap } from "@/api/queries/roadmaps";
import { queryClient as appQueryClient } from "@/api/queryClient";
import { getRoadmap } from "@/api/services";
import { buildAxiosError, buildNetworkError } from "@/test/fixtures/api-errors";
import { buildRoadmapDetail, ROADMAP_DETAIL } from "@/test/fixtures/roadmap-detail";

vi.mock("@/api/services", () => ({ getRoadmap: vi.fn() }));

// `gcTime` por defecto (no 0 como `createTestQueryClient`): el remount debe encontrar la caché.
function createQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("roadmapsKeys.detail", () => {
  it("cuelga el detalle de roadmapsKeys.all con el id", () => {
    expect(roadmapsKeys.detail("x")).toEqual(["roadmaps", "detail", "x"]);
  });
});

describe("useRoadmap", () => {
  it("empieza pendiente y pasa a éxito con el detalle del id pedido", async () => {
    vi.mocked(getRoadmap).mockResolvedValue(ROADMAP_DETAIL);

    const { result } = renderHook(() => useRoadmap("r1"), {
      wrapper: createWrapper(createQueryClient()),
    });

    expect(result.current.isPending).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(ROADMAP_DETAIL);
    expect(getRoadmap).toHaveBeenCalledTimes(1);
    expect(getRoadmap).toHaveBeenCalledWith("r1");
  });

  it("invalidar roadmapsKeys.all marca el detalle como invalidado", async () => {
    vi.mocked(getRoadmap).mockResolvedValue(ROADMAP_DETAIL);
    const queryClient = createQueryClient();
    const { result, unmount } = renderHook(() => useRoadmap("r1"), {
      wrapper: createWrapper(queryClient),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    unmount();

    await act(async () => {
      await queryClient.invalidateQueries({ queryKey: roadmapsKeys.all });
    });

    expect(queryClient.getQueryState(roadmapsKeys.detail("r1"))?.isInvalidated).toBe(true);
  });

  it("no vuelve a pedir el detalle al remontar mientras sigue fresco", async () => {
    vi.mocked(getRoadmap).mockResolvedValue(ROADMAP_DETAIL);
    const wrapper = createWrapper(createQueryClient());

    const first = renderHook(() => useRoadmap("r1"), { wrapper });
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true));
    first.unmount();

    const { result } = renderHook(() => useRoadmap("r1"), { wrapper });

    expect(result.current.isSuccess).toBe(true);
    expect(result.current.data).toEqual(ROADMAP_DETAIL);
    expect(getRoadmap).toHaveBeenCalledTimes(1);
  });

  it("dos consumidores simultáneos comparten una sola petición", async () => {
    vi.mocked(getRoadmap).mockResolvedValue(ROADMAP_DETAIL);
    const wrapper = createWrapper(createQueryClient());

    const first = renderHook(() => useRoadmap("r1"), { wrapper });
    const second = renderHook(() => useRoadmap("r1"), { wrapper });

    await waitFor(() => expect(first.result.current.isSuccess).toBe(true));
    await waitFor(() => expect(second.result.current.isSuccess).toBe(true));
    expect(getRoadmap).toHaveBeenCalledTimes(1);
  });

  it("cada id tiene su propia entrada de caché", async () => {
    const r2 = buildRoadmapDetail({ id: "r2", name: "Otra ruta" });
    vi.mocked(getRoadmap).mockImplementation((id) =>
      Promise.resolve(id === "r2" ? r2 : ROADMAP_DETAIL),
    );
    const queryClient = createQueryClient();

    const { result, rerender } = renderHook(({ id }) => useRoadmap(id), {
      wrapper: createWrapper(queryClient),
      initialProps: { id: "r1" },
    });
    await waitFor(() => expect(result.current.data).toEqual(ROADMAP_DETAIL));

    rerender({ id: "r2" });

    await waitFor(() => expect(result.current.data).toEqual(r2));
    expect(getRoadmap).toHaveBeenLastCalledWith("r2");
    expect(queryClient.getQueryData(roadmapsKeys.detail("r1"))).toEqual(ROADMAP_DETAIL);
    expect(queryClient.getQueryData(roadmapsKeys.detail("r2"))).toEqual(r2);
  });

  it("con id vacío no llama al servicio", async () => {
    const { result } = renderHook(() => useRoadmap(""), {
      wrapper: createWrapper(createQueryClient()),
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(getRoadmap).not.toHaveBeenCalled();
  });

  it("con la política retry de la app, un 404 falla tras una sola llamada", async () => {
    const error = buildAxiosError(404, "Roadmap not found.", { code: "ROADMAP_NOT_FOUND" });
    vi.mocked(getRoadmap).mockRejectedValue(error);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: appQueryClient.getDefaultOptions().queries?.retry } },
    });

    const { result } = renderHook(() => useRoadmap("r1"), { wrapper: createWrapper(queryClient) });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(error);
    expect(getRoadmap).toHaveBeenCalledTimes(1);
  });

  it("expone el error de red y se recupera con refetch", async () => {
    const error = buildNetworkError();
    vi.mocked(getRoadmap).mockRejectedValueOnce(error).mockResolvedValue(ROADMAP_DETAIL);

    const { result } = renderHook(() => useRoadmap("r1"), {
      wrapper: createWrapper(createQueryClient()),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(error);

    await act(async () => {
      await result.current.refetch();
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(ROADMAP_DETAIL);
  });
});
