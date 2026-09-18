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

## ⚙️ Backend

> **Estado actual:** `backend/` es **un único** servicio NestJS (no los tres descritos arriba) con autenticación por Better Auth sobre PostgreSQL (Neon) y Prisma 7. Todas las rutas cuelgan del prefijo `/api`, y Better Auth atiende `/api/auth/*`.

### Levantarlo

Requisitos: Node.js >= 22.22.1 (lo exige `@thallesp/nestjs-better-auth`), pnpm y una base PostgreSQL (Neon).

```bash
cd backend
pnpm install

# 1. Variables de entorno: completar DATABASE_URL, DIRECT_URL,
#    BETTER_AUTH_SECRET y, para login con Discord, DISCORD_CLIENT_ID/SECRET
cp .env.example .env

# 2. Aplicar migraciones y generar el cliente de Prisma
#    (se genera en src/generated/prisma, que no se versiona)
npx prisma migrate deploy
npx prisma generate

# 3. Levantar en modo watch → http://localhost:3001
pnpm start:dev

# Verificar
curl http://localhost:3001/api/health   # {"data":{"status":"ok"}}
```

Notas:

- Si cambias `prisma/schema.prisma`, crea la migración con `npx prisma migrate dev --name <nombre>`. En Prisma 7 `migrate dev` **no** regenera el cliente: corre `npx prisma generate` después.
- Para regenerar los modelos de Better Auth (por ejemplo, al agregar un plugin): `npx auth@latest generate --config src/auth/auth.ts --output prisma/schema.prisma`. El paquete `@better-auth/cli` está deprecado; su reemplazo es `auth`.
- `AuthModule` instala un **guard global**: todo endpoint nuevo queda protegido salvo que lleve `@AllowAnonymous()` u `@OptionalAuth()`.
- Para Discord, registra este Redirect URI en el Developer Portal (OAuth2): `http://localhost:3001/api/auth/callback/discord`.

### Endpoints

| Método | Ruta | Sesión | Descripción |
|--------|------|--------|-------------|
| `GET` | `/api/health` | No | Health check |
| `POST` | `/api/auth/sign-up/email` | No | Registro con email y contraseña (mínimo 8 caracteres) |
| `POST` | `/api/auth/sign-in/email` | No | Inicio de sesión con email y contraseña |
| `POST` | `/api/auth/sign-in/social` | No | Inicia el login OAuth (`provider: "discord"`) |
| `GET` | `/api/auth/get-session` | Opcional | Sesión actual (`null` si no hay cookie válida) |
| `POST` | `/api/auth/sign-out` | Sí | Cierra la sesión |
| `GET` | `/api/users/me` | Sí | Perfil del usuario autenticado (`401` sin sesión) |

La sesión viaja en la cookie `better-auth.session_token` y dura 7 días.

### Probar con Postman

Antes de empezar:

- Postman guarda las cookies por dominio, así que después del registro o del login las siguientes requests a `localhost:3001` ya van autenticadas.
- Agrega el header `Origin: http://localhost:5173` (o cualquier origen de `TRUSTED_ORIGINS`) a los `POST` de `/api/auth/*`; conviene definirlo a nivel de colección. Better Auth lo exige cuando la request lleva cookies y, sin él, responde `403 MISSING_OR_NULL_ORIGIN`.

**1. Registro**

```http
POST http://localhost:3001/api/auth/sign-up/email
Content-Type: application/json
Origin: http://localhost:5173

{
  "name": "Test User",
  "email": "test@example.com",
  "password": "SecurePassword123!"
}
```

Responde `200` con `{ token, user }` y deja la cookie de sesión. El usuario queda en la tabla `user` y la contraseña (hasheada) en `account`.

**2. Inicio de sesión**

```http
POST http://localhost:3001/api/auth/sign-in/email
Content-Type: application/json
Origin: http://localhost:5173

{
  "email": "test@example.com",
  "password": "SecurePassword123!"
}
```

Responde `200` con `{ redirect: false, token, user }`, o `401` si las credenciales son inválidas.

**3. Sesión actual**

```http
GET http://localhost:3001/api/auth/get-session
```

Responde `{ session, user }`; sin cookie válida responde `null`.

**4. Login con Discord**

```http
POST http://localhost:3001/api/auth/sign-in/social
Content-Type: application/json
Origin: http://localhost:5173

{
  "provider": "discord"
}
```

Responde `{ url, redirect: true }`, donde `url` apunta a `discord.com/api/oauth2/authorize`. Postman sirve para comprobar que la URL se genera, pero el flujo completo requiere un navegador: Better Auth guarda una cookie firmada `better-auth.state` que debe volver en el callback. Para completarlo, abre `http://localhost:3001/api/health` en el navegador y ejecuta en la consola:

```js
const res = await fetch('/api/auth/sign-in/social', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    provider: 'discord',
    callbackURL: 'http://localhost:3001/api/users/me',
  }),
});
location.href = (await res.json()).url;
```

Tras autorizar en Discord, el callback crea la sesión y redirige a `/api/users/me`. Si `DISCORD_CLIENT_ID` o `DISCORD_CLIENT_SECRET` están vacías, este endpoint responde `500` (`OAuth provider requires clientId` en el log).

**5. Perfil del usuario autenticado**

```http
GET http://localhost:3001/api/users/me
```

```json
{
  "data": {
    "id": "1KkA8ZO6hbceNrnjIJprFf0uhn9asbq5",
    "name": "Test User",
    "email": "test@example.com",
    "image": null
  }
}
```

Sin sesión responde `401 Unauthorized`.

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
