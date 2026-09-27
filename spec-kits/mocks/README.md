# Mocks — Spec-Kit

Datos mock y documentacion de contratos de API para desarrollo independiente. Permite al frontend y backend trabajar sin depender uno del otro.

---

## Estructura

```
mocks/
+-- backend/
|   +-- api-endpoints.md          # Contratos de API: endpoints, envelopes, codigos de respuesta
|   +-- auth-responses.mock.json  # Respuestas de autenticacion (login, registro, sesion)
|   +-- users.mock.json           # Datos de usuarios
+-- frontend/
    +-- auth-context.mock.tsx     # Mock del contexto de autenticacion React
    +-- api-client.mock.ts        # Mock del cliente HTTP (axios)
    +-- components.mock.md        # Guia de uso de mocks en componentes y tests
```

---

## Cuando usar los Mocks

| Escenario | Mock a usar |
|-----------|-------------|
| Frontend sin backend corriendo | `api-client.mock.ts` |
| Testing de componentes React | `auth-context.mock.tsx` |
| Prototipar UI con datos realistas | `users.mock.json` |
| Documentar o verificar contratos de API | `api-endpoints.md` |
| Probar flujos de auth sin backend | `auth-responses.mock.json` |

---

## Guias

- [API Endpoints (Backend)](./backend/api-endpoints.md) — Documentacion de todos los endpoints con envelopes y ejemplos
- [Guia de Mocks Frontend](./frontend/components.mock.md) — Como usar los mocks en React y Vitest
