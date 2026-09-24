# API Endpoints — Documentacion

> Contrato de API entre el backend (Monolito Modular) y el frontend. Referencia rapida de todos los endpoints disponibles.
> Todos los endpoints se sirven desde un unico backend en el puerto configurado (default: `:3001`).

---

## Modulo de Autenticacion

### Endpoints de Better Auth (automaticos)

Manejados internamente por Better Auth bajo `/api/auth/*`:

| Metodo | Ruta                         | Descripcion                                          | Auth |
| ------ | ---------------------------- | ---------------------------------------------------- | ---- |
| `POST` | `/api/auth/sign-up/email`    | Registro con email/password                          | No   |
| `POST` | `/api/auth/sign-in/email`    | Login con email/password                             | No   |
| `GET`  | `/api/auth/signin/discord`   | Inicio de flujo Discord OAuth                        | No   |
| `GET`  | `/api/auth/callback/discord` | Callback de Discord OAuth (manejado por Better Auth) | No   |
| `POST` | `/api/auth/sign-out`         | Cerrar sesion                                        | Si   |
| `GET`  | `/api/auth/get-session`      | Obtener sesion actual                                | Si   |

### Endpoints Custom de Usuarios

| Metodo  | Ruta               | Descripcion                    | Auth |
| ------- | ------------------ | ------------------------------ | ---- |
| `GET`   | `/api/v1/users/me` | Perfil del usuario autenticado | Si   |
| `PATCH` | `/api/v1/users/me` | Actualizar perfil propio       | Si   |

---

## Modulo de Evaluacion (Assessment)

| Metodo | Ruta                            | Descripcion                             | Auth | Body                  |
| ------ | ------------------------------- | --------------------------------------- | ---- | --------------------- |
| `GET`  | `/api/v1/assessments/questions` | Obtener preguntas del cuestionario      | Si   | —                     |
| `POST` | `/api/v1/assessments/submit`    | Enviar respuestas del cuestionario      | Si   | `SubmitAssessmentDto` |
| `GET`  | `/api/v1/assessments/my-result` | Obtener resultado del assessment propio | Si   | —                     |

#### SubmitAssessmentDto

```json
{
  "answers": [{ "questionId": "string", "value": "string | number" }]
}
```

---

## Modulo de Rutas de Aprendizaje (Roadmaps)

| Metodo  | Ruta                                  | Descripcion                            | Auth | Body                 |
| ------- | ------------------------------------- | -------------------------------------- | ---- | -------------------- |
| `GET`   | `/api/v1/roadmaps`                    | Listar rutas del usuario               | Si   | —                    |
| `GET`   | `/api/v1/roadmaps/:id`                | Obtener ruta por ID                    | Si   | —                    |
| `POST`  | `/api/v1/roadmaps/generate`           | Generar ruta basada en assessment      | Si   | `GenerateRoadmapDto` |
| `PATCH` | `/api/v1/roadmaps/:id/pause`          | Pausar o reanudar una ruta             | Si   | `PauseRoadmapDto`    |
| `GET`   | `/api/v1/progress/roadmap/:roadmapId` | Obtener porcentaje e items de una ruta | Si   | —                    |
| `POST` | `/api/v1/progress/track` | Único endpoint para reportar avance de cualquier contenido | Si | `TrackProgressDto` (JSON o multipart) |
| `PATCH` | `/api/v1/admin/challenge-submissions/:id/review` | Revisar entrega | Admin | `ReviewChallengeDto` |

#### Query Params (GET /roadmaps)

| Param    | Tipo                                                | Default | Descripcion      |
| -------- | --------------------------------------------------- | ------- | ---------------- |
| `page`   | `number`                                            | `1`     | Numero de pagina |
| `limit`  | `number`                                            | `10`    | Items por pagina |
| `status` | `NOT_STARTED \| IN_PROGRESS \| PAUSED \| COMPLETED` | —       | Estado derivado  |

#### GenerateRoadmapDto

