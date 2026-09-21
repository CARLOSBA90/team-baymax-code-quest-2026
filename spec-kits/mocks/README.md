# Mocks — Spec-Kit

> Datos mock para desarrollo independiente. Permite al frontend y backend trabajar sin depender uno del otro.

---

## Estructura

```
mocks/
+-- backend/
|   +-- users.mock.json           # Datos de usuarios
|   +-- tasks.mock.json           # Datos de tareas
|   +-- auth-responses.mock.json  # Respuestas de auth
|   +-- api-endpoints.md          # Documentacion de endpoints
+-- frontend/
    +-- auth-context.mock.tsx     # Mock del contexto de auth
    +-- api-client.mock.ts        # Mock del cliente HTTP
    +-- components.mock.md        # Guia de uso de mocks
```

---

## Cuando usar los Mocks?

| Escenario | Mock a usar |
|-----------|-------------|
| Frontend sin backend corriendo | `api-client.mock.ts` |
| Testing de componentes React | `auth-context.mock.tsx` |
| Prototipar UI con datos realistas | `users.mock.json` + `tasks.mock.json` |
| Documentar contratos de API | `api-endpoints.md` |
| Probar flujos de auth sin backend | `auth-responses.mock.json` |

---

## Guias

- [API Endpoints (Backend)](./backend/api-endpoints.md) — Documentacion de todos los endpoints
- [Guia de Mocks Frontend](./frontend/components.mock.md) — Como usar los mocks en React
