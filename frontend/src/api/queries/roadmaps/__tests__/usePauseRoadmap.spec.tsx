import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { describe, expect, it, type MockInstance, vi } from "vitest";
import { roadmapsKeys, usePauseRoadmap, useRoadmap, useRoadmaps } from "@/api/queries/roadmaps";
import { getRoadmap, getRoadmaps, setRoadmapPaused } from "@/api/services";
import { buildAxiosError, buildNetworkError } from "@/test/fixtures/api-errors";
import { buildRoadmapDetail, ROADMAP_DETAIL } from "@/test/fixtures/roadmap-detail";
import {
  buildInvalidRoadmapTransitionError,
  buildPausedRoadmapDetailResult,
  buildRoadmapNotFoundError,
  buildRoadmapVersionConflictError,
} from "@/test/fixtures/roadmap-pause";
import { ROADMAPS_LIST_RESULT } from "@/test/fixtures/roadmaps";
import type { RoadmapDetail, RoadmapsListResult, SetRoadmapPausedBody } from "@/types";

vi.mock("@/api/services", () => ({
  setRoadmapPaused: vi.fn(),
  getRoadmap: vi.fn(),
  getRoadmaps: vi.fn(),
}));

const ROADMAP_ID = "r1";
const PAUSE_BODY: SetRoadmapPausedBody = { paused: true, expectedActivityVersion: 12 };

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
    () => ({ detail: useRoadmap(ROADMAP_ID), pause: usePauseRoadmap(ROADMAP_ID) }),
    { wrapper: createWrapper(queryClient) },
  );
  await waitFor(() => expect(result.current.detail.isSuccess).toBe(true));
  return { result, queryClient, invalidateSpy };
}

function getDetail(queryClient: QueryClient) {
  return queryClient.getQueryData<RoadmapDetail>(roadmapsKeys.detail(ROADMAP_ID));
}

function invalidatedKeys(invalidateSpy: MockInstance<QueryClient["invalidateQueries"]>) {
  return invalidateSpy.mock.calls.map(([filters]) => JSON.stringify(filters?.queryKey));
}

const LIST_KEY = JSON.stringify(roadmapsKeys.list());
const ALL_KEY = JSON.stringify(roadmapsKeys.all);

