import { describe, expect, it } from "vitest";
import type { TrackProgressVariables } from "@/api/queries/roadmaps";
import { applyTrackProgressResult, removeRoadmapFromList } from "@/api/queries/roadmaps";
import { buildTrackProgressResult } from "@/test/fixtures/progress";
import { buildRoadmapDetail } from "@/test/fixtures/roadmap-detail";
import { buildRoadmapSummary, buildRoadmapsListResult } from "@/test/fixtures/roadmaps";
import type { RoadmapCounts, RoadmapDetail, RoadmapStatus } from "@/types";

function itemVariables(roadmapItemId: string): TrackProgressVariables {
  return { kind: "item", roadmapItemId };
}

const STATUS_CASES: [RoadmapStatus, keyof Omit<RoadmapCounts, "all">][] = [
  ["NOT_STARTED", "notStarted"],
  ["IN_PROGRESS", "inProgress"],
  ["PAUSED", "paused"],
  ["COMPLETED", "completed"],
];

function buildMixedList() {
  return buildRoadmapsListResult({
    items: [
      buildRoadmapSummary({ id: "ns", status: "NOT_STARTED" }),
      buildRoadmapSummary({ id: "ip", status: "IN_PROGRESS" }),
      buildRoadmapSummary({ id: "pa", status: "PAUSED" }),
      buildRoadmapSummary({ id: "co", status: "COMPLETED" }),
      buildRoadmapSummary({ id: "ip2", status: "IN_PROGRESS" }),
    ],
  });
}

describe("removeRoadmapFromList", () => {
  it.each(STATUS_CASES)(
    "quita una ruta %s y decrementa all, %s y meta.total",
    (status, countKey) => {
      const list = buildMixedList();
      const target = list.items.find((item) => item.status === status);
      if (!target) throw new Error("fixture sin ruta del estado");

      const result = removeRoadmapFromList(list, target.id);

      expect(result.items.map((item) => item.id)).not.toContain(target.id);
      expect(result.items).toHaveLength(list.items.length - 1);
      expect(result.counts).toEqual({
        ...list.counts,
        all: list.counts.all - 1,
        [countKey]: list.counts[countKey] - 1,
      });
      expect(result.meta).toEqual({ ...list.meta, total: list.meta.total - 1 });
    },
  );

  it("devuelve el mismo objeto si el id no está en la lista", () => {
    const list = buildMixedList();

    expect(removeRoadmapFromList(list, "no-existe")).toBe(list);
  });

  it("nunca deja contadores ni meta.total por debajo de 0", () => {
    const list = buildRoadmapsListResult({
      items: [buildRoadmapSummary({ id: "ip", status: "IN_PROGRESS" })],
      counts: { all: 0, inProgress: 0 },
    });
    const inconsistent = { ...list, meta: { ...list.meta, total: 0 } };

    const result = removeRoadmapFromList(inconsistent, "ip");

    expect(result.items).toEqual([]);
    expect(result.counts.all).toBe(0);
    expect(result.counts.inProgress).toBe(0);
    expect(result.meta.total).toBe(0);
  });

  it("no muta la entrada", () => {
    const list = buildMixedList();
    const snapshot = structuredClone(list);

    removeRoadmapFromList(list, "ip");

    expect(list).toEqual(snapshot);
  });
});

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

const LAST_ACTIVITY = "2026-09-25T11:00:00.000Z";

