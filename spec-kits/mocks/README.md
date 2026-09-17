# 🧪 Mocks — Spec-Kit

> Datos mock para desarrollo independiente. Permite al frontend y backend trabajar sin depender uno del otro.

---

## 📂 Estructura

```
mocks/
├── backend/
│   ├── users.mock.json           # Datos de usuarios
│   ├── tasks.mock.json           # Datos de tareas
│   ├── auth-responses.mock.json  # Respuestas de auth
│   └── api-endpoints.md          # Documentación de endpoints
└── frontend/
    ├── auth-context.mock.tsx     # Mock del contexto de auth
    ├── api-client.mock.ts        # Mock del cliente HTTP
    └── components.mock.md        # Guía de uso de mocks
```

---

## 🎯 ¿Cuándo usar los Mocks?

| Escenario | Mock a usar |
|-----------|-------------|
| Frontend sin backend corriendo | `api-client.mock.ts` |
| Testing de componentes React | `auth-context.mock.tsx` |
| Prototipar UI con datos realistas | `users.mock.json` + `tasks.mock.json` |
| Documentar contratos de API | `api-endpoints.md` |
| Probar flujos de auth sin backend | `auth-responses.mock.json` |

---

## 📘 Guías

- [API Endpoints (Backend)](./backend/api-endpoints.md) — Documentación de todos los endpoints
- [Guía de Mocks Frontend](./frontend/components.mock.md) — Cómo usar los mocks en React
