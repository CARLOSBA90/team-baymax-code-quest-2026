import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ROADMAPS_MOCK, ROADMAPS_MOCK_LATENCY_MS } from "@/api/mocks/roadmaps";
import { getRoadmaps, ROADMAPS_LIST_LIMIT, toRoadmapSummary } from "@/api/services";
import { ROADMAPS_LIST_RESULT } from "@/test/fixtures/roadmaps";

async function resolveRoadmaps() {
  const promise = getRoadmaps();
  await vi.advanceTimersByTimeAsync(ROADMAPS_MOCK_LATENCY_MS);
  return promise;
}

describe("roadmaps.service", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("getRoadmaps sigue pendiente antes de la latencia simulada", async () => {
    let settled = false;
    const promise = getRoadmaps().then(() => {
      settled = true;
    });

    await vi.advanceTimersByTimeAsync(ROADMAPS_MOCK_LATENCY_MS - 1);
    expect(settled).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    await promise;
    expect(settled).toBe(true);
  });

  it("devuelve las 5 rutas en el orden del mock, sin filtrar", async () => {
    const result = await resolveRoadmaps();

    expect(result.items.map((roadmap) => roadmap.id)).toEqual([
      "rm-frontend-react",
      "rm-backend-nest",
      "rm-js-ts",
      "rm-flutter",
      "rm-devops",
    ]);
  });

  it("calcula counts globales y meta con limit 100", async () => {
    const result = await resolveRoadmaps();

    expect(result.counts).toEqual({
      all: 5,
      notStarted: 0,
      inProgress: 2,
      paused: 1,
      completed: 2,
    });
    expect(result.meta).toEqual({ total: 5, page: 1, limit: ROADMAPS_LIST_LIMIT, totalPages: 1 });
    expect(ROADMAPS_LIST_LIMIT).toBe(100);
  });

  it("mapea snake_case a camelCase sin dejar claves snake", async () => {
    const result = await resolveRoadmaps();
    const frontend = result.items[0];

    expect(frontend).toMatchObject({
      name: "Frontend moderno con React",
      totalCourses: 7,
      level: "intermediate",
      monogram: "FE",
      accent: "violet",
      pausedAt: null,
    });
    expect(result.items[1].pausedAt).toBe(ROADMAPS_MOCK[1].paused_at);
    for (const item of result.items) {
      expect(Object.keys(item).some((key) => key.includes("_"))).toBe(false);
    }
  });

  it("coincide con el fixture ROADMAPS_LIST_RESULT", async () => {
    await expect(resolveRoadmaps()).resolves.toEqual(ROADMAPS_LIST_RESULT);
  });

  it("devuelve objetos nuevos y no muta ROADMAPS_MOCK", async () => {
    const snapshot = structuredClone(ROADMAPS_MOCK);
    const result = await resolveRoadmaps();

    result.items[0].name = "Cambiado";
    expect(ROADMAPS_MOCK).toEqual(snapshot);
  });

  it("toRoadmapSummary omite monogram/accent si el backend no los envía", () => {
    const { monogram: _monogram, accent: _accent, ...dto } = ROADMAPS_MOCK[0];
    const summary = toRoadmapSummary(dto);

    expect("monogram" in summary).toBe(false);
    expect("accent" in summary).toBe(false);
    expect(summary.totalItems).toBe(dto.total_items);
    expect(summary.activityVersion).toBe(dto.activity_version);
    expect(summary.lastActivity).toBe(dto.last_activity);
  });
});
