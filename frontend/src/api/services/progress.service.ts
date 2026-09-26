import { post } from "@/api/client";
import type {
  TrackItemCompletionBody,
  TrackProgressResponseDto,
  TrackProgressResult,
} from "@/types";

/**
 * Mapea el `data` de `POST /progress/track` campo a campo (nunca spread): `status` del ítem,
 * `progress_version`, `resume`, `lessons`, `submission` y cualquier extra se descartan.
 */
export function toTrackProgressResult(dto: TrackProgressResponseDto): TrackProgressResult {
  return {
    roadmapItemId: dto.roadmap_item_id,
    progress: dto.progress,
    completed: dto.completed,
    roadmap: {
      id: dto.roadmap.id,
      progress: dto.roadmap.progress,
      status: dto.roadmap.status,
      lastActivity: dto.roadmap.last_activity,
      activityVersion: dto.roadmap.activity_version,
    },
  };
}

/**
 * Marca un paso como completado: `POST /progress/track` con `{ roadmap_item_id, completed: true }`
 * (el back rechaza campos extra). Los errores (AxiosError) se propagan sin transformar.
 */
export async function trackItemCompletion(roadmapItemId: string): Promise<TrackProgressResult> {
  const dto = await post<TrackProgressResponseDto, TrackItemCompletionBody>("/progress/track", {
    roadmap_item_id: roadmapItemId,
    completed: true,
  });
  return toTrackProgressResult(dto);
}
