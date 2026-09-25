# 06 — Cuestionario y Evaluacion

> Diseno del cuestionario de diagnostico: preguntas, criterios de evaluacion, scoring y perfil resultante.

---

## Nomenclatura: Ruta de Pagina vs Endpoint API

> **Nota de diseno (2026-09-25)**
>
> El cuestionario usa nomenclatura diferente en dos capas — esto es intencional:
>
> | Capa | Ruta | Razon |
> |---|---|---|
> | **Frontend (pagina)** | `/dashboard/roadmaps/new` | El cuestionario es el punto de entrada para crear una nueva ruta de aprendizaje. Desde la perspectiva del usuario, esta pagina "crea un roadmap nuevo". |
> | **Backend (API REST)** | `POST /api/v1/assessments/submit` | La operacion es un submit de assessment. El recurso que se crea en esta llamada es un `Assessment`, no un `Roadmap` (el roadmap se genera internamente como efecto del hook inline). |
>
> El endpoint no se llama `/roadmaps/create` porque el recurso primario es el assessment.
> La generacion del roadmap es una consecuencia interna, no la responsabilidad del endpoint.
>
> **Decision acordada:** Mantener ambas nomenclaturas. Son correctas en su contexto.

---

## Objetivo del Cuestionario

El cuestionario convierte las respuestas del usuario en un **AssessmentProfile**:
un mapa de scores por categoria de habilidad que el algoritmo de rutas usa para generar una ruta personalizada.

El cuestionario no es un test de conocimiento. Es un diagnostico de **intereses, nivel actual y objetivo**.

---

## Estructura del Cuestionario

### Bloque 1: Objetivo Profesional (1 pregunta)

Esta pregunta define la dimension principal del vector del usuario.

| # | Pregunta | Tipo |
|---|----------|------|
| 1 | Cual es tu principal objetivo de aprendizaje ahora? | Opcion unica |

Opciones (mapean directamente a `goalCategory`):
- "Desarrollar aplicaciones web del lado del servidor (backend)" -> `BACKEND`
- "Desarrollar interfaces de usuario web (frontend)" -> `FRONTEND`
- "Desarrollo movil (apps para celular)" -> `MOBILE`
- "Bases de datos, manejo de datos" -> `DATABASES`
- "DevOps, CI/CD, infraestructura" -> `DEVOPS`
- "Exploracion general, no tengo objetivo especifico" -> `WEB_FUNDAMENTALS`

### Bloque 2: Nivel Actual por Area (5-7 preguntas de escala)

Cada pregunta evalua el nivel en una SkillCategory usando escala Likert (1-5).

| # | Pregunta | Categoria | Escala |
|---|----------|-----------|--------|
| 2 | Como describes tu nivel actual en desarrollo backend (Node.js, APIs, servidores)? | BACKEND | 1-5 |
| 3 | Como describes tu nivel actual en desarrollo frontend (HTML, CSS, React/Vue)? | FRONTEND | 1-5 |
| 4 | Como describes tu nivel actual en bases de datos (SQL, PostgreSQL, MongoDB)? | DATABASES | 1-5 |
| 5 | Tienes experiencia con DevOps, Docker o CI/CD? | DEVOPS | 1-5 |
| 6 | Has trabajado con desarrollo movil (Flutter, React Native)? | MOBILE | 1-5 |
| 7 | Que tan comodo te sientes con TypeScript / JavaScript moderno? | WEB_FUNDAMENTALS | 1-5 |

Valores de la escala:
- 1: "Nunca lo he tocado"
- 2: "Lo conozco de nombre o vi un tutorial"
- 3: "Hice algunos proyectos pequenos"
- 4: "Lo uso regularmente en proyectos"
- 5: "Tengo experiencia profesional solida"

### Bloque 3: Intereses y Disponibilidad (2-3 preguntas)

| # | Pregunta | Tipo |
|---|----------|------|
| 8 | Ademas de tu objetivo principal, que otras areas te interesan? | Multi-seleccion (hasta 2) |
| 9 | Cuantas horas por semana puedes dedicar al estudio? | Opcion unica |
| 10 | En cuantos cursos quieres enfocarte al mismo tiempo? | Opcion unica |

Opciones para pregunta 9 (disponibilidad):
- "Menos de 2 horas" -> `weeklyHours: 2`
- "Entre 2 y 5 horas" -> `weeklyHours: 4`
- "Entre 5 y 10 horas" -> `weeklyHours: 8`
- "Mas de 10 horas" -> `weeklyHours: 15`

