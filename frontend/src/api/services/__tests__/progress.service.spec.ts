import { describe, expect, it, vi } from "vitest";
import { post } from "@/api/client";
import { toTrackProgressResult, trackItemCompletion } from "@/api/services";
import { buildRoadmapPausedError, buildTrackProgressResult } from "@/test/fixtures/progress";
import type { TrackProgressResponseDto } from "@/types";

vi.mock("@/api/client", () => ({ post: vi.fn() }));

/** `data` del 200 tal cual llega del back, con los campos que el front descarta. */
const WIRE_RESPONSE = {
  roadmap_item_id: "item-3",
  progress: 100,
  status: "COMPLETED",
  completed: true,
  progress_version: 2,
  resume: null,
  lessons: null,
  submission: null,
  roadmap: {
    id: "r1",
    progress: 60,
    status: "IN_PROGRESS",
    last_activity: "2026-09-25T11:00:00.000Z",
    activity_version: 7,
  },
} satisfies TrackProgressResponseDto & Record<string, unknown>;

describe("trackItemCompletion", () => {
  it("hace un único POST a /progress/track con el cuerpo exacto", async () => {
    vi.mocked(post).mockResolvedValue(WIRE_RESPONSE);

    await trackItemCompletion("item-3");

    expect(post).toHaveBeenCalledTimes(1);
    const [url, body] = vi.mocked(post).mock.calls[0];
    expect(url).toBe("/progress/track");
    expect(body).toEqual({ roadmap_item_id: "item-3", completed: true });
    expect(Object.keys(body as object).sort()).toEqual(["completed", "roadmap_item_id"]);
  });

  it("mapea la respuesta 200 campo a campo y descarta el resto", async () => {
    vi.mocked(post).mockResolvedValue(WIRE_RESPONSE);

    const result = await trackItemCompletion("item-3");

    expect(result).toEqual(buildTrackProgressResult());
    for (const key of ["lessons", "submission", "resume", "progressVersion", "status"]) {
      expect(result).not.toHaveProperty(key);
    }
  });

  it("propaga el AxiosError original", async () => {
    const error = buildRoadmapPausedError();
    vi.mocked(post).mockRejectedValue(error);

    await expect(trackItemCompletion("item-3")).rejects.toBe(error);
    expect(error.response?.status).toBe(409);
    expect(error.response?.data).toMatchObject({ code: "ROADMAP_PAUSED" });
  });
});

describe("toTrackProgressResult", () => {
  it("no copia campos extra de la ruta", () => {
    const dto = {
      ...WIRE_RESPONSE,
      roadmap: { ...WIRE_RESPONSE.roadmap, name: "extra" },
    };

    expect(toTrackProgressResult(dto).roadmap).toEqual(buildTrackProgressResult().roadmap);
  });
});
