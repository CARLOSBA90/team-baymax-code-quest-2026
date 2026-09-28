import type { AxiosResponse } from "axios";
import { describe, expect, it, vi } from "vitest";
import { apiClient, del, get, patch } from "@/api/client";
import {
  deleteRoadmap,
  getRoadmap,
  getRoadmaps,
  ROADMAPS_LIST_LIMIT,
  setRoadmapPaused,
  toRoadmapDetail,
  toRoadmapSummary,
} from "@/api/services";
import { buildAxiosError, buildNetworkError } from "@/test/fixtures/api-errors";
import {
  buildRoadmapDetailDto,
  ROADMAP_DETAIL,
  ROADMAP_DETAIL_DTO,
} from "@/test/fixtures/roadmap-detail";
import {
  buildPausedRoadmapDetailDto,
  buildPausedRoadmapDetailResult,
  buildRoadmapVersionConflictError,
} from "@/test/fixtures/roadmap-pause";
import {
  buildRoadmapsListResponseDto,
  EMPTY_ROADMAPS_RESULT,
  ROADMAP_SUMMARY_DTOS,
  ROADMAPS_LIST_RESULT,
} from "@/test/fixtures/roadmaps";
import type { RoadmapDetailDto, RoadmapItemDto, RoadmapsListResponseDto } from "@/types";

vi.mock("@/api/client", () => ({
  apiClient: { get: vi.fn() },
  del: vi.fn(),
  get: vi.fn(),
  patch: vi.fn(),
}));

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

  it("deleteRoadmap envía DELETE /roadmaps/{id} y resuelve con el id desenvuelto", async () => {
    vi.mocked(del).mockResolvedValue({ id: "fe" });

    await expect(deleteRoadmap("fe")).resolves.toEqual({ id: "fe" });
    expect(del).toHaveBeenCalledTimes(1);
    expect(del).toHaveBeenCalledWith("/roadmaps/fe");
  });

  it("deleteRoadmap codifica el id en la URL", async () => {
    vi.mocked(del).mockResolvedValue({ id: "a/b" });

    await deleteRoadmap("a/b");

    expect(del).toHaveBeenCalledWith("/roadmaps/a%2Fb");
  });

  it("deleteRoadmap propaga el error sin transformarlo", async () => {
    const error = buildAxiosError(404, "Roadmap not found.", { code: "ROADMAP_NOT_FOUND" });
    vi.mocked(del).mockRejectedValue(error);

    await expect(deleteRoadmap("fe")).rejects.toBe(error);
  });
});

/** Todas las claves de un valor, a cualquier nivel de anidación (objetos y arrays). */
function collectKeys(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(collectKeys);
  if (value !== null && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) => [key, ...collectKeys(child)]);
  }
  return [];
}

function mockDetailResponse(dto: RoadmapDetailDto) {
  vi.mocked(get).mockResolvedValue(dto);
}

