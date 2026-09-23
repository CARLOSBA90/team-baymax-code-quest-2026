import { describe, expect, it } from "vitest";
import {
  filterRoadmaps,
  getRoadmapFilterStatus,
  parseRoadmapFilter,
  ROADMAP_FILTERS,
  ROADMAP_STATUS_PARAM,
} from "@/lib";
import { buildRoadmapSummary, ROADMAPS_LIST_RESULT } from "@/test/fixtures/roadmaps";

const ITEMS = ROADMAPS_LIST_RESULT.items;

function ids(items: { id: string }[]) {
  return items.map((item) => item.id);
}

describe("ROADMAP_FILTERS", () => {
  it("define Todas / Empezadas / En pausa / Completadas en orden con su count", () => {
    expect(ROADMAP_FILTERS.map(({ value, label, countKey }) => [value, label, countKey])).toEqual([
      ["all", "Todas", "all"],
      ["in_progress", "Empezadas", "inProgress"],
      ["paused", "En pausa", "paused"],
      ["completed", "Completadas", "completed"],
    ]);
    expect(ROADMAP_STATUS_PARAM).toBe("status");
  });
});

describe("parseRoadmapFilter", () => {
  it.each(["in_progress", "paused", "completed", "all"] as const)("acepta %s", (value) => {
    expect(parseRoadmapFilter(value)).toBe(value);
  });

  it.each([null, "", "foo", "not_started", "PAUSED"])("%s → all", (value) => {
    expect(parseRoadmapFilter(value)).toBe("all");
  });
});

describe("getRoadmapFilterStatus", () => {
  it("mapea filtro a estado", () => {
    expect(getRoadmapFilterStatus("all")).toBeUndefined();
    expect(getRoadmapFilterStatus("in_progress")).toBe("IN_PROGRESS");
    expect(getRoadmapFilterStatus("paused")).toBe("PAUSED");
    expect(getRoadmapFilterStatus("completed")).toBe("COMPLETED");
  });
});

describe("filterRoadmaps", () => {
  it("all devuelve todas en el orden original", () => {
    expect(ids(filterRoadmaps(ITEMS, "all"))).toEqual(ids(ITEMS));
  });

  it("in_progress devuelve FE y MO", () => {
    expect(ids(filterRoadmaps(ITEMS, "in_progress"))).toEqual(["rm-frontend-react", "rm-flutter"]);
  });

  it("paused y completed devuelven solo su estado", () => {
    expect(ids(filterRoadmaps(ITEMS, "paused"))).toEqual(["rm-backend-nest"]);
    expect(ids(filterRoadmaps(ITEMS, "completed"))).toEqual(["rm-js-ts", "rm-devops"]);
  });

  it("devuelve [] si no hay coincidencias", () => {
    const withoutPaused = ITEMS.filter((item) => item.status !== "PAUSED");
    expect(filterRoadmaps(withoutPaused, "paused")).toEqual([]);
  });

  it("NOT_STARTED solo aparece en all", () => {
    const notStarted = buildRoadmapSummary({ id: "rm-new", status: "NOT_STARTED" });
    const items = [...ITEMS, notStarted];

    expect(ids(filterRoadmaps(items, "all"))).toContain("rm-new");
    for (const filter of ["in_progress", "paused", "completed"] as const) {
      expect(ids(filterRoadmaps(items, filter))).not.toContain("rm-new");
    }
  });

  it("no muta la entrada", () => {
    const items = [...ITEMS];
    const snapshot = structuredClone(items);

    const all = filterRoadmaps(items, "all");
    filterRoadmaps(items, "completed");

    expect(all).not.toBe(items);
    expect(items).toEqual(snapshot);
  });
});
