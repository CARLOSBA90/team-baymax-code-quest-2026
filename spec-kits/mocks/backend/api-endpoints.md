# API Endpoints — Documentacion

> Contrato de API entre el backend (Monolito Modular) y el frontend. Referencia rapida de todos los endpoints disponibles.
> Todos los endpoints se sirven desde un unico backend en el puerto configurado (default: `:3001`).

---

## Modulo de Autenticacion

### Endpoints de Better Auth (automaticos)

Manejados internamente por Better Auth bajo `/api/auth/*`:

| Metodo | Ruta | Descripcion | Auth |
|--------|------|-------------|------|
| `POST` | `/api/auth/sign-up/email` | Registro con email/password | No |
| `POST` | `/api/auth/sign-in/email` | Login con email/password | No |
| `GET`  | `/api/auth/signin/discord` | Inicio de flujo Discord OAuth | No |
| `GET`  | `/api/auth/callback/discord` | Callback de Discord OAuth (manejado por Better Auth) | No |
| `POST` | `/api/auth/sign-out` | Cerrar sesion | Si |
| `GET`  | `/api/auth/get-session` | Obtener sesion actual | Si |

### Endpoints Custom de Usuarios

| Metodo | Ruta | Descripcion | Auth |
|--------|------|-------------|------|
| `GET` | `/api/v1/users/me` | Perfil del usuario autenticado | Si |
| `PATCH` | `/api/v1/users/me` | Actualizar perfil propio | Si |

---

## Modulo de Evaluacion (Assessment)

| Metodo | Ruta | Descripcion | Auth | Body |
|--------|------|-------------|------|------|
| `GET` | `/api/v1/assessments/questions` | Obtener preguntas del cuestionario | Si | — |
| `POST` | `/api/v1/assessments/submit` | Enviar respuestas del cuestionario | Si | `SubmitAssessmentDto` |
| `GET` | `/api/v1/assessments/my-result` | Obtener resultado del assessment propio | Si | — |

#### SubmitAssessmentDto

```json
{
  "answers": [
    { "questionId": "string", "value": "string | number" }
  ]
}
```

---

## Modulo de Rutas de Aprendizaje (Roadmaps)

| Metodo | Ruta | Descripcion | Auth | Body |
|--------|------|-------------|------|------|
| `GET` | `/api/v1/roadmaps` | Listar rutas del usuario | Si | — |
| `GET` | `/api/v1/roadmaps/:id` | Obtener ruta por ID | Si | — |
| `POST` | `/api/v1/roadmaps/generate` | Generar ruta basada en assessment | Si | `GenerateRoadmapDto` |
| `PATCH` | `/api/v1/roadmaps/:id/progress` | Actualizar progreso de la ruta | Si | `UpdateProgressDto` |

#### Query Params (GET /roadmaps)

| Param | Tipo | Default | Descripcion |
|-------|------|---------|-------------|
| `page` | `number` | `1` | Numero de pagina |
| `limit` | `number` | `10` | Items por pagina |

#### GenerateRoadmapDto

```json
{
  "assessmentId": "string (required)",
  "title": "string (optional)"
}
```

#### UpdateProgressDto

```json
{
  "courseId": "string",
  "completed": "boolean"
}
```

---

## Modulo de Notificaciones

| Metodo | Ruta | Descripcion | Auth |
|--------|------|-------------|------|
| `GET` | `/api/v1/notifications` | Listar notificaciones del usuario | Si |
| `PATCH` | `/api/v1/notifications/:id/read` | Marcar como leida | Si |
| `GET` | `/api/v1/notifications/preferences` | Obtener preferencias | Si |
| `PATCH` | `/api/v1/notifications/preferences` | Actualizar preferencias | Si |

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
