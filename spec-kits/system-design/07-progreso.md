# 07 — Progreso del Usuario

> **Implementación vigente:** cada `RoadmapItem` tiene un `Progress`
> con `percentage` entero entre 0 y 100 y `version` para concurrencia optimista.
> El porcentaje de la ruta es
> `floor(sum(item.percentage) / totalItems)` y no se persiste por duplicado.
> Los estados `NOT_STARTED`, `IN_PROGRESS`, `PAUSED` y `COMPLETED` se derivan de
> los porcentajes y `Roadmap.pausedAt`. Los enfoques históricos descritos más
> abajo quedan como alternativas de diseño, no como contrato implementado.

Los endpoints vigentes son:

```text
POST  /api/v1/progress/track                         # único punto para reportar avance
GET   /api/v1/progress/roadmap/:roadmapId            # lectura del estado
PATCH /api/v1/roadmaps/:id/pause
PATCH /api/v1/admin/challenge-submissions/:id/review # evaluación del administrador
```

No existe un endpoint para fijar porcentajes a mano: todo avance pasa por
`track` y el backend lo calcula según la política del item. Un cambio efectivo
incrementa la versión del item y la actividad de la ruta; un reporte sin cambios
(marcar de nuevo algo completado, la misma posición de video) no escribe nada.
Una ruta pausada rechaza reportes.

El cliente solo manda `roadmap_item_id` y el dato que corresponde al
`tracking.type` del item; el backend deduce el tipo y rechaza con 422
`TRACKING_REPORT_MISMATCH` un campo que no corresponda:

| `tracking.type` | Qué significa | Campo |
| --- | --- | --- |
| `LESSONS` | Curso con temario: el estudiante marca cada lección; el curso avanza `lecciones marcadas / total` | `lesson_id` + `completed` (`true` marca, `false` desmarca), o `lesson_id` + `position_seconds` para guardar el segundo del video de la lección |
| `COMPLETION` | Curso sin temario: se completa cuando el estudiante lo marca | `completed: true` |
| `READING` | Lectura: se completa al marcarla como leída | `completed: true` |
| `VIDEO` | Video integrado: avance por posición máxima, guarda posición para reanudar | `position_seconds` |
| `CHALLENGE` | Reto: entrega pendiente de revisión; llega a 100 solo al aprobarse | `submission` |

No hay `event_id`: el backend evita duplicados por su cuenta. Completar o
reportar la misma posición es idempotente por estado, y una entrega de reto con
el mismo contenido dentro de 10 minutos se reconoce por su huella y no se guarda
dos veces. Una entrega `FILE` se envía como multipart (`roadmap_item_id`,
`submission` como texto JSON `{"type":"FILE"}` y `file`); el archivo se guarda
en almacenamiento privado y se elimina si la entrega no llega a persistirse.

### Temario por curso

El catálogo guarda el temario de cada curso en `course_lesson` (sección, orden,
título, tipo `VIDEO`/`TEXT`/`OTHER` y si es prueba gratis). Se obtiene de la
página pública de DevTalles con `scripts/scrape-devtalles.ts --solo-temario`
(escribe `prisma/seed/syllabus.json` sin tocar `courses.csv`) y se carga con
`pnpm seed -- --solo-temario`. Al generar una ruta, cada curso copia su temario
en el item (`contentData.syllabus`) con `tracking.type = LESSONS`; reimportar el
catálogo no altera rutas existentes.

Las lecciones se ven en DevTalles, así que el avance es declarado por lección,
no medido por reproducción. Las páginas no publican la duración de cada lección:
todas pesan lo mismo y el porcentaje entero se trunca (1 de 390 lecciones = 0 %),
por lo que la UI debe mostrar también `lessons.completed / lessons.total`.

El detalle de la ruta expone por curso `syllabus: { total_lessons,
completed_lessons, last_lesson_id, next_lesson, sections: [{ title, lessons:
[{ lesson_id, title, type, free_preview, completed }] }] }`; `track` y
`GET /progress/roadmap/:id` devuelven `lessons: { completed, total,
last_lesson_id, next_lesson }`. Una lección que no pertenece al curso responde
422 `LESSON_NOT_IN_ITEM`.

**Dónde se quedó el estudiante.** El backend guarda la última lección marcada.
`next_lesson` (`{ lesson_id, title, section_title, position }`) es la primera
lección pendiente desde esa última marcada (si la desmarcó, vuelve a ella), o la
primera pendiente del curso; `null` si terminó. El detalle añade `next_step`:
el primer item sin terminar en orden de la ruta, con su `url` y la lección donde
continuar. Mientras se reproduce una lección, el frontend reporta cada
`tracking.report_interval_seconds` (15 s) y al pausar `{ roadmap_item_id,
lesson_id, position_seconds }`; el backend guarda el segundo por lección y lo
devuelve en `next_lesson.position_seconds`, en cada lección del temario y en
`next_step.lesson`, para reanudar donde se quedó. Esa posición no cambia el
porcentaje (las páginas no publican la duración de cada lección): la lección se
completa con `completed: true`.

`Progress.trackingState`, `startedAt` y `completedAt` permiten reanudar y distinguir actividad con 0 %. Los items sin política explícita usan `COMPLETION` (el antiguo `MANUAL` se interpreta igual); los retos usan revisión. El detalle expone `tracking` y `resume`.

> Dos enfoques para registrar y procesar el progreso de una ruta de aprendizaje.

---

## Que es el Progreso en CodeQuest?

El progreso es el registro del avance del usuario en cada curso de su ruta activa.
Para el MVP, el progreso es **declarado manualmente** por el usuario (no integrado con DevTalles).

---

## Enfoque 1: Progreso por Estado Simple (recomendado para el MVP)