Opciones para pregunta 10 (enfoque):
- "Quiero enfoque total (1-3 cursos)" -> `maxCourses: 3`
- "Ruta mediana (4-6 cursos)" -> `maxCourses: 6`
- "Ruta completa (hasta 10 cursos)" -> `maxCourses: 10`

---

## Calculo del AssessmentProfile

### Suma de Scores por Categoria

Cada respuesta de la escala 1-5 se multiplica por 5, dando un rango de 5-25 por categoria.
Las preguntas de intereses adicionales (Bloque 3) agregan un bonus de 3 puntos a las categorias seleccionadas.

```typescript
// Ejemplo de calculo
const profileScores = {
  BACKEND: (pregunta2.value * 5) + (interesBackend ? 3 : 0),  // max: 28
  FRONTEND: (pregunta3.value * 5) + (interesFrontend ? 3 : 0), // max: 28
  DATABASES: pregunta4.value * 5,                               // max: 25
  DEVOPS: pregunta5.value * 5,                                  // max: 25
  MOBILE: pregunta6.value * 5,                                  // max: 25
  WEB_FUNDAMENTALS: pregunta7.value * 5,                        // max: 25
};
```

### Determinacion del Nivel del Usuario (para filtrar cursos)

```typescript
function calcUserLevel(scores: Record<string, number>, goal: string): 1 | 2 | 3 {
  const goalScore = scores[goal] ?? 0;
  if (goalScore >= 20) return 3; // advanced
  if (goalScore >= 10) return 2; // intermediate
  return 1;                       // beginner
}
```

### Desviacion de Intereses (para rutas hibridas)

Si el usuario selecciona intereses secundarios, el algoritmo puede incluir hasta 2 cursos
de las areas secundarias para generar una ruta mas "full-stack" o transversal.

```
Criterio: si un area secundaria tiene score >= 10, incluir hasta 1 curso de esa area
en la ruta (siempre que el prerequisito lo permita).
```

---

## Guardado del Historico

Cada vez que el usuario completa el cuestionario, se crea un nuevo `Assessment` con sus `AssessmentAnswer`.
No se sobreescribe el anterior. Esto permite:

- Ver la evolucion del perfil del usuario a lo largo del tiempo
- Comparar rutas generadas en diferentes momentos
- Detectar si el usuario cambia de objetivo

```
User
 |
 +-- Assessment 1 (completado en sep-2026, perfil: { BACKEND: 20, FRONTEND: 10 })
 |     +-- Roadmap 1.1 (ruta generada desde Assessment 1)
 |
 +-- Assessment 2 (completado en oct-2026, perfil: { BACKEND: 25, DEVOPS: 15 })
       +-- Roadmap 2.1 (nueva ruta con perfil actualizado)
```

---

## Consolidacion de Rutas

Si el usuario completa el cuestionario por segunda vez:
- Se genera un nuevo `Assessment` y se puede generar una nueva `Roadmap` desde el.
- Las rutas anteriores se pueden `ARCHIVE` (no borrar, mantener historico).
- El usuario elige cual ruta marcar como `ACTIVE`.

---

## Preguntas del Cuestionario en la Base de Datos

Las preguntas se guardan en la tabla `Question` (ver entidades). Esto permite:
- Agregar o desactivar preguntas sin necesidad de deploy
- Versionado del cuestionario (campo `version` en `Assessment`)
- A/B testing de preguntas en el futuro

### Seed de Preguntas (para el MVP)

```typescript
// prisma/seed.ts — seed de preguntas iniciales
const questions = [
  {
    text: 'Cual es tu principal objetivo de aprendizaje ahora?',
    category: 'BACKEND', // categoria de referencia
    order: 1,
    options: [
      { text: 'Desarrollo backend (APIs, servidores)', value: 5, order: 1 },
      { text: 'Desarrollo frontend (UI, React)', value: 1, order: 2 },
      // ...
    ],
  },
  {
    text: 'Como describes tu nivel actual en desarrollo backend?',
    category: 'BACKEND',
    order: 2,
    options: [
      { text: 'Nunca lo he tocado', value: 1, order: 1 },
      { text: 'Vi algunos tutoriales', value: 2, order: 2 },
      { text: 'Hice proyectos pequenos', value: 3, order: 3 },
      { text: 'Lo uso regularmente', value: 4, order: 4 },
      { text: 'Experiencia profesional solida', value: 5, order: 5 },
    ],
  },
  // ... resto de preguntas
];
```

---

