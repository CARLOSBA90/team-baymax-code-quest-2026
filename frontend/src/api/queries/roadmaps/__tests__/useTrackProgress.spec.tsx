import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { describe, expect, it, type MockInstance, vi } from "vitest";
import { roadmapsKeys, useRoadmap, useTrackProgress } from "@/api/queries/roadmaps";
import { getRoadmap, trackItemCompletion } from "@/api/services";
import { buildAxiosError, buildNetworkError } from "@/test/fixtures/api-errors";
import {
  buildRoadmapItemNotFoundError,
  buildRoadmapPausedError,
  buildTrackingMismatchError,
  buildTrackProgressResult,
} from "@/test/fixtures/progress";
import { buildRoadmapDetail, ROADMAP_DETAIL } from "@/test/fixtures/roadmap-detail";
import { ROADMAPS_LIST_RESULT } from "@/test/fixtures/roadmaps";
import type { RoadmapDetail } from "@/types";

vi.mock("@/api/services", () => ({ trackItemCompletion: vi.fn(), getRoadmap: vi.fn() }));

const ROADMAP_ID = "r1";
const ITEM_ID = "item-3";
const LAST_ACTIVITY = "2026-09-25T11:00:00.000Z";

function buildRefreshedDetail(): RoadmapDetail {
  const detail = buildRoadmapDetail({ progress: 60, activityVersion: 7 });
  detail.items[2] = { ...detail.items[2], progress: 100, completedAt: LAST_ACTIVITY };
  return detail;
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

// `gcTime` por defecto (no 0): la lista y el detalle r2 sembrados no tienen observador.
function createQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  queryClient.setQueryData(roadmapsKeys.list(), structuredClone(ROADMAPS_LIST_RESULT));
  return queryClient;
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

/** Monta `useRoadmap("r1")` como observador del detalle junto a la mutación. */
async function renderWithDetail(queryClient = createQueryClient()) {
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  const { result } = renderHook(
    () => ({ detail: useRoadmap(ROADMAP_ID), track: useTrackProgress(ROADMAP_ID) }),
    { wrapper: createWrapper(queryClient) },
  );
  await waitFor(() => expect(result.current.detail.isSuccess).toBe(true));
  return { result, queryClient, invalidateSpy };
}

function getDetail(queryClient: QueryClient) {
  return queryClient.getQueryData<RoadmapDetail>(roadmapsKeys.detail(ROADMAP_ID));
}

function listInvalidated(invalidateSpy: MockInstance<QueryClient["invalidateQueries"]>) {
  const listKey = JSON.stringify(roadmapsKeys.list());
  return invalidateSpy.mock.calls.some(
    ([filters]) => JSON.stringify(filters?.queryKey) === listKey,
  );
}

describe("useTrackProgress", () => {
  it("tras un 200 espera al refetch del detalle y después invalida la lista", async () => {
    const refreshed = buildRefreshedDetail();
    const deferred = createDeferred<RoadmapDetail>();
    vi.mocked(getRoadmap)
      .mockResolvedValueOnce(ROADMAP_DETAIL)
      .mockReturnValueOnce(deferred.promise);
    vi.mocked(trackItemCompletion).mockResolvedValue(buildTrackProgressResult());
    const { result, queryClient, invalidateSpy } = await renderWithDetail();

    act(() => result.current.track.mutate(ITEM_ID));

    await waitFor(() => expect(getRoadmap).toHaveBeenCalledTimes(2));
    expect(vi.mocked(trackItemCompletion).mock.calls[0][0]).toBe(ITEM_ID);
    expect(vi.mocked(getRoadmap).mock.calls[1][0]).toBe(ROADMAP_ID);
    expect(result.current.track.isPending).toBe(true);
    expect(listInvalidated(invalidateSpy)).toBe(false);

    await act(async () => deferred.resolve(refreshed));

    await waitFor(() => expect(result.current.track.isSuccess).toBe(true));
    expect(result.current.track.data).toEqual({
      result: buildTrackProgressResult(),
      detail: refreshed,
      detailRefreshed: true,
    });
    expect(getDetail(queryClient)).toEqual(refreshed);
    expect(invalidateSpy.mock.calls[0][0]).toEqual({
      queryKey: roadmapsKeys.detail(ROADMAP_ID),
      exact: true,
    });
    expect(invalidateSpy).toHaveBeenLastCalledWith({ queryKey: roadmapsKeys.list() });
  });

  it("no toca el detalle de otra ruta ni invalida roadmapsKeys.all", async () => {
    vi.mocked(getRoadmap)
      .mockResolvedValueOnce(ROADMAP_DETAIL)
      .mockResolvedValueOnce(buildRefreshedDetail());
    vi.mocked(trackItemCompletion).mockResolvedValue(buildTrackProgressResult());
    const queryClient = createQueryClient();
    const other = buildRoadmapDetail({ id: "r2" });
    queryClient.setQueryData(roadmapsKeys.detail("r2"), other);
    const { result, invalidateSpy } = await renderWithDetail(queryClient);

    act(() => result.current.track.mutate(ITEM_ID));

    await waitFor(() => expect(result.current.track.isSuccess).toBe(true));
    expect(queryClient.getQueryState(roadmapsKeys.detail("r2"))?.isInvalidated).toBe(false);
    expect(queryClient.getQueryData(roadmapsKeys.detail("r2"))).toBe(other);
    expect(vi.mocked(getRoadmap).mock.calls.map(([id]) => id)).not.toContain("r2");
    expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: roadmapsKeys.all });
  });

  it("200 + refetch fallido (500): resuelve, parchea la caché y la deja stale", async () => {
    vi.mocked(getRoadmap)
      .mockResolvedValueOnce(ROADMAP_DETAIL)
      .mockRejectedValueOnce(buildAxiosError(500));
    vi.mocked(trackItemCompletion).mockResolvedValue(buildTrackProgressResult());
    const { result, queryClient, invalidateSpy } = await renderWithDetail();

    act(() => result.current.track.mutate(ITEM_ID));

    await waitFor(() => expect(result.current.track.isSuccess).toBe(true));
    const detail = getDetail(queryClient);
    expect(result.current.track.data?.detailRefreshed).toBe(false);
    expect(result.current.track.data?.detail).toEqual(detail);
    expect(detail?.items[2].progress).toBe(100);
    expect(detail).toMatchObject({
      progress: 60,
      lastActivity: LAST_ACTIVITY,
      activityVersion: 7,
      status: "IN_PROGRESS",
      nextStep: ROADMAP_DETAIL.nextStep,
    });
    expect(detail?.items[0]).toEqual(ROADMAP_DETAIL.items[0]);
    expect(detail?.items[1]).toEqual(ROADMAP_DETAIL.items[1]);
    expect(detail?.items[3]).toEqual(ROADMAP_DETAIL.items[3]);
    expect(queryClient.getQueryState(roadmapsKeys.detail(ROADMAP_ID))?.status).toBe("success");
    expect(queryClient.getQueryState(roadmapsKeys.detail(ROADMAP_ID))?.isInvalidated).toBe(true);
    expect(listInvalidated(invalidateSpy)).toBe(true);
  });

  it("200 que completa la ruta + refetch fallido: la caché queda COMPLETED", async () => {
    const base = buildTrackProgressResult();
    vi.mocked(getRoadmap)
      .mockResolvedValueOnce(ROADMAP_DETAIL)
      .mockRejectedValueOnce(buildNetworkError());
    vi.mocked(trackItemCompletion).mockResolvedValue({
      ...base,
      roadmap: { ...base.roadmap, status: "COMPLETED", progress: 100 },
    });
    const { result, queryClient } = await renderWithDetail();

    act(() => result.current.track.mutate(ITEM_ID));

    await waitFor(() => expect(result.current.track.isSuccess).toBe(true));
    expect(getDetail(queryClient)).toMatchObject({ status: "COMPLETED", progress: 100 });
  });

  it("200 + refetch 404: no parchea (la query sigue en error)", async () => {
    vi.mocked(getRoadmap)
      .mockResolvedValueOnce(ROADMAP_DETAIL)
      .mockRejectedValueOnce(buildAxiosError(404));
    vi.mocked(trackItemCompletion).mockResolvedValue(buildTrackProgressResult());
    const { result, queryClient } = await renderWithDetail();

    act(() => result.current.track.mutate(ITEM_ID));

    await waitFor(() => expect(result.current.track.isSuccess).toBe(true));
    expect(result.current.track.data?.detailRefreshed).toBe(false);
    expect(queryClient.getQueryState(roadmapsKeys.detail(ROADMAP_ID))?.status).toBe("error");
    expect(getDetail(queryClient)?.items[2].progress).toBe(0);
    expect(getDetail(queryClient)?.progress).toBe(ROADMAP_DETAIL.progress);
  });

  it("sin detalle en caché no crea ninguna entrada", async () => {
    vi.mocked(trackItemCompletion).mockResolvedValue(buildTrackProgressResult());
    const queryClient = createQueryClient();
    const { result } = renderHook(() => useTrackProgress(ROADMAP_ID), {
      wrapper: createWrapper(queryClient),
    });

    act(() => result.current.mutate(ITEM_ID));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.detail).toBeUndefined();
    expect(queryClient.getQueryCache().find({ queryKey: roadmapsKeys.detail(ROADMAP_ID) })).toBe(
      undefined,
    );
    expect(getRoadmap).not.toHaveBeenCalled();
  });

  it.each([
    ["409 ROADMAP_PAUSED", buildRoadmapPausedError()],
    ["404 ROADMAP_ITEM_NOT_FOUND", buildRoadmapItemNotFoundError()],
    ["422 TRACKING_REPORT_MISMATCH", buildTrackingMismatchError()],
  ])(
    "%s: refetch del detalle antes de fallar, invalida la lista y relanza el error",
    async (_label, error) => {
      const deferred = createDeferred<RoadmapDetail>();
      vi.mocked(getRoadmap)
        .mockResolvedValueOnce(ROADMAP_DETAIL)
        .mockReturnValueOnce(deferred.promise);
      vi.mocked(trackItemCompletion).mockRejectedValue(error);
      const { result, invalidateSpy } = await renderWithDetail();

      act(() => result.current.track.mutate(ITEM_ID));

      await waitFor(() => expect(getRoadmap).toHaveBeenCalledTimes(2));
      expect(result.current.track.isPending).toBe(true);

      await act(async () => deferred.resolve(buildRoadmapDetail()));

      await waitFor(() => expect(result.current.track.isError).toBe(true));
      expect(result.current.track.error).toBe(error);
      expect(listInvalidated(invalidateSpy)).toBe(true);
    },
  );

  it.each([
    ["red", buildNetworkError()],
    ["500", buildAxiosError(500)],
    ["401", buildAxiosError(401)],
  ])("%s: no refetchea, no invalida y deja la caché intacta", async (_label, error) => {
    vi.mocked(getRoadmap).mockResolvedValueOnce(ROADMAP_DETAIL);
    vi.mocked(trackItemCompletion).mockRejectedValue(error);
    const { result, queryClient, invalidateSpy } = await renderWithDetail();
    const before = getDetail(queryClient);

    act(() => result.current.track.mutate(ITEM_ID));

    await waitFor(() => expect(result.current.track.isError).toBe(true));
    expect(result.current.track.error).toBe(error);
    expect(getRoadmap).toHaveBeenCalledTimes(1);
    expect(invalidateSpy).not.toHaveBeenCalled();
    expect(getDetail(queryClient)).toBe(before);
  });

  it('usa la mutationKey [...roadmapsKeys.all, "track", roadmapId]', async () => {
    vi.mocked(trackItemCompletion).mockResolvedValue(buildTrackProgressResult());
    const queryClient = createQueryClient();
    const { result } = renderHook(() => useTrackProgress(ROADMAP_ID), {
      wrapper: createWrapper(queryClient),
    });

    act(() => result.current.mutate(ITEM_ID));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const [mutation] = queryClient.getMutationCache().getAll();
    expect(mutation.options.mutationKey).toEqual(["roadmaps", "track", ROADMAP_ID]);
  });
});
