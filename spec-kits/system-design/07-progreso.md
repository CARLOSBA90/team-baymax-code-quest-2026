# 07 — Progreso del Usuario

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
  NOT_STARTED: ['IN_PROGRESS', 'COMPLETED', 'SKIPPED'],
  IN_PROGRESS:  ['COMPLETED', 'SKIPPED', 'NOT_STARTED'],
  COMPLETED:    ['IN_PROGRESS'],  // Puede retomar si quiere
  SKIPPED:      ['NOT_STARTED', 'IN_PROGRESS'],
};
```

### Calculo del progreso total de la ruta

```typescript
function calcRoadmapProgress(items: RoadmapItem[]): number {
  const total = items.length;
  const completed = items.filter((i) => i.progress?.status === 'COMPLETED').length;
  const inProgress = items.filter((i) => i.progress?.status === 'IN_PROGRESS').length;

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

| Criterio | Enfoque 1 (Estado Simple) | Enfoque 2 (Checkpoints) |
|----------|--------------------------|------------------------|
| Complejidad backend | Baja | Media |
| Complejidad frontend (UI) | Baja | Media-Alta |
| Velocidad de implementacion | Alta | Media |
| Valor percibido por el usuario | Alto (simple y claro) | Muy alto (control detallado) |
| Datos de progreso | Coarse-grained | Fine-grained |
| Recomendacion hackathon | Primera iteracion | Segunda iteracion |

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