### Concepto

El usuario marca cada curso con uno de 4 estados. Es la forma mas simple e intuitiva:

```
NOT_STARTED -> IN_PROGRESS -> COMPLETED
                          -> SKIPPED
```

### Estructura de datos

```
RoadmapItem { id, roadmapId, courseId, order, reason }
     |
     +-- Progress { roadmapItemId, status, percentage, startedAt, completedAt }
```

### Logica de transicion

```typescript
// Reglas de transicion de estado
const VALID_TRANSITIONS: Record<ProgressStatus, ProgressStatus[]> = {
  NOT_STARTED: ["IN_PROGRESS", "COMPLETED", "SKIPPED"],
  IN_PROGRESS: ["COMPLETED", "SKIPPED", "NOT_STARTED"],
  COMPLETED: ["IN_PROGRESS"], // Puede retomar si quiere
  SKIPPED: ["NOT_STARTED", "IN_PROGRESS"],
};
```

### Calculo del progreso total de la ruta

```typescript
function calcRoadmapProgress(items: RoadmapItem[]): number {
  const total = items.length;
  const completed = items.filter(
    (i) => i.progress?.status === "COMPLETED",
  ).length;
  const inProgress = items.filter(
    (i) => i.progress?.status === "IN_PROGRESS",
  ).length;

  // Contar IN_PROGRESS como 50% de un item
  return Math.round(((completed + inProgress * 0.5) / total) * 100);
}
```

### Endpoint NestJS

```
PATCH /api/v1/roadmaps/:roadmapId/items/:itemId/progress
Body: { status: "IN_PROGRESS" | "COMPLETED" | "SKIPPED", percentage?: number }
```

### Flujo tecnico completo

```
React: usuario hace click en "Marcar como completado"
           |
           v
PATCH /api/v1/roadmaps/:id/items/:itemId/progress
Body: { status: "COMPLETED" }
           |
           v
ProgressController.update(roadmapId, itemId, dto, session)
           |
           v
ProgressService.update(userId, roadmapId, itemId, dto):
  1. Verificar que el roadmap pertenezca al userId (never trust client)
  2. Verificar que el roadmapItem pertenezca al roadmapId
  3. Obtener Progress actual del item
  4. Validar transicion (VALID_TRANSITIONS)
  5. Actualizar Progress:
       status = dto.status
       percentage = dto.status == COMPLETED ? 100 : dto.percentage
       completedAt = dto.status == COMPLETED ? now() : null
       startedAt = dto.status == IN_PROGRESS && !startedAt ? now() : startedAt
  6. Calcular progreso total de la ruta y retornar
           |
           v
Respuesta: { progress: { status, percentage }, roadmapProgress: 67 }
           |
           v
React: actualiza la UI sin recargar la pagina (optimistic update con TanStack Query)
```

### UX recomendada

- Boton de 1 click para pasar de NOT_STARTED a IN_PROGRESS
- Checkbox para marcar COMPLETED
- Barra de progreso total de la ruta visible siempre en el header de la pagina de detalle

---

## Enfoque 2: Progreso con Porcentaje Manual + Checkpoints

### Concepto

Ademas del estado, el usuario puede ingresar un porcentaje de avance (0-100%) y
marcar checkpoints dentro del curso (por ejemplo, "Termine la seccion 3 de 8").

### Cuanto mas agrega esto

```
RoadmapItem
  |
  +-- Progress { status, percentage }
  |
  +-- ProgressCheckpoint[] { label, completed, completedAt }
        ejemplo:
        - "Seccion 1: Introduccion" (completed: true)
        - "Seccion 2: Controllers" (completed: true)
        - "Seccion 3: Services" (completed: false)
```

### Ventajas

- El usuario tiene mas control y visibilidad granular
- Mejor para cursos largos (20+ horas)
- Permite calcular un `percentage` mas preciso automaticamente:
  `percentage = (checkpointsCompleted / totalCheckpoints) * 100`

### Desventajas

- Mas complejo de implementar en frontend (UI de checkpoints)
- Los checkpoints hay que crearlos al importar los cursos (o dejar que el usuario los cree)
- Para el MVP puede ser sobre-ingenieria

### Endpoint adicional

```
POST /api/v1/roadmaps/:id/items/:itemId/checkpoints/:checkpointId/complete
```

---

## Comparativa

| Criterio                       | Enfoque 1 (Estado Simple) | Enfoque 2 (Checkpoints)      |
| ------------------------------ | ------------------------- | ---------------------------- |
| Complejidad backend            | Baja                      | Media                        |
| Complejidad frontend (UI)      | Baja                      | Media-Alta                   |
| Velocidad de implementacion    | Alta                      | Media                        |
| Valor percibido por el usuario | Alto (simple y claro)     | Muy alto (control detallado) |
| Datos de progreso              | Coarse-grained            | Fine-grained                 |
| Recomendacion hackathon        | Primera iteracion         | Segunda iteracion            |

---

## Condicionamientos del Progreso en la Ruta

El progreso de un item puede condicionar el acceso al siguiente:

**Condicionamiento Suave (recomendado para MVP):**

- Todos los cursos de la ruta son accesibles desde el principio
- El orden es sugerido, no impuesto
- La UI muestra una advertencia si el usuario intenta marcar un curso como IN_PROGRESS
  antes de completar sus prerequisitos, pero no lo bloquea

**Condicionamiento Fuerte (opcional, segunda iteracion):**

- El sistema bloquea marcar como IN_PROGRESS un curso si sus prerequisitos no estan COMPLETED
- Requiere validacion en el backend al hacer PATCH del progreso
- Mas rigido pero respeta el orden pedagogico

Para el MVP: **condicionamiento suave**. El usuario es libre de avanzar como quiera.
