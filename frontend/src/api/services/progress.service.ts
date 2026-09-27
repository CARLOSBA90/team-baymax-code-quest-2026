import { post } from "@/api/client";
import type {
  TrackItemCompletionBody,
  TrackLessonCompletionBody,
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
 * `POST /progress/track` compartido: envía el body exacto que se le pase y mapea la respuesta con
 * `toTrackProgressResult`. Los errores (AxiosError) se propagan sin transformar.
 */
function postTrackProgress<TBody extends TrackItemCompletionBody | TrackLessonCompletionBody>(
  body: TBody,
): Promise<TrackProgressResult> {
  return post<TrackProgressResponseDto, TBody>("/progress/track", body).then(toTrackProgressResult);
}

/**
 * Marca un paso como completado: `POST /progress/track` con `{ roadmap_item_id, completed: true }`
 * (el back rechaza campos extra).
 */
export function trackItemCompletion(roadmapItemId: string): Promise<TrackProgressResult> {
  return postTrackProgress<TrackItemCompletionBody>({
    roadmap_item_id: roadmapItemId,
    completed: true,
  });
}

/**
 * Marca o desmarca una lección de un ítem `LESSONS`: `POST /progress/track` con
 * `{ roadmap_item_id, lesson_id, completed }` (reversible, a diferencia de `trackItemCompletion`).
 */
export function trackLessonCompletion(
  roadmapItemId: string,
  lessonId: string,
  completed: boolean,
): Promise<TrackProgressResult> {
  return postTrackProgress<TrackLessonCompletionBody>({
    roadmap_item_id: roadmapItemId,
    lesson_id: lessonId,
    completed,
  });
}
