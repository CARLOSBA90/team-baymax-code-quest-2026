import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { describe, expect, it, vi } from "vitest";
import { roadmapsKeys, useDeleteRoadmap } from "@/api/queries/roadmaps";
import { deleteRoadmap, getRoadmap } from "@/api/services";
import { buildAxiosError, buildNetworkError } from "@/test/fixtures/api-errors";
import { buildRoadmapDetail, ROADMAP_DETAIL } from "@/test/fixtures/roadmap-detail";
import { ROADMAPS_LIST_RESULT } from "@/test/fixtures/roadmaps";
import type { RoadmapsListResult } from "@/types";

vi.mock("@/api/services", () => ({ deleteRoadmap: vi.fn(), getRoadmap: vi.fn() }));

const FE_ID = "rm-frontend-react";
const OTHER_ID = "rm-backend-node";
const OTHER_DETAIL = buildRoadmapDetail({ id: OTHER_ID, name: "Backend con Node" });

function createQueryClient(preloaded = true) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  if (preloaded) {
    queryClient.setQueryData(roadmapsKeys.list(), structuredClone(ROADMAPS_LIST_RESULT));
  }
  return queryClient;
}

function renderDeleteHook(queryClient: QueryClient) {
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  const { result } = renderHook(() => useDeleteRoadmap(), {
    wrapper: ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
  return { result, invalidateSpy };
}

function getList(queryClient: QueryClient) {
  return queryClient.getQueryData<RoadmapsListResult>(roadmapsKeys.list());
}

describe("useDeleteRoadmap", () => {
  it("tras un 200 quita la ruta de la caché, recalcula counts/meta e invalida roadmapsKeys.all", async () => {
    vi.mocked(deleteRoadmap).mockResolvedValue({ id: FE_ID });
    const queryClient = createQueryClient();
    const { result, invalidateSpy } = renderDeleteHook(queryClient);

    act(() => result.current.mutate(FE_ID));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(deleteRoadmap).toHaveBeenCalledTimes(1);
    expect(vi.mocked(deleteRoadmap).mock.calls[0][0]).toBe(FE_ID);
    const list = getList(queryClient);
    expect(list?.items.map((item) => item.id)).not.toContain(FE_ID);
    expect(list?.counts).toEqual({
      ...ROADMAPS_LIST_RESULT.counts,
      all: ROADMAPS_LIST_RESULT.counts.all - 1,
      inProgress: ROADMAPS_LIST_RESULT.counts.inProgress - 1,
    });
    expect(list?.meta.total).toBe(ROADMAPS_LIST_RESULT.meta.total - 1);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: roadmapsKeys.all });
  });

  it("no es optimista: mientras la petición está pendiente la caché no cambia", async () => {
    vi.mocked(deleteRoadmap).mockReturnValue(new Promise(() => {}));
    const queryClient = createQueryClient();
    const { result, invalidateSpy } = renderDeleteHook(queryClient);

    act(() => result.current.mutate(FE_ID));

    await waitFor(() => expect(result.current.isPending).toBe(true));
    expect(getList(queryClient)).toEqual(ROADMAPS_LIST_RESULT);
    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it("un 404 se trata como ya eliminada: quita la ruta e invalida", async () => {
    vi.mocked(deleteRoadmap).mockRejectedValue(
      buildAxiosError(404, "Roadmap not found.", { code: "ROADMAP_NOT_FOUND" }),
    );
    const queryClient = createQueryClient();
    const { result, invalidateSpy } = renderDeleteHook(queryClient);

    act(() => result.current.mutate(FE_ID));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(getList(queryClient)?.items.map((item) => item.id)).not.toContain(FE_ID);
    expect(getList(queryClient)?.counts.all).toBe(ROADMAPS_LIST_RESULT.counts.all - 1);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: roadmapsKeys.all });
  });

  it.each([
    ["500", buildAxiosError(500)],
    ["fallo de red", buildNetworkError()],
  ])("un %s deja la caché idéntica y no invalida", async (_label, error) => {
    vi.mocked(deleteRoadmap).mockRejectedValue(error);
    const queryClient = createQueryClient();
    const { result, invalidateSpy } = renderDeleteHook(queryClient);

    act(() => result.current.mutate(FE_ID));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(error);
    expect(getList(queryClient)).toEqual(ROADMAPS_LIST_RESULT);
    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it("sin entrada de caché del listado no crea una nueva y solo invalida", async () => {
    vi.mocked(deleteRoadmap).mockResolvedValue({ id: FE_ID });
    const queryClient = createQueryClient(false);
    const { result, invalidateSpy } = renderDeleteHook(queryClient);

    act(() => result.current.mutate(FE_ID));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getList(queryClient)).toBeUndefined();
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: roadmapsKeys.all });
  });

  describe("caché del detalle", () => {
    function createClientWithDetails() {
      const queryClient = createQueryClient();
      queryClient.setQueryData(roadmapsKeys.detail(FE_ID), structuredClone(ROADMAP_DETAIL));
      queryClient.setQueryData(roadmapsKeys.detail(OTHER_ID), structuredClone(OTHER_DETAIL));
      return queryClient;
    }

    it("tras un 200 elimina el detalle de la ruta borrada e invalida el resto", async () => {
      vi.mocked(deleteRoadmap).mockResolvedValue({ id: FE_ID });
      const queryClient = createClientWithDetails();
      const { result } = renderDeleteHook(queryClient);

      act(() => result.current.mutate(FE_ID));

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(queryClient.getQueryState(roadmapsKeys.detail(FE_ID))).toBeUndefined();
      expect(queryClient.getQueryData(roadmapsKeys.detail(OTHER_ID))).toEqual(OTHER_DETAIL);
      expect(queryClient.getQueryState(roadmapsKeys.detail(OTHER_ID))?.isInvalidated).toBe(true);
      expect(getList(queryClient)?.items.map((item) => item.id)).not.toContain(FE_ID);
      expect(getRoadmap).not.toHaveBeenCalledWith(FE_ID);
    });

    it("un 404 también elimina el detalle de la ruta", async () => {
      vi.mocked(deleteRoadmap).mockRejectedValue(
        buildAxiosError(404, "Roadmap not found.", { code: "ROADMAP_NOT_FOUND" }),
      );
      const queryClient = createClientWithDetails();
      const { result } = renderDeleteHook(queryClient);

      act(() => result.current.mutate(FE_ID));

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(queryClient.getQueryState(roadmapsKeys.detail(FE_ID))).toBeUndefined();
      expect(getRoadmap).not.toHaveBeenCalledWith(FE_ID);
    });

    it.each([
      ["500", buildAxiosError(500)],
      ["fallo de red", buildNetworkError()],
    ])("un %s conserva el detalle y el listado", async (_label, error) => {
      vi.mocked(deleteRoadmap).mockRejectedValue(error);
      const queryClient = createClientWithDetails();
      const { result } = renderDeleteHook(queryClient);

      act(() => result.current.mutate(FE_ID));

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(queryClient.getQueryData(roadmapsKeys.detail(FE_ID))).toEqual(ROADMAP_DETAIL);
      expect(queryClient.getQueryState(roadmapsKeys.detail(FE_ID))?.isInvalidated).toBe(false);
      expect(getList(queryClient)).toEqual(ROADMAPS_LIST_RESULT);
    });
  });
});