describe("getRoadmap", () => {
  it("pide GET /roadmaps/:id con el id codificado como segmento", async () => {
    mockDetailResponse(buildRoadmapDetailDto());

    await getRoadmap("a b/c");

    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith("/roadmaps/a%20b%2Fc");
  });

  it("mapea el detalle completo a camelCase (= ROADMAP_DETAIL)", async () => {
    mockDetailResponse(buildRoadmapDetailDto());

    await expect(getRoadmap("rm-frontend-react")).resolves.toEqual(ROADMAP_DETAIL);
  });

  it("toRoadmapDetail coincide con el mapeo escrito a mano del fixture", () => {
    expect(toRoadmapDetail(ROADMAP_DETAIL_DTO)).toEqual(ROADMAP_DETAIL);
  });

  it("no deja ninguna clave snake_case a ningún nivel", async () => {
    mockDetailResponse(buildRoadmapDetailDto());

    const result = await getRoadmap("rm-frontend-react");

    expect(collectKeys(result).filter((key) => key.includes("_"))).toEqual([]);
  });

  it("descarta los campos ignorados del detalle, de los ítems, del tracking y del next_step", async () => {
    const dto = buildRoadmapDetailDto();
    const wire = {
      ...dto,
      reason: "Recommended because…",
      generator: { model: "x" },
      courses: [{ id: "c1" }],
      next_step: dto.next_step,
      content: dto.content.map((item) => ({
        ...item,
        reason: "Recommended because…",
        details: { foo: 1 },
        resume: { lesson_id: "l1" },
        progress_version: 4,
        tracking: { ...item.tracking, report_interval_seconds: 30 },
      })),
    } as unknown as RoadmapDetailDto;
    mockDetailResponse(wire);

    const result = await getRoadmap("rm-frontend-react");

    expect(result).toEqual(ROADMAP_DETAIL);
    const keys = collectKeys(result);
    for (const ignored of [
      "reason",
      "generator",
      "courses",
      "details",
      "resume",
      "progress_version",
      "progressVersion",
      "report_interval_seconds",
      "reportIntervalSeconds",
    ]) {
      expect(keys).not.toContain(ignored);
    }
  });

  it("mapea syllabus campo a campo sin spread, y lo preserva null cuando el DTO lo trae null", async () => {
    const [lessonsItem, noSyllabusItem] = ROADMAP_DETAIL_DTO.content;
    mockDetailResponse(buildRoadmapDetailDto({ content: [lessonsItem, noSyllabusItem] }));

    const result = await getRoadmap("rm-frontend-react");

    expect(result.items[0].syllabus).toEqual({
      totalLessons: lessonsItem.syllabus?.total_lessons,
      completedLessons: lessonsItem.syllabus?.completed_lessons,
      lastLessonId: lessonsItem.syllabus?.last_lesson_id,
      nextLesson: lessonsItem.syllabus?.next_lesson,
      sections: lessonsItem.syllabus?.sections.map((section) => ({
        title: section.title,
        lessons: section.lessons.map((lesson) => ({
          lessonId: lesson.lesson_id,
          title: lesson.title,
          type: lesson.type,
          freePreview: lesson.free_preview,
          completed: lesson.completed,
          positionSeconds: lesson.position_seconds,
        })),
      })),
    });
    expect(result.items[1].syllabus).toBeNull();
    const syllabusKeys = collectKeys(result.items[0].syllabus);
    for (const key of ["total_lessons", "completed_lessons", "last_lesson_id", "lesson_id"]) {
      expect(syllabusKeys).not.toContain(key);
    }
  });

  it("mapea next_step.lesson cuando el próximo paso es LESSONS, y null en otro caso", async () => {
    const withLesson = buildRoadmapDetailDto({
      next_step: {
        roadmap_item_id: "item-1",
        name: "Fundamentos de JavaScript",
        url: null,
        lesson: {
          lesson_id: "lesson-2",
          title: "Operadores y expresiones",
          section_title: "Fundamentos",
          position: 2,
          position_seconds: null,
        },
      },
    });
    mockDetailResponse(withLesson);
    const withLessonResult = await getRoadmap("rm-frontend-react");
    expect(withLessonResult.nextStep?.lesson).toEqual({
      lessonId: "lesson-2",
      title: "Operadores y expresiones",
      sectionTitle: "Fundamentos",
      position: 2,
      positionSeconds: null,
    });

    mockDetailResponse(buildRoadmapDetailDto());
    const withoutLessonResult = await getRoadmap("rm-frontend-react");
    expect(withoutLessonResult.nextStep?.lesson).toBeNull();
  });

  it("next_step null → nextStep null", async () => {
    mockDetailResponse(buildRoadmapDetailDto({ next_step: null }));

    const result = await getRoadmap("rm-frontend-react");

    expect(result.nextStep).toBeNull();
  });

  it("preserva los nulos del ítem como null (no undefined)", async () => {
    const nullItem: RoadmapItemDto = {
      ...ROADMAP_DETAIL_DTO.content[0],
      course_id: null,
      description: null,
      image: null,
      url: null,
      level: null,
      estimated_minutes: null,
      started_at: null,
      completed_at: null,
    };
    mockDetailResponse(buildRoadmapDetailDto({ content: [nullItem] }));

    const [item] = (await getRoadmap("rm-frontend-react")).items;

    expect(item).toMatchObject({
      courseId: null,
      description: null,
      image: null,
      url: null,
      level: null,
      estimatedMinutes: null,
      startedAt: null,
      completedAt: null,
    });
    for (const key of [
      "courseId",
      "description",
      "image",
      "url",
      "level",
      "estimatedMinutes",
      "startedAt",
      "completedAt",
    ] as const) {
      expect(item[key]).toBeNull();
    }
  });

  it("mantiene el progreso decimal intacto en el detalle y en el ítem", async () => {
    const item: RoadmapItemDto = { ...ROADMAP_DETAIL_DTO.content[1], progress: 33.33 };
    mockDetailResponse(buildRoadmapDetailDto({ progress: 33.33, content: [item] }));

    const result = await getRoadmap("rm-frontend-react");

    expect(result.progress).toBe(33.33);
    expect(result.items[0].progress).toBe(33.33);
  });

  it("tolera tipos desconocidos de ítem y de tracking", async () => {
    const item: RoadmapItemDto = {
      ...ROADMAP_DETAIL_DTO.content[2],
      type: "PODCAST",
      tracking: { type: "QUIZ", enabled: true, disabled_reason: null },
    };
    mockDetailResponse(buildRoadmapDetailDto({ content: [item] }));

    const result = await getRoadmap("rm-frontend-react");

    expect(result.items).toHaveLength(1);
    expect(result.items[0].type).toBe("PODCAST");
    expect(result.items[0].tracking.type).toBe("QUIZ");
  });

  it("ordena los ítems por order sin mutar el DTO original", async () => {
    const [first, second, third] = ROADMAP_DETAIL_DTO.content;
    const dto = buildRoadmapDetailDto({ content: [third, first, second] });
    const originalOrder = dto.content.map((item) => item.order);
    mockDetailResponse(dto);

    const result = await getRoadmap("rm-frontend-react");

    expect(result.items.map((item) => item.order)).toEqual([1, 2, 3]);
    expect(dto.content.map((item) => item.order)).toEqual(originalOrder);
    expect(originalOrder).toEqual([3, 1, 2]);
  });

  it("propaga el mismo error cuando la petición falla (404)", async () => {
    const error = buildAxiosError(404, "Roadmap not found.", { code: "ROADMAP_NOT_FOUND" });
    vi.mocked(get).mockRejectedValue(error);

    await expect(getRoadmap("x")).rejects.toBe(error);
  });
});

