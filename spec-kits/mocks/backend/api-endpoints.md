# 📡 API Endpoints — Documentación

> Contrato de API entre backends y frontend. Referencia rápida de todos los endpoints disponibles.

---

## 🔐 Auth API (`:3001`)

### Endpoints de Better Auth (automáticos)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `POST` | `/api/auth/sign-up/email` | Registro con email/password | ❌ |
| `POST` | `/api/auth/sign-in/email` | Login con email/password | ❌ |
| `POST` | `/api/auth/sign-out` | Cerrar sesión | ✅ |
| `GET` | `/api/auth/get-session` | Obtener sesión actual | ✅ |

### Endpoints Custom

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `GET` | `/api/v1/users/me` | Perfil del usuario autenticado | ✅ |
| `PATCH` | `/api/v1/users/me` | Actualizar perfil propio | ✅ |
| `GET` | `/api/v1/users/public-stats` | Estadísticas públicas | ❌ |

---

## 📦 Core API (`:3002`)

### Tasks Resource

| Método | Ruta | Descripción | Auth | Body |
|--------|------|-------------|------|------|
| `GET` | `/api/v1/tasks` | Listar tareas | ✅ | — |
| `GET` | `/api/v1/tasks/:id` | Obtener tarea por ID | ✅ | — |
| `POST` | `/api/v1/tasks` | Crear tarea | ✅ | `CreateTaskDto` |
| `PATCH` | `/api/v1/tasks/:id` | Actualizar tarea | ✅ | `UpdateTaskDto` |
| `DELETE` | `/api/v1/tasks/:id` | Eliminar tarea | ✅ | — |

#### Query Params (GET /tasks)

| Param | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `page` | `number` | `1` | Número de página |
| `limit` | `number` | `10` | Items por página |

#### CreateTaskDto

```json
{
  "title": "string (required, 3-100 chars)",
  "description": "string (optional, max 500 chars)",
  "priority": "LOW | MEDIUM | HIGH | URGENT (optional, default: MEDIUM)"
}
```

#### UpdateTaskDto

```json
{
  "title": "string (optional)",
  "description": "string (optional)",
  "priority": "LOW | MEDIUM | HIGH | URGENT (optional)",
  "status": "PENDING | IN_PROGRESS | COMPLETED | CANCELLED (optional)"
}
```

---

## 🔔 Notifications API (`:3003`)

> ⚠️ Endpoints pendientes de definición. Se actualizará cuando el backend de notificaciones esté en desarrollo.

### Endpoints planificados

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `GET` | `/api/v1/notifications` | Listar notificaciones del usuario | ✅ |
| `PATCH` | `/api/v1/notifications/:id/read` | Marcar como leída | ✅ |
| `POST` | `/api/v1/notifications/preferences` | Actualizar preferencias | ✅ |

---

## 📋 Formato de Respuestas

### Respuesta exitosa (un item)

```json
{
  "data": {
    "id": "...",
    "...": "..."
  }
}
```

### Respuesta exitosa (lista con paginación)

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

### Error de validación

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

## 🔑 Autenticación

Todos los endpoints marcados con ✅ requieren una **cookie de sesión** válida de Better Auth.

```
Cookie: better-auth.session_token=<token>
```

El frontend envía esta cookie automáticamente si las requests incluyen `credentials: 'include'`.

### Respuesta cuando no autenticado

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```
