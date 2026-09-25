import { describe, expect, it } from "vitest";
import { removeRoadmapFromList } from "@/api/queries/roadmaps";
import { buildRoadmapSummary, buildRoadmapsListResult } from "@/test/fixtures/roadmaps";
import type { RoadmapCounts, RoadmapStatus } from "@/types";

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