```json
{
  "assessmentId": "string (optional; defaults to latest completed)",
  "title": "string (optional)",
  "goal": { "type": "SKILL", "description": "Aprender APIs backend" },
  "declaredLevel": "BEGINNER | INTERMEDIATE | ADVANCED (optional)",
  "generationMode": "AUTO | AI | DETERMINISTIC (optional; defaults to AUTO)",
  "weeklyHours": 5
}
```

El generador configurado solo puede seleccionar IDs de cursos activos incluidos
en el snapshot del catalogo. `ROADMAP_GENERATOR_PROVIDER=RULES` usa seleccion
deterministica; `NVIDIA` usa NVIDIA NIM y vuelve a RULES si el proveedor falla
o devuelve una respuesta invalida. El backend siempre valida IDs y expande los
prerrequisitos antes de guardar la ruta.

#### TrackProgressDto

```json
{ "roadmap_item_id": "cmuf0g6cz00095cggn7dxuwch", "lesson_id": "cmuf4x…", "completed": true }
{ "roadmap_item_id": "cmuf0g6cz00095cggn7dxuwch", "completed": true }
{ "roadmap_item_id": "…", "position_seconds": 135 }
{ "roadmap_item_id": "…", "submission": { "type": "CODE", "language": "typescript", "content": "…" } }
```

`POST /progress/track` es el único endpoint para reportar avance, sea cual sea el contenido del item. El cliente manda `roadmap_item_id` y el dato según `tracking.type`: `LESSONS` (cursos con temario) → `lesson_id` + `completed` (`true` marca, `false` desmarca; el curso avanza lecciones marcadas / total) o `lesson_id` + `position_seconds` (segundo del video de la lección, para reanudar); `COMPLETION` (cursos sin temario) y `READING` → `completed: true`; `VIDEO` → `position_seconds`; `CHALLENGE` → `submission` (`TEXT`, `CODE`, `LINK` o `FILE`). El backend deduce el tipo, rechaza con 422 `TRACKING_REPORT_MISMATCH` un campo que no corresponda, evita duplicados sin identificadores del cliente y calcula el porcentaje. Una entrega `FILE` usa `multipart/form-data` con `roadmap_item_id`, `submission` (texto JSON `{"type":"FILE"}`) y `file`. Los retos responden 202 hasta su revisión administrativa.
El progreso global es `floor(sum(item.percentage) / totalItems)`. El estado se
deriva de los porcentajes y `pausedAt`, por lo que no se duplica en `Roadmap`.
El detalle retorna `name`, `status`, `progress`, `last_activity`, `courses` y
la lista discriminada `content`. Tambien retorna `generator` con `type` (`AI`,
`DETERMINISTIC` o `UNKNOWN`), proveedor final, version, fallback y proveedores
intentados; nunca expone credenciales ni prompts.

La configuracion efectiva se consulta con permisos administrativos mediante
`GET /api/v1/admin/roadmap-generator/config`. Se administra desde variables de
entorno: `ROADMAP_GENERATOR_PROVIDER`, `ROADMAP_GENERATOR_FALLBACKS`,
`NVIDIA_MODELS`, `NVIDIA_MODEL` y `NVIDIA_TIMEOUT_MS`.

La generación NVIDIA lanza en paralelo los primeros `NVIDIA_MAX_ATTEMPTS`
modelos de `NVIDIA_MODELS` (2 por defecto, máximo 4). Cada uno dispone de
`min(NVIDIA_TIMEOUT_MS, NVIDIA_TOTAL_TIMEOUT_MS)` (30 000 ms por defecto, máximo
120 000); gana el primer plan válido y el resto de peticiones se cancela. Si
todos fallan se conserva el fallback RULES.
El presupuesto cubre las llamadas NVIDIA, no consultas ni persistencia PostgreSQL.
Estos límites se exponen como `total_timeout_ms` y `max_attempts` en la consulta
administrativa de configuración.