describe("usePauseRoadmap", () => {
  it('usa la mutationKey [...roadmapsKeys.all, "pause", roadmapId]', async () => {
    vi.mocked(setRoadmapPaused).mockResolvedValue(buildPausedRoadmapDetailResult());
    const queryClient = createQueryClient();
    const { result } = renderHook(() => usePauseRoadmap(ROADMAP_ID), {
      wrapper: createWrapper(queryClient),
    });

    act(() => result.current.mutate(PAUSE_BODY));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const [mutation] = queryClient.getMutationCache().getAll();
    expect(mutation.options.mutationKey).toEqual(["roadmaps", "pause", ROADMAP_ID]);
  });

  it("envía el id y el body exactos una sola vez", async () => {
    vi.mocked(getRoadmap).mockResolvedValueOnce(ROADMAP_DETAIL);
    vi.mocked(setRoadmapPaused).mockResolvedValue(buildPausedRoadmapDetailResult());
    const { result } = await renderWithDetail();

    act(() => result.current.pause.mutate({ paused: false, expectedActivityVersion: 7 }));

    await waitFor(() => expect(result.current.pause.isSuccess).toBe(true));
    expect(setRoadmapPaused).toHaveBeenCalledTimes(1);
    const [id, body] = vi.mocked(setRoadmapPaused).mock.calls[0];
    expect(id).toBe(ROADMAP_ID);
    expect(body).toEqual({ paused: false, expectedActivityVersion: 7 });
  });

  it("200: escribe la respuesta en el detalle antes del onSuccess, sin GET, e invalida solo la lista", async () => {
    const paused = buildPausedRoadmapDetailResult();
    vi.mocked(getRoadmap).mockResolvedValueOnce(ROADMAP_DETAIL);
    vi.mocked(setRoadmapPaused).mockResolvedValue(paused);
    const { result, queryClient, invalidateSpy } = await renderWithDetail();
    let cachedInOnSuccess: RoadmapDetail | undefined;
    let returned: RoadmapDetail | undefined;

    act(() =>
      result.current.pause.mutate(PAUSE_BODY, {
        onSuccess: (data) => {
          cachedInOnSuccess = getDetail(queryClient);
          returned = data;
        },
      }),
    );

    await waitFor(() => expect(result.current.pause.isSuccess).toBe(true));
    expect(cachedInOnSuccess).toEqual(paused);
    expect(returned).toBe(cachedInOnSuccess);
    expect(getDetail(queryClient)).toEqual(paused);
    expect(getRoadmap).toHaveBeenCalledTimes(1);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: roadmapsKeys.list() });
    expect(invalidatedKeys(invalidateSpy)).not.toContain(ALL_KEY);
    expect(invalidatedKeys(invalidateSpy).every((key) => key === LIST_KEY)).toBe(true);
  });

  it("200: no espera al refetch de la lista", async () => {
    vi.mocked(getRoadmap).mockResolvedValueOnce(ROADMAP_DETAIL);
    vi.mocked(getRoadmaps).mockReturnValue(new Promise<RoadmapsListResult>(() => {}));
    vi.mocked(setRoadmapPaused).mockResolvedValue(buildPausedRoadmapDetailResult());
    const queryClient = createQueryClient();
    const { result } = renderHook(
      () => ({
        list: useRoadmaps(),
        detail: useRoadmap(ROADMAP_ID),
        pause: usePauseRoadmap(ROADMAP_ID),
      }),
      { wrapper: createWrapper(queryClient) },
    );
    await waitFor(() => expect(result.current.detail.isSuccess).toBe(true));

    act(() => result.current.pause.mutate(PAUSE_BODY));

    await waitFor(() => expect(result.current.pause.isSuccess).toBe(true));
    expect(getRoadmaps).toHaveBeenCalled();
    expect(result.current.list.isFetching).toBe(true);
  });

  it("200 idéntico a la caché (idempotente): devuelve la misma referencia cacheada", async () => {
    vi.mocked(getRoadmap).mockResolvedValueOnce(ROADMAP_DETAIL);
    vi.mocked(setRoadmapPaused).mockResolvedValue(structuredClone(ROADMAP_DETAIL));
    const { result, queryClient } = await renderWithDetail();
    const before = getDetail(queryClient);

    act(() => result.current.pause.mutate(PAUSE_BODY));

    await waitFor(() => expect(result.current.pause.isSuccess).toBe(true));
    expect(result.current.pause.data).toBe(before);
    expect(getDetail(queryClient)).toBe(before);
  });

  it("200 sin detalle en caché devuelve la respuesta", async () => {
    const paused = buildPausedRoadmapDetailResult();
    vi.mocked(setRoadmapPaused).mockResolvedValue(paused);
    const queryClient = createQueryClient();
    const { result } = renderHook(() => usePauseRoadmap(ROADMAP_ID), {
      wrapper: createWrapper(queryClient),
    });

    act(() => result.current.mutate(PAUSE_BODY));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(paused);
    expect(getRoadmap).not.toHaveBeenCalled();
  });

  it("200 y 409 no tocan el detalle de otra ruta", async () => {
    const other = buildRoadmapDetail({ id: "r2" });
    for (const outcome of ["200", "409"] as const) {
      vi.mocked(getRoadmap).mockReset();
      vi.mocked(getRoadmap).mockResolvedValue(ROADMAP_DETAIL);
      if (outcome === "200") {
        vi.mocked(setRoadmapPaused).mockResolvedValue(buildPausedRoadmapDetailResult());
      } else {
        vi.mocked(setRoadmapPaused).mockRejectedValue(buildRoadmapVersionConflictError());
      }
      const queryClient = createQueryClient();
      queryClient.setQueryData(roadmapsKeys.detail("r2"), other);
      const { result } = await renderWithDetail(queryClient);

      act(() => result.current.pause.mutate(PAUSE_BODY));

      await waitFor(() => expect(result.current.pause.isPending).toBe(false));
      expect(queryClient.getQueryData(roadmapsKeys.detail("r2"))).toBe(other);
      expect(queryClient.getQueryState(roadmapsKeys.detail("r2"))?.isInvalidated).toBe(false);
      expect(vi.mocked(getRoadmap).mock.calls.map(([id]) => id)).not.toContain("r2");
    }
  });

  it.each([
    ["409 ROADMAP_VERSION_CONFLICT", buildRoadmapVersionConflictError()],
    ["409 INVALID_ROADMAP_TRANSITION", buildInvalidRoadmapTransitionError()],
    ["404 ROADMAP_NOT_FOUND", buildRoadmapNotFoundError()],
  ])(
    "%s: espera al refetch del detalle, invalida la lista y relanza el mismo error",
    async (_label, error) => {
      const refreshed = buildPausedRoadmapDetailResult();
      const deferred = createDeferred<RoadmapDetail>();
      vi.mocked(getRoadmap)
        .mockResolvedValueOnce(ROADMAP_DETAIL)
        .mockReturnValueOnce(deferred.promise);
      vi.mocked(setRoadmapPaused).mockRejectedValue(error);
      const { result, queryClient, invalidateSpy } = await renderWithDetail();

      act(() => result.current.pause.mutate(PAUSE_BODY));

      await waitFor(() => expect(getRoadmap).toHaveBeenCalledTimes(2));
      expect(vi.mocked(getRoadmap).mock.calls[1][0]).toBe(ROADMAP_ID);
      expect(result.current.pause.isPending).toBe(true);
      expect(invalidatedKeys(invalidateSpy)).not.toContain(LIST_KEY);

      await act(async () => deferred.resolve(refreshed));

      await waitFor(() => expect(result.current.pause.isError).toBe(true));
      expect(result.current.pause.error).toBe(error);
      expect(getDetail(queryClient)).toEqual(refreshed);
      expect(invalidatedKeys(invalidateSpy)).toContain(LIST_KEY);
      expect(invalidatedKeys(invalidateSpy)).not.toContain(ALL_KEY);
    },
  );

  it("409 + refetch fallido: el error sigue siendo el original", async () => {
    const error = buildRoadmapVersionConflictError();
    vi.mocked(getRoadmap)
      .mockResolvedValueOnce(ROADMAP_DETAIL)
      .mockRejectedValueOnce(buildAxiosError(500));
    vi.mocked(setRoadmapPaused).mockRejectedValue(error);
    const { result, invalidateSpy } = await renderWithDetail();

    act(() => result.current.pause.mutate(PAUSE_BODY));

    await waitFor(() => expect(result.current.pause.isError).toBe(true));
    expect(result.current.pause.error).toBe(error);
    expect(getRoadmap).toHaveBeenCalledTimes(2);
    expect(invalidatedKeys(invalidateSpy)).toContain(LIST_KEY);
  });

  it.each([
    ["red", buildNetworkError()],
    ["500", buildAxiosError(500)],
    ["401", buildAxiosError(401)],
    ["400", buildAxiosError(400)],
    ["409 con otro code", buildAxiosError(409, "x", { code: "ROADMAP_PAUSED" })],
  ])("%s: no refetchea, no invalida y deja la caché intacta", async (_label, error) => {
    vi.mocked(getRoadmap).mockResolvedValueOnce(ROADMAP_DETAIL);
    vi.mocked(setRoadmapPaused).mockRejectedValue(error);
    const { result, queryClient, invalidateSpy } = await renderWithDetail();
    const before = getDetail(queryClient);
    const listBefore = queryClient.getQueryData(roadmapsKeys.list());

    act(() => result.current.pause.mutate(PAUSE_BODY));

    await waitFor(() => expect(result.current.pause.isError).toBe(true));
    expect(result.current.pause.error).toBe(error);
    expect(getRoadmap).toHaveBeenCalledTimes(1);
    expect(invalidateSpy).not.toHaveBeenCalled();
    expect(getDetail(queryClient)).toBe(before);
    expect(queryClient.getQueryData(roadmapsKeys.list())).toBe(listBefore);
  });
});
