import type { AxiosResponse } from "axios";
import { describe, expect, it, vi } from "vitest";
import { apiClient } from "@/api/client";
import { getRoadmaps, ROADMAPS_LIST_LIMIT, toRoadmapSummary } from "@/api/services";
import { buildNetworkError } from "@/test/fixtures/api-errors";
import {
  buildRoadmapsListResponseDto,
  EMPTY_ROADMAPS_RESULT,
  ROADMAP_SUMMARY_DTOS,
  ROADMAPS_LIST_RESULT,
} from "@/test/fixtures/roadmaps";
import type { RoadmapsListResponseDto } from "@/types";

vi.mock("@/api/client", () => ({ apiClient: { get: vi.fn() } }));

function mockListResponse(body: RoadmapsListResponseDto) {
  vi.mocked(apiClient.get).mockResolvedValue({
    data: body,
  } as AxiosResponse<RoadmapsListResponseDto>);
}

describe("roadmaps.service", () => {
  it("ROADMAPS_LIST_LIMIT no supera el MAX_PAGE_SIZE del backend (100)", () => {
    expect(ROADMAPS_LIST_LIMIT).toBe(100);
  });

  it("getRoadmaps pide GET /roadmaps una sola vez con limit=100 y sin status ni page", async () => {
    mockListResponse(buildRoadmapsListResponseDto());

    await getRoadmaps();

    expect(apiClient.get).toHaveBeenCalledTimes(1);
    expect(apiClient.get).toHaveBeenCalledWith("/roadmaps", {
      params: { limit: ROADMAPS_LIST_LIMIT },
    });
  });

  it("devuelve las rutas en el orden del backend, mapeadas, con meta y counts", async () => {
    mockListResponse(buildRoadmapsListResponseDto());

    await expect(getRoadmaps()).resolves.toEqual(ROADMAPS_LIST_RESULT);
  });

  it("mapea snake_case a camelCase sin dejar claves snake", async () => {
    mockListResponse(buildRoadmapsListResponseDto());

    const result = await getRoadmaps();

    expect(result.items[0]).toMatchObject({
      name: "Frontend moderno con React",
      totalCourses: 7,
      totalItems: 24,
      activityVersion: 12,
      lastActivity: "2026-09-21T18:30:00.000Z",
      level: "intermediate",
      pausedAt: null,
    });
    expect(result.items[1].pausedAt).toBe(ROADMAP_SUMMARY_DTOS[1].paused_at);
    for (const item of result.items) {
      expect(Object.keys(item).some((key) => key.includes("_"))).toBe(false);
    }
  });

  it("devuelve un listado vacío con counts a 0 y totalPages 0", async () => {
    mockListResponse(buildRoadmapsListResponseDto([]));

    await expect(getRoadmaps()).resolves.toEqual(EMPTY_ROADMAPS_RESULT);
  });

  it("no comparte referencias con la respuesta del cable", async () => {
    const body = buildRoadmapsListResponseDto();
    mockListResponse(body);

    const result = await getRoadmaps();

    expect(result.meta).not.toBe(body.meta);
    expect(result.counts).not.toBe(body.counts);
    expect(result.items[0]).not.toBe(body.data[0]);
  });

  it("propaga el mismo error cuando la petición falla", async () => {
    const error = buildNetworkError();
    vi.mocked(apiClient.get).mockRejectedValue(error);

    await expect(getRoadmaps()).rejects.toBe(error);
  });

  it("toRoadmapSummary omite monogram/accent si el backend no los envía", () => {
    const { monogram: _monogram, accent: _accent, ...dto } = ROADMAP_SUMMARY_DTOS[0];
    const summary = toRoadmapSummary(dto);

    expect("monogram" in summary).toBe(false);
    expect("accent" in summary).toBe(false);
    expect(summary.totalItems).toBe(dto.total_items);
    expect(summary.activityVersion).toBe(dto.activity_version);
    expect(summary.lastActivity).toBe(dto.last_activity);
  });

  it("toRoadmapSummary conserva monogram/accent si vienen", () => {
    expect(toRoadmapSummary(ROADMAP_SUMMARY_DTOS[0])).toMatchObject({
      monogram: "FE",
      accent: "violet",
    });
  });
});