## Flujo Tecnico: Frontend -> Backend (Diseño Actual)

> **ACTUALIZADO 2026-09-25** — La generacion del roadmap es responsabilidad interna del backend.
> El flujo de 2 llamadas (submit + generate) descrito en versiones anteriores **nunca se implemento en el frontend**
> y fue reemplazado por un hook inline dentro de `AssessmentsService.submit()`.

```
Usuario responde el cuestionario en React
        |
        v
POST /api/v1/assessments/submit
Body: {
  answers: [
    { questionId: "q1", optionId: "opt3" },
    { questionId: "q2", optionId: "opt4" },
    ...
  ]
}
        |
        v
AssessmentsController.submit()
        |
        v
AssessmentsService.submit(userId, answers):
  1. Validar respuestas (formato y completitud)
  2. Obtener preguntas activas desde la DB
  3. Calcular profileScores y goalCategory segun las opciones elegidas
  4. Persistir Assessment + AssessmentAnswers en DB
  5. [HOOK INLINE] Resolver Roadmap:
       - Si ya existe una ruta para el assessment:
           roadmap = { status: "EXISTS", id: existingRoadmap.id }
       - Si no existe, invocar RoadmapGenerationService.generate(userId, { assessmentId }):
           * Exito: Roadmap y RoadmapItems creados en DB.
             roadmap = { status: "GENERATED", id: generatedRoadmap.id }
           * Fallo controlado (try/catch + Logger.warn): si falla (catalogo vacio,
             timeout, error de generador), se loguea como advertencia,
             el Assessment queda persistido y la request NO explota.
             roadmap = { status: "FAILED", message: "No se pudo generar la ruta de aprendizaje." }
  6. Retornar: { data: { ...AssessmentResult, roadmap } } con HTTP 201
        |
        v
Frontend recibe 201 Created y evalua data.roadmap.status:
  - Caso Exito ("GENERATED" o "EXISTS"):
      * Navega a /dashboard/roadmaps (o directamente a /dashboard/roadmaps/:id).
      * GET /api/v1/roadmaps -> La nueva ruta existe en DB y se renderiza inmediatamente.
  - Caso Falla Controlada ("FAILED"):
      * El Assessment fue guardado con exito.
      * La nueva ruta NO existe en DB.
      * El frontend informa al usuario que las respuestas fueron registradas pero
        la ruta no pudo auto-generarse, ofreciendo un reintento manual
        (usando POST /api/v1/roadmaps/generate).
```

### Formato de respuesta de `POST /api/v1/assessments/submit`

```json
{
  "data": {
    "id": "cuid_assessment_123",
    "userId": "user_id_456",
    "version": 1,
    "goalCategory": "BACKEND",
    "profileScores": {
      "BACKEND": 20,
      "FRONTEND": 5
    },
    "completedAt": "2026-09-25T15:00:00.000Z",
    "createdAt": "2026-09-25T15:00:00.000Z",
    "roadmap": {
      "status": "GENERATED",
      "id": "cuid_roadmap_789"
    }
  }
}
```

En caso de fallo controlado en la generacion (mensaje sanitizado para evitar divulgacion de detalles internos, CWE-209):

```json
{
  "data": {
    "id": "cuid_assessment_123",
    "userId": "user_id_456",
    "version": 1,
    "goalCategory": "BACKEND",
    "profileScores": { "BACKEND": 20 },
    "completedAt": "2026-09-25T15:00:00.000Z",
    "createdAt": "2026-09-25T15:00:00.000Z",
    "roadmap": {
      "status": "FAILED",
      "message": "No se pudo generar la ruta de aprendizaje."
    }
  }
}
```

> **Nota de Seguridad (CWE-209):** El campo `roadmap.message` devuelve un mensaje sanitizado y genérico al cliente. Los detalles técnicos (errores de Prisma, timeouts de red, etc.) se preservan exclusivamente en los registros internos del servidor (`Logger.warn`) para evitar filtración de información sobre la infraestructura o la base de datos.

### Estado del endpoint POST /api/v1/roadmaps/generate

| Endpoint | Estado | Uso |
|---|---|---|
| `POST /api/v1/roadmaps/generate` | Activo pero **secundario** | Re-generacion manual de ruta con parametros avanzados o reintento si la auto-generacion inline fallo |

El endpoint se mantiene en el backend para casos de uso secundarios (ej: el usuario quiere
regenerar su ruta con distintos parametros o reintentar tras un `status: "FAILED"`). No debe ser llamado por el frontend en el flujo primario exitoso del cuestionario.