Antes de llamar al modelo se ordenan candidatos por coincidencia con el objetivo,
peso de categoría y nivel, con desempate por ID; se envían hasta 20 candidatos
(o el máximo solicitado si fuera mayor), con descripciones de hasta 240 caracteres.
La validación solo acepta IDs de ese subconjunto. La expansión de prerrequisitos
sigue consultando el catálogo capturado completo. Los logs incluyen duración por
intento, resultado y tokens cuando el proveedor los informa, sin prompts ni claves.
Esta preselección es una heurística y no garantiza una menor latencia del proveedor.

Diagnóstico administrativo: `POST /api/v1/admin/roadmap-generator/probe`, con
`{}` para el primer modelo o `{ "model": "ID configurado" }` para otro.
Hace una llamada real mínima a NVIDIA en streaming, sin assessment ni catálogo,
con timeout de 30 segundos. Devuelve HTTP 200 con `data.status`: `OK`, `QUEUED`
(sin primer token dentro de `NVIDIA_FIRST_TOKEN_TIMEOUT_MS`: la petición quedó
en la cola del proveedor), `TIMEOUT`, `TOKEN_LIMIT` (agotó tokens razonando),
`HTTP_ERROR`, `EMPTY_RESPONSE`, `INVALID_RESPONSE` o `CONNECTION_ERROR`, además
de `elapsed_ms`, `queue_ms` (espera hasta el primer chunk), `first_answer_ms`,
`reasoning_chars`, `completion_tokens`, `http_status`, `checked_at` y
`generation_guaranteed: false`.

La generación usa streaming: si un modelo no empieza a responder dentro de
`NVIDIA_FIRST_TOKEN_TIMEOUT_MS` (10 000 ms por defecto) o devuelve 429/5xx, la
petición se reenvía hasta `NVIDIA_QUEUE_RETRIES` veces (2 por defecto) dentro de
su presupuesto. El razonamiento del modelo se descarta y solo se valida la
respuesta final.
Un modelo sin configurar retorna 400; requiere sesión administrativa.
La prueba consume una petición del proveedor. No se ejecuta automáticamente
antes de generar y no cambia la prioridad ni los fallbacks. `OK` solo confirma
que llegó texto; no garantiza JSON válido ni la latencia de una ruta completa.

Actualización de diagnóstico: `OK` exige el texto `OK`; una respuesta truncada
(`finish_reason=length`) devuelve `TOKEN_LIMIT`, incluso si contiene texto.
Para `nvidia/nemotron-3.5-lightning-30b-a3b`, generación y diagnóstico envían
`chat_template_kwargs.enable_thinking=false`, según la documentación de NVIDIA
para respuestas estructuradas. Otros modelos conservan sus parámetros normales.

---

## Modulo de Notificaciones

| Metodo  | Ruta                                | Descripcion                       | Auth |
| ------- | ----------------------------------- | --------------------------------- | ---- |
| `GET`   | `/api/v1/notifications`             | Listar notificaciones del usuario | Si   |
| `PATCH` | `/api/v1/notifications/:id/read`    | Marcar como leida                 | Si   |
| `GET`   | `/api/v1/notifications/preferences` | Obtener preferencias              | Si   |
| `PATCH` | `/api/v1/notifications/preferences` | Actualizar preferencias           | Si   |

---

## Formato de Respuestas

### Respuesta exitosa (un item)

```json
{
  "data": {
    "id": "...",
    "...": "..."
  }
}
```

### Respuesta exitosa (lista con paginacion)

```json
{
  "data": [ ... ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

### Respuesta exitosa (con mensaje)

```json
{
  "message": "Recurso creado exitosamente",
  "data": { ... }
}
```

### Respuesta de error

```json
{
  "statusCode": 404,
  "message": "Recurso no encontrado",
  "error": "Not Found"
}
```

### Error de validacion

```json
{
  "statusCode": 400,
  "message": [
    "title must be longer than or equal to 3 characters",
    "title should not be empty"
  ],
  "error": "Bad Request"
}
```

---

## Autenticacion

Todos los endpoints marcados con "Si" en la columna Auth requieren una **cookie de sesion** valida de Better Auth.

```
Cookie: better-auth.session_token=<token>
```

El frontend envia esta cookie automaticamente si las requests incluyen `credentials: 'include'`.

### Respuesta cuando no autenticado

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```