describe("setRoadmapPaused", () => {
  it("envía un único PATCH /roadmaps/:id/pause con el body exacto", async () => {
    vi.mocked(patch).mockResolvedValue(buildPausedRoadmapDetailDto());

    await setRoadmapPaused("r1", { paused: true, expectedActivityVersion: 7 });

    expect(patch).toHaveBeenCalledTimes(1);
    expect(patch).toHaveBeenCalledWith("/roadmaps/r1/pause", {
      paused: true,
      expectedActivityVersion: 7,
    });
  });

  it("no reenvía claves extra del objeto recibido", async () => {
    vi.mocked(patch).mockResolvedValue(buildPausedRoadmapDetailDto());
    const body = { paused: false, expectedActivityVersion: 3, status: "PAUSED", id: "x" };

    await setRoadmapPaused("r1", body);

    const sent = vi.mocked(patch).mock.calls[0][1];
    expect(sent).toEqual({ paused: false, expectedActivityVersion: 3 });
    expect(Object.keys(sent as object).sort()).toEqual(["expectedActivityVersion", "paused"]);
  });

  it("codifica el id como segmento de la URL", async () => {
    vi.mocked(patch).mockResolvedValue(buildPausedRoadmapDetailDto());

    await setRoadmapPaused("a/b c", { paused: true, expectedActivityVersion: 1 });

    expect(vi.mocked(patch).mock.calls[0][0]).toBe("/roadmaps/a%2Fb%20c/pause");
  });

  it("mapea la respuesta con el mismo mapeo que el detalle (PAUSED, ordenado, sin extras)", async () => {
    const dto = buildPausedRoadmapDetailDto();
    vi.mocked(patch).mockResolvedValue(dto);

    const result = await setRoadmapPaused("r1", { paused: true, expectedActivityVersion: 7 });

    expect(result).toEqual(toRoadmapDetail(dto));
    expect(result).toEqual(buildPausedRoadmapDetailResult());
    expect(result.status).toBe("PAUSED");
    expect(result.pausedAt).toBe("2026-09-25T11:30:00.000Z");
    expect(result.activityVersion).toBe(8);
    expect(result.items.map((item) => item.order)).toEqual([1, 2, 3, 4]);
    expect(collectKeys(result)).not.toContain("reason");
    expect(collectKeys(result)).not.toContain("courses");
  });

  it("propaga el AxiosError original (409)", async () => {
    const error = buildRoadmapVersionConflictError();
    vi.mocked(patch).mockRejectedValue(error);

    await expect(setRoadmapPaused("r1", { paused: true, expectedActivityVersion: 7 })).rejects.toBe(
      error,
    );
  });
});
