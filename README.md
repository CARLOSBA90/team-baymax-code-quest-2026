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

### Levantar el backend

Requiere Node.js >= 22.22.1 (lo exige `@thallesp/nestjs-better-auth`), pnpm y una base PostgreSQL (Neon).

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

# 3. Poblar el banco de preguntas iniciales (Seed) 
pnpm prisma db seed

# 4. Levantar en modo watch en http://localhost:3001
pnpm start:dev

# Verificar
curl http://localhost:3001/api/v1/health   # {"data":{"status":"ok"}}
```

Notas:

- Better Auth atiende `/api/auth/*`. Los modulos propios usan el prefijo global `/api/v1`.
- Si cambias `prisma/schema.prisma`, crea la migracion con `npx prisma migrate dev --name <nombre>`. En Prisma 7 `migrate dev` **no** regenera el cliente: corre `npx prisma generate` despues.
- Para regenerar los modelos de Better Auth (por ejemplo, al agregar un plugin): `npx auth@latest generate --config src/modules/auth/auth.ts --output prisma/schema.prisma`. El paquete `@better-auth/cli` esta deprecado; su reemplazo es `auth`.
- `AuthModule` instala un **guard global**: todo endpoint nuevo queda protegido salvo que lleve `@AllowAnonymous()` u `@OptionalAuth()`.
- Para Discord, registra este Redirect URI en el Developer Portal (OAuth2): `http://localhost:3001/api/auth/callback/discord`.

### Endpoints disponibles

| Metodo | Ruta | Sesion | Descripcion |
|--------|------|--------|-------------|
| `GET` | `/api/v1/health` | No | Health check |
| `POST` | `/api/auth/sign-up/email` | No | Registro con email y contrasena (minimo 8 caracteres) |
| `POST` | `/api/auth/sign-in/email` | No | Inicio de sesion con email y contrasena |
| `POST` | `/api/auth/sign-in/social` | No | Inicia el login OAuth (`provider: "discord"`) |
| `GET` | `/api/auth/get-session` | Opcional | Sesion actual (`null` si no hay cookie valida) |
| `POST` | `/api/auth/sign-out` | Si | Cierra la sesion |
| `GET` | `/api/v1/users/me` | Si | Perfil del usuario autenticado (`401` sin sesion) |

La sesion viaja en la cookie `better-auth.session_token` y dura 7 dias. El login con Discord se inicia con `POST /api/auth/sign-in/social`; la ruta `GET /api/auth/signin/discord` no existe en Better Auth 1.7.

### Probar con Postman

Antes de empezar:

- Postman guarda las cookies por dominio, asi que despues del registro o del login las siguientes requests a `localhost:3001` ya van autenticadas.
- Better Auth exige el header `Origin` con un origen de `TRUSTED_ORIGINS` en los `POST` que llevan cookies; sin el responde `403 MISSING_OR_NULL_ORIGIN`. Para no agregarlo a mano, crea una coleccion y en su pestana **Scripts > Pre-request** agrega:

  ```js
  pm.request.headers.upsert({ key: 'Origin', value: 'http://localhost:5173' });
  ```

**1. Registro**

```http
POST http://localhost:3001/api/auth/sign-up/email
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@example.com",
  "password": "SecurePassword123!"
}
```

Responde `200` con `{ token, user }` y deja la cookie de sesion. El usuario queda en la tabla `user` y la contrasena (hasheada) en `account`.

**2. Inicio de sesion**

```http
POST http://localhost:3001/api/auth/sign-in/email
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "SecurePassword123!"
}
```

Responde `200` con `{ redirect: false, token, user }`, o `401` si las credenciales son invalidas.

**3. Sesion actual**

```http
GET http://localhost:3001/api/auth/get-session
```

Responde `{ session, user }`; sin cookie valida responde `null`.

**4. Perfil del usuario autenticado**

```http
GET http://localhost:3001/api/v1/users/me
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

Sin sesion responde `401 Unauthorized`.

**5. Cerrar sesion**

```http
POST http://localhost:3001/api/auth/sign-out
Content-Type: application/json

{}
```

Responde `{ "success": true }`. Despues, `/api/v1/users/me` vuelve a responder `401`.

### Probar el login con Discord

Postman solo sirve para comprobar que `POST /api/auth/sign-in/social` con `{ "provider": "discord" }` devuelve `{ url, redirect: true }`. El flujo completo requiere un navegador: Better Auth guarda una cookie firmada `better-auth.state` que debe volver en el callback.

1. Abre `http://localhost:3001/api/v1/health` en el navegador (usa `localhost`, no `127.0.0.1`).
2. En la consola del navegador ejecuta:

   ```js
   const res = await fetch('/api/auth/sign-in/social', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       provider: 'discord',
       callbackURL: 'http://localhost:3001/api/v1/users/me',
     }),
   });
   const data = await res.json();
   console.log(res.status, data);
   if (data.url) location.href = data.url;
   ```

3. Autoriza en Discord antes de 5 minutos. Si tardas mas, la cookie de estado vence y el callback termina en `/api/auth/error?error=state_mismatch`; en ese caso repite el paso 2.
4. El callback crea el usuario y la sesion y redirige a `/api/v1/users/me` con tu perfil de Discord.

Si `DISCORD_CLIENT_ID` o `DISCORD_CLIENT_SECRET` estan vacias, `sign-in/social` responde `500` (`OAuth provider requires clientId` en el log).

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
