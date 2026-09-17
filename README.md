# 🏰 CodeQuest

> Plataforma modular con arquitectura de microservicios: **3 backends NestJS + 1 frontend React**.

---

## 📋 Tabla de Contenidos

- [Arquitectura](#-arquitectura)
- [Tech Stack](#-tech-stack)
- [Estructura del Repositorio](#-estructura-del-repositorio)
- [Estrategia de Ramas Git](#-estrategia-de-ramas-git)
- [Cómo Empezar](#-cómo-empezar)
- [Backends](#-backends)
- [Frontend](#-frontend)
- [Spec-Kits](#-spec-kits)
- [Contribuir](#-contribuir)

---

## 🏗 Arquitectura

CodeQuest sigue una arquitectura de **microservicios** con un frontend unificado que consume múltiples APIs independientes.

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                     │
│                   localhost:5173                         │
└──────────┬──────────────┬──────────────┬────────────────┘
           │              │              │
           ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐
│  Backend #1  │ │  Backend #2  │ │     Backend #3       │
│  Auth API    │ │  Core API    │ │   Notifications API  │
│  :3001       │ │  :3002       │ │   :3003              │
│              │ │              │ │                      │
│ Better Auth  │ │ Lógica de    │ │ Emails, push,        │
│ Usuarios     │ │ negocio      │ │ webhooks             │
│ Sesiones     │ │ Resources    │ │                      │
└──────┬───────┘ └──────┬───────┘ └──────────┬───────────┘
       │                │                    │
       ▼                ▼                    ▼
┌─────────────────────────────────────────────────────────┐
│                   PostgreSQL Database                   │
│              (puede ser 1 DB o varias)                  │
└─────────────────────────────────────────────────────────┘
```

### Responsabilidades por Backend

| Backend | Puerto | Dominio | Descripción |
|---------|--------|---------|-------------|
| **Auth API** | `:3001` | Autenticación | Better Auth, gestión de usuarios, sesiones, roles |
| **Core API** | `:3002` | Negocio | Lógica principal, resources CRUD, reglas de negocio |
| **Notifications API** | `:3003` | Notificaciones | Emails, push notifications, webhooks, eventos |

---

## 🛠 Tech Stack

### Backend
| Tecnología | Uso |
|------------|-----|
| **NestJS** | Framework principal para los 3 backends |
| **Better Auth** | Autenticación y gestión de sesiones |
| **@thallesp/nestjs-better-auth** | Integración de Better Auth con NestJS |
| **PostgreSQL** | Base de datos relacional |
| **Prisma** | ORM y migraciones |
| **class-validator** | Validación de DTOs |
| **class-transformer** | Transformación de objetos |

### Frontend
| Tecnología | Uso |
|------------|-----|
| **React** | UI del frontend |
| **TypeScript** | Tipado estático |
| **better-auth/react** | Cliente de autenticación |
| **TanStack Query** | Gestión de estado del servidor |

### DevOps & Tooling
| Tecnología | Uso |
|------------|-----|
| **pnpm** | Package manager |
| **Docker** | Contenedores para desarrollo y producción |
| **ESLint + Prettier** | Linting y formateo |

---

## 📁 Estructura del Repositorio

```
codequest/
├── README.md                    # ← Estás aquí
├── backend/
│   ├── auth-api/                # Backend #1 — Autenticación
│   │   └── src/
│   ├── core-api/                # Backend #2 — Lógica de negocio
│   │   └── src/
│   └── notifications-api/       # Backend #3 — Notificaciones
│       └── src/
├── frontend/
│   └── src/                     # Frontend React
├── spec-kits/                   # 📘 Documentación y guías
│   ├── nestjs-scaffolding/      # Guía de scaffolding NestJS
│   ├── better-auth/             # Instructivo Better Auth
│   └── mocks/                   # Mocks para dev (backend + frontend)
└── docker-compose.yml           # (futuro) Orquestación local
```

---

## 🌿 Estrategia de Ramas Git

Utilizamos un flujo basado en **Git Flow simplificado** con 2 ramas principales y ramas de trabajo.

```
main ─────────●────────────────●────────────── producción
              │                ▲
              │                │ merge
              ▼                │
dev  ─────●───●───●───●───●───●──────────────── integración
          │       │       ▲
          │       │       │ merge
          ▼       ▼       │
feature/  ●───●   ●───●───● ← ramas de trabajo
```

### Ramas Principales

| Rama | Propósito | Protección |
|------|-----------|------------|
| `main` | **Producción.** Código estable y desplegado. | PR obligatorio, mínimo 1 review |
| `dev` | **Integración.** Rama base para desarrollo activo. | PR obligatorio |

### Ramas de Trabajo

| Prefijo | Uso | Ejemplo |
|---------|-----|---------|
| `feature/` | Nueva funcionalidad | `feature/user-registration` |
| `fix/` | Corrección de bug | `fix/login-redirect` |
| `hotfix/` | Corrección urgente en producción | `hotfix/session-expiry` |
| `refactor/` | Refactorización sin cambio funcional | `refactor/auth-module` |
| `docs/` | Solo documentación | `docs/api-endpoints` |

### Convenciones de Nombrado

```bash
# Formato: <tipo>/<descripcion-kebab-case>
git checkout -b feature/task-crud
git checkout -b fix/cors-headers
git checkout -b hotfix/token-expiry

# Commits (Conventional Commits)
git commit -m "feat(core-api): add tasks CRUD endpoints"
git commit -m "fix(auth-api): resolve session cookie domain"
git commit -m "docs: update better-auth setup guide"
```

### Flujo de Trabajo

1. Crear rama desde `dev`:
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feature/mi-feature
   ```
2. Desarrollar y hacer commits con **Conventional Commits**
3. Crear **Pull Request** hacia `dev`
4. Code review + aprobación
5. Merge a `dev`
6. Cuando `dev` es estable → PR hacia `main` (release)

---

## 🚀 Cómo Empezar

### Prerrequisitos

- **Node.js** >= 20.x
- **pnpm** >= 9.x
- **PostgreSQL** >= 16
- **Git**

### Instalación

```bash
# 1. Clonar el repositorio
git clone <repo-url> codequest
cd codequest

# 2. Instalar dependencias de cada backend
cd backend/auth-api && pnpm install && cd ../..
cd backend/core-api && pnpm install && cd ../..
cd backend/notifications-api && pnpm install && cd ../..

# 3. Instalar dependencias del frontend
cd frontend && pnpm install && cd ..

# 4. Configurar variables de entorno
# Cada backend tiene su propio .env (ver .env.example en cada uno)
```

### Levantar el Proyecto

```bash
# Terminal 1 — Auth API
cd backend/auth-api && pnpm run start:dev

# Terminal 2 — Core API
cd backend/core-api && pnpm run start:dev

# Terminal 3 — Notifications API
cd backend/notifications-api && pnpm run start:dev

# Terminal 4 — Frontend
cd frontend && pnpm run dev
```

---

## 🔧 Backends

Cada backend es un proyecto NestJS independiente. Consulta los spec-kits para saber cómo crear y configurar cada uno:

- 📘 [Scaffolding NestJS](./spec-kits/nestjs-scaffolding/README.md) — Cómo crear un backend desde cero
- 📘 [Better Auth](./spec-kits/better-auth/README.md) — Cómo integrar autenticación
- 📘 [Mocks](./spec-kits/mocks/README.md) — Datos mock para desarrollo

### Comunicación Entre Backends

Los backends se comunican entre sí mediante **HTTP interno** (para simplicidad inicial). El frontend solo habla con los endpoints expuestos de cada backend.

```
Frontend ──→ Auth API    (login, register, session)
Frontend ──→ Core API    (CRUD de recursos)
Frontend ──→ Notif API   (preferencias de notificación)

Core API ──→ Auth API    (validar tokens internamente)
Core API ──→ Notif API   (disparar notificaciones)
```

---

## 🎨 Frontend

> ⚠️ **El frontend será desarrollado por el programador frontend.** Este repositorio provee mocks y guías para facilitar su trabajo.

Recursos disponibles:
- 📘 [Mocks de Frontend](./spec-kits/mocks/frontend/) — Mocks de auth context, API client
- 📘 [Setup Better Auth (React)](./spec-kits/better-auth/setup-frontend.md) — Guía del cliente de auth

---

## 📘 Spec-Kits

Los **spec-kits** son documentación viva del proyecto. Contienen guías, ejemplos y mocks.

| Spec-Kit | Descripción | Link |
|----------|-------------|------|
| **NestJS Scaffolding** | Cómo crear y estructurar un backend NestJS | [Ver guía](./spec-kits/nestjs-scaffolding/README.md) |
| **Better Auth** | Instructivo paso a paso de autenticación | [Ver guía](./spec-kits/better-auth/README.md) |
| **Mocks** | Datos mock para backend y frontend | [Ver mocks](./spec-kits/mocks/README.md) |

---

## 🤝 Contribuir

1. Lee los [spec-kits](#-spec-kits) antes de empezar
2. Sigue la [estrategia de ramas](#-estrategia-de-ramas-git)
3. Usa **Conventional Commits** para los mensajes
4. Crea un **PR** hacia `dev` y solicita review
5. Documenta cualquier decisión de arquitectura nueva

---

## 📄 Licencia

MIT — Ver [LICENSE](./LICENSE) para más detalles.
