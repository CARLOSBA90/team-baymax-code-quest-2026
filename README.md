# CodeQuest

> Plataforma modular con arquitectura de Monolito Modular: **1 backend NestJS + 1 frontend React**.

---

## Tabla de Contenidos

- [Arquitectura](#arquitectura)
- [Tech Stack](#tech-stack)
- [Estructura del Repositorio](#estructura-del-repositorio)
- [Estrategia de Ramas Git](#estrategia-de-ramas-git)
- [Como Empezar](#como-empezar)
- [Backend](#backend)
- [Frontend](#frontend)
- [Spec-Kits](#spec-kits)
- [Contribuir](#contribuir)

---

## Arquitectura

CodeQuest sigue una arquitectura de **Monolito Modular**: un unico backend NestJS organizado por modulos de dominio independientes, consumido por un frontend React.

```
+--------------------------------------------------+
|               FRONTEND (React)                   |
|              localhost:5173                      |
+--------------------------------------------------+
                        |
                        | HTTP (cookies)
                        v
+--------------------------------------------------+
|           BACKEND NestJS (Monolito Modular)      |
|               localhost:3001                     |
|                                                  |
|  /api/auth/*    - AuthModule (Better Auth)       |
|  /api/v1/users  - UsersModule                    |
|  /api/v1/roadmaps      - RoadmapsModule          |
|  /api/v1/assessments   - AssessmentsModule       |
|  /api/v1/notifications - NotificationsModule     |
+--------------------------------------------------+
                        |
                        v
+--------------------------------------------------+
|              PostgreSQL Database                 |
+--------------------------------------------------+
```

### Modulos del Backend

| Modulo | Ruta base | Descripcion |
|--------|-----------|-------------|
| **AuthModule** | `/api/auth/*` | Better Auth, login con Discord, sesiones |
| **UsersModule** | `/api/v1/users` | Perfil de usuario, gestion de cuenta |
| **AssessmentsModule** | `/api/v1/assessments` | Cuestionario de habilidades e intereses |
| **RoadmapsModule** | `/api/v1/roadmaps` | Rutas de aprendizaje generadas, progreso |
| **NotificationsModule** | `/api/v1/notifications` | Emails, preferencias de notificacion |

---

## Tech Stack

### Backend
| Tecnologia | Uso |
|------------|-----|
| **NestJS** | Framework principal (Monolito Modular) |
| **Better Auth** | Autenticacion y gestion de sesiones |
| **@thallesp/nestjs-better-auth** | Integracion de Better Auth con NestJS |
| **Discord OAuth** | Proveedor de autenticacion (requerimiento del brief) |
| **PostgreSQL** | Base de datos relacional |
| **Prisma** | ORM y migraciones |
| **class-validator** | Validacion de DTOs |
| **class-transformer** | Transformacion de objetos |

### Frontend
| Tecnologia | Uso |
|------------|-----|
| **React** | UI del frontend |
| **TypeScript** | Tipado estatico |
| **better-auth/react** | Cliente de autenticacion |
| **TanStack Query** | Gestion de estado del servidor |

### DevOps & Tooling
| Tecnologia | Uso |
|------------|-----|
| **pnpm** | Package manager |
| **Docker** | Contenedores para desarrollo y produccion |
| **ESLint + Prettier** | Linting y formateo |

---

## Estructura del Repositorio

```
codequest/
+-- README.md
+-- backend/                         # Backend NestJS (Monolito Modular)
|   +-- src/
|   |   +-- main.ts
|   |   +-- app.module.ts
|   |   +-- common/                  # Filtros, guards, interceptores globales
|   |   +-- config/                  # Variables de entorno
|   |   +-- prisma/                  # PrismaService y PrismaModule
|   |   +-- modules/
|   |       +-- auth/                # Better Auth + Discord
|   |       +-- users/               # Perfil de usuario
|   |       +-- assessments/         # Cuestionario
|   |       +-- roadmaps/            # Rutas de aprendizaje
|   |       +-- notifications/       # Notificaciones
|   +-- prisma/
|       +-- schema.prisma
+-- frontend/
|   +-- src/                         # Frontend React + Vite
+-- spec-kits/                       # Documentacion y guias
|   +-- nestjs-scaffolding/          # Guia de scaffolding NestJS
|   +-- better-auth/                 # Instructivo Better Auth + Discord
|   +-- mocks/                       # Mocks para dev
+-- tasks/                           # Seguimiento de tareas del equipo
+-- docker-compose.yml               # (futuro) Orquestacion local
```

---

## Estrategia de Ramas Git

Utilizamos un flujo basado en **Git Flow simplificado** con 2 ramas principales y ramas de trabajo.

```
main -----+-----------------------------+-------------- produccion
          |                             ^
          |                             | merge
          v                             |
dev  -----+---+---+---+---+---+--------+-------------- integracion
          |       |       ^
          |       |       | merge
          v       v       |
feature/  +---+   +---+---+ <- ramas de trabajo
```

### Ramas Principales

| Rama | Proposito | Proteccion |
|------|-----------|------------|
| `main` | Produccion. Codigo estable y desplegado. | PR obligatorio, minimo 1 review |
| `dev` | Integracion. Rama base para desarrollo activo. | PR obligatorio |

### Ramas de Trabajo

| Prefijo | Uso | Ejemplo |
|---------|-----|---------|
| `feature/` | Nueva funcionalidad | `feature/user-registration` |
| `fix/` | Correccion de bug | `fix/login-redirect` |
| `hotfix/` | Correccion urgente en produccion | `hotfix/session-expiry` |
| `refactor/` | Refactorizacion sin cambio funcional | `refactor/auth-module` |
| `docs/` | Solo documentacion | `docs/api-endpoints` |

### Convenciones de Nombrado

```bash
# Formato: <tipo>/<descripcion-kebab-case>
git checkout -b feature/task-crud
git checkout -b fix/cors-headers
git checkout -b hotfix/token-expiry

# Commits (Conventional Commits)
git commit -m "feat(roadmaps): add roadmap generator endpoint"
git commit -m "fix(auth): resolve discord oauth callback"
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
4. Code review + aprobacion
5. Merge a `dev`
6. Cuando `dev` es estable -> PR hacia `main` (release)

---

## Como Empezar

### Prerrequisitos

- **Node.js** >= 20.x
- **pnpm** >= 9.x
- **PostgreSQL** >= 16
- **Git**

### Instalacion

```bash
# 1. Clonar el repositorio
git clone <repo-url> codequest
cd codequest

# 2. Instalar dependencias del backend
cd backend && pnpm install && cd ..

# 3. Instalar dependencias del frontend
cd frontend && pnpm install && cd ..

# 4. Configurar variables de entorno
# Copiar .env.example a .env en cada directorio y completar los valores
```

### Levantar el Proyecto

```bash
# Terminal 1 - Backend (NestJS)
cd backend && pnpm start:dev

# Terminal 2 - Frontend (React + Vite)
cd frontend && pnpm dev
```

---

## Backend

El backend es un unico proyecto NestJS Modular. Consulta los spec-kits para saber como crear y configurar cada modulo:

- [Scaffolding NestJS](./spec-kits/nestjs-scaffolding/README.md) — Como crear y estructurar el backend modular
- [Better Auth + Discord](./spec-kits/better-auth/README.md) — Como integrar autenticacion con Discord
- [Mocks](./spec-kits/mocks/README.md) — Datos mock para desarrollo

### Comunicacion Frontend -> Backend

El frontend se comunica con un unico backend. Todos los modulos estan expuestos desde el mismo proceso NestJS:

```
Frontend ---> /api/auth/*         (login, register, session, discord)
Frontend ---> /api/v1/users       (perfil de usuario)
Frontend ---> /api/v1/assessments (cuestionario de habilidades)
Frontend ---> /api/v1/roadmaps    (rutas de aprendizaje generadas)
Frontend ---> /api/v1/notifications (preferencias y notificaciones)
```

---

## Frontend

> El frontend sera desarrollado por el programador frontend. Este repositorio provee mocks y guias para facilitar su trabajo.

Recursos disponibles:
- [Mocks de Frontend](./spec-kits/mocks/frontend/) — Mocks de auth context, API client
- [Setup Better Auth (React)](./spec-kits/better-auth/setup-frontend.md) — Guia del cliente de auth con Discord

---

## Spec-Kits

Los **spec-kits** son documentacion viva del proyecto. Contienen guias, ejemplos y mocks.

| Spec-Kit | Descripcion | Link |
|----------|-------------|------|
| **NestJS Scaffolding** | Como crear y estructurar el backend NestJS modular | [Ver guia](./spec-kits/nestjs-scaffolding/README.md) |
| **Better Auth** | Instructivo paso a paso de autenticacion con Discord | [Ver guia](./spec-kits/better-auth/README.md) |
| **Mocks** | Datos mock para backend y frontend | [Ver mocks](./spec-kits/mocks/README.md) |

---

## Contribuir

1. Lee los [spec-kits](#spec-kits) antes de empezar
2. Sigue la [estrategia de ramas](#estrategia-de-ramas-git)
3. Usa **Conventional Commits** para los mensajes
4. Crea un **PR** hacia `dev` y solicita review
5. Documenta cualquier decision de arquitectura nueva

---

## Licencia

MIT — Ver [LICENSE](./LICENSE) para mas detalles.