describe("applyTrackProgressResult", () => {
  it("pone el ítem al progreso de la respuesta y completedAt = lastActivity si era null", () => {
    const detail = buildRoadmapDetail();

    const patched = applyTrackProgressResult(
      detail,
      itemVariables("item-3"),
      buildTrackProgressResult(),
    );
    const item = patched.items.find((it) => it.roadmapItemId === "item-3");

    expect(item?.progress).toBe(100);
    expect(item?.completedAt).toBe(LAST_ACTIVITY);
  });

  it("conserva completedAt si el ítem ya lo tenía", () => {
    const detail = buildRoadmapDetail();

    const patched = applyTrackProgressResult(
      detail,
      itemVariables("item-1"),
      buildTrackProgressResult({ roadmapItemId: "item-1" }),
    );

    expect(patched.items[0].completedAt).toBe("2026-09-15T17:00:00.000Z");
  });

  it("no inventa completedAt si la respuesta no marca completed", () => {
    const patched = applyTrackProgressResult(
      buildRoadmapDetail(),
      itemVariables("item-3"),
      buildTrackProgressResult({ progress: 50, completed: false }),
    );

    expect(patched.items[2]).toMatchObject({ progress: 50, completedAt: null });
  });

  it("copia progress, status, lastActivity y activityVersion de la ruta", () => {
    const patched = applyTrackProgressResult(
      buildRoadmapDetail(),
      itemVariables("item-3"),
      buildTrackProgressResult(),
    );

    expect(patched).toMatchObject({
      progress: 60,
      status: "IN_PROGRESS",
      lastActivity: LAST_ACTIVITY,
      activityVersion: 7,
      pausedAt: null,
    });
  });

  it("anula pausedAt cuando la ruta queda COMPLETED", () => {
    const detail = buildRoadmapDetail({ pausedAt: "2026-09-03T12:00:00.000Z" });
    const base = buildTrackProgressResult();

    const patched = applyTrackProgressResult(detail, itemVariables("item-3"), {
      ...base,
      roadmap: { ...base.roadmap, status: "COMPLETED", progress: 100 },
    });

    expect(patched.status).toBe("COMPLETED");
    expect(patched.pausedAt).toBeNull();
  });

  it("conserva pausedAt si la ruta no queda COMPLETED", () => {
    const detail = buildRoadmapDetail({ pausedAt: "2026-09-03T12:00:00.000Z" });

    const patched = applyTrackProgressResult(
      detail,
      itemVariables("item-3"),
      buildTrackProgressResult(),
    );

    expect(patched.pausedAt).toBe("2026-09-03T12:00:00.000Z");
  });

  it("anula nextStep si apuntaba al ítem completado", () => {
    const patched = applyTrackProgressResult(
      buildRoadmapDetail(),
      itemVariables("item-2"),
      buildTrackProgressResult({ roadmapItemId: "item-2" }),
    );

    expect(patched.nextStep).toBeNull();
  });

  it("deja nextStep intacto si apunta a otro ítem", () => {
    const detail = buildRoadmapDetail();

    const patched = applyTrackProgressResult(
      detail,
      itemVariables("item-3"),
      buildTrackProgressResult(),
    );

    expect(patched.nextStep).toBe(detail.nextStep);
  });

  it("con el ítem ausente solo actualiza los campos de ruta", () => {
    const detail = buildRoadmapDetail();

    const patched = applyTrackProgressResult(
      detail,
      itemVariables("missing"),
      buildTrackProgressResult({ roadmapItemId: "missing" }),
    );

    expect(patched.items).toEqual(detail.items);
    expect(patched.progress).toBe(60);
    expect(patched.nextStep).toBe(detail.nextStep);
  });

  it("mantiene la misma referencia en los demás ítems", () => {
    const detail = buildRoadmapDetail();

    const patched = applyTrackProgressResult(
      detail,
      itemVariables("item-3"),
      buildTrackProgressResult(),
    );

    expect(patched.items[0]).toBe(detail.items[0]);
    expect(patched.items[1]).toBe(detail.items[1]);
    expect(patched.items[3]).toBe(detail.items[3]);
    expect(patched.items[2]).not.toBe(detail.items[2]);
  });

  it("no muta el detalle de entrada", () => {
    const detail = deepFreeze(buildRoadmapDetail());
    const snapshot = structuredClone(detail);

    applyTrackProgressResult(
      detail,
      itemVariables("item-2"),
      buildTrackProgressResult({ roadmapItemId: "item-2" }),
    );

    expect(detail).toEqual(snapshot);
  });

  describe('variables.kind === "lesson"', () => {
    function lessonVariables(
      roadmapItemId: string,
      lessonId: string,
      completed: boolean,
    ): TrackProgressVariables {
      return { kind: "lesson", roadmapItemId, lessonId, completed };
    }

    it("marca la lección correcta y recalcula completedLessons", () => {
      const detail = buildRoadmapDetail();
      const item1 = detail.items.find((i) => i.roadmapItemId === "item-1");
      if (!item1?.syllabus) throw new Error("fixture sin syllabus en item-1");
      // item-1 llega con sus 4 lecciones completadas; se desmarca una para ejercer el recálculo.
      const withOnePending: RoadmapDetail = {
        ...detail,
        items: detail.items.map((item) =>
          item.roadmapItemId === "item-1" && item.syllabus
            ? {
                ...item,
                syllabus: {
                  ...item.syllabus,
                  completedLessons: 3,
                  sections: item.syllabus.sections.map((section) => ({
                    ...section,
                    lessons: section.lessons.map((lesson) =>
                      lesson.lessonId === "lesson-2" ? { ...lesson, completed: false } : lesson,
                    ),
                  })),
                },
              }
            : item,
        ),
      };

      const patched = applyTrackProgressResult(
        withOnePending,
        lessonVariables("item-1", "lesson-2", true),
        buildTrackProgressResult(),
      );
      const patchedItem = patched.items.find((i) => i.roadmapItemId === "item-1");
      const patchedLesson = patchedItem?.syllabus?.sections
        .flatMap((section) => section.lessons)
        .find((lesson) => lesson.lessonId === "lesson-2");

      expect(patchedLesson?.completed).toBe(true);
      expect(patchedItem?.syllabus?.completedLessons).toBe(4);
    });

    it("desmarcar recalcula completedLessons a la baja", () => {
      const detail = buildRoadmapDetail();

      const patched = applyTrackProgressResult(
        detail,
        lessonVariables("item-1", "lesson-2", false),
        buildTrackProgressResult(),
      );
      const patchedItem = patched.items.find((i) => i.roadmapItemId === "item-1");

      expect(patchedItem?.syllabus?.completedLessons).toBe(3);
    });

    it("no muta el syllabus de entrada", () => {
      const detail = deepFreeze(buildRoadmapDetail());
      const snapshot = structuredClone(detail);

      applyTrackProgressResult(
        detail,
        lessonVariables("item-1", "lesson-2", false),
        buildTrackProgressResult(),
      );

      expect(detail).toEqual(snapshot);
    });

    it("con kind item no toca el syllabus del ítem (regresión)", () => {
      const detail = buildRoadmapDetail();

      const patched = applyTrackProgressResult(
        detail,
        itemVariables("item-1"),
        buildTrackProgressResult({ roadmapItemId: "item-1" }),
      );
      const patchedItem = patched.items.find((i) => i.roadmapItemId === "item-1");

      expect(patchedItem?.syllabus).toBe(detail.items[0].syllabus);
    });

    it("si el ítem no tiene syllabus, lo deja tal cual (null)", () => {
      const detail = buildRoadmapDetail();

      const patched = applyTrackProgressResult(
        detail,
        lessonVariables("item-3", "lesson-x", true),
        buildTrackProgressResult(),
      );
      const patchedItem = patched.items.find((i) => i.roadmapItemId === "item-3");

      expect(patchedItem?.syllabus).toBeNull();
    });
  });
});
