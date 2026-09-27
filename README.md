# CodeQuest

Plataforma de aprendizaje personalizado para estudiantes de DevTalles. Genera rutas de aprendizaje adaptadas al perfil de habilidades del usuario y hace seguimiento de progreso por curso y por ruta.

Stack: NestJS (Monolito Modular) en el backend, React 19 + Vite en el frontend.

---

## Tabla de Contenidos

- [Descripcion del Proyecto](#descripcion-del-proyecto)
- [Arquitectura](#arquitectura)
- [Tech Stack](#tech-stack)
- [Estructura del Repositorio](#estructura-del-repositorio)
- [Prerrequisitos](#prerrequisitos)
- [Inicializacion del Proyecto](#inicializacion-del-proyecto)
  - [Backend (NestJS)](#backend-nestjs)
  - [Frontend (React + Vite)](#frontend-react--vite)
- [Variables de Entorno](#variables-de-entorno)
- [Estrategia de Ramas Git](#estrategia-de-ramas-git)
- [Spec-Kits](#spec-kits)

---

## Descripcion del Proyecto

CodeQuest es un complemento para estudiantes suscritos a DevTalles. El flujo principal es:

1. El usuario se registra o inicia sesion (email/password o Discord/Google/GitHub).
2. Completa un cuestionario de diagnostico que evalua sus habilidades e intereses.
3. El sistema genera una ruta de aprendizaje personalizada basada en el catalogo de cursos de DevTalles.
4. El usuario sigue su ruta, marca progreso y puede pausar o reanudar la ruta en cualquier momento.

---

## Arquitectura

```
+--------------------------------------------------+
|               FRONTEND (React + Vite)            |
|              http://localhost:5173               |
+--------------------------------------------------+
                        |
                        | HTTP / cookies (credentials: include)
                        v
+--------------------------------------------------+
|        BACKEND NestJS (Monolito Modular)         |
|             http://localhost:3001                |
|                                                  |
|  /api/auth/*         - AuthModule (Better Auth)  |
|  /api/v1/users       - UsersModule               |
|  /api/v1/assessments - AssessmentsModule         |
|  /api/v1/catalog     - CatalogModule             |
|  /api/v1/roadmaps    - RoadmapsModule            |
|  /api/v1/progress    - ProgressModule            |
|  /api/v1/health      - Health check              |
+--------------------------------------------------+
                        |
                        v
+--------------------------------------------------+
|              PostgreSQL (Neon)                   |
+--------------------------------------------------+
```

### Modulos del Backend

| Modulo | Ruta base | Descripcion |
|--------|-----------|-------------|
| AuthModule | `/api/auth/*` | Better Auth: login email/password y OAuth (Discord, Google, GitHub) |
| UsersModule | `/api/v1/users` | Perfil del usuario autenticado |
| AssessmentsModule | `/api/v1/assessments` | Preguntas del cuestionario y calculo de perfil |
| CatalogModule | `/api/v1/catalog` | Cursos de DevTalles, habilidades y prerequisitos |
| RoadmapsModule | `/api/v1/roadmaps` | Generacion y gestion de rutas de aprendizaje |
| ProgressModule | `/api/v1/progress` | Seguimiento de avance por curso y por ruta |

### Rutas del Frontend

| Ruta | Descripcion |
|------|-------------|
| `/auth/login` | Inicio de sesion (solo visitantes) |
| `/auth/register` | Registro (solo visitantes) |
| `/dashboard/roadmaps` | Lista de rutas del usuario (ruta por defecto del dashboard) |
| `/dashboard/roadmaps/new` | Cuestionario para generar una nueva ruta |
| `/dashboard/roadmaps/:roadmapId` | Detalle de una ruta de aprendizaje |

---

## Tech Stack

### Backend

| Tecnologia | Uso |
|------------|-----|
| NestJS | Framework principal (Monolito Modular, ESM) |
| Better Auth | Autenticacion y gestion de sesiones |
| @thallesp/nestjs-better-auth | Integracion de Better Auth con NestJS |
| PostgreSQL (Neon) | Base de datos relacional en la nube |
| Prisma | ORM y migraciones (cliente generado en `src/generated/prisma`) |
| class-validator / class-transformer | Validacion y transformacion de DTOs |
| Vitest | Tests unitarios y e2e |
| oxlint | Linter (reemplaza ESLint) |
| Prettier | Formateo de codigo |

### Frontend

| Tecnologia | Uso |
|------------|-----|
| React 19 | UI |
| TypeScript | Tipado estatico |
| Vite | Build tool y dev server |
| Tailwind CSS v4 | Estilos (configurado CSS-first via `@theme` en `index.css`) |
| React Router v7 | Enrutamiento con code-splitting por ruta |
| TanStack Query v5 | Estado del servidor y cache de peticiones |
| better-auth/react | Cliente de autenticacion |
| Biome | Linter y formateador (reemplaza ESLint y Prettier) |
| Vitest + Testing Library | Tests de componentes y hooks |

### Requisitos de entorno

| Herramienta | Version minima |
|-------------|----------------|
| Node.js | 22.x (requerido por `@thallesp/nestjs-better-auth`) |
| pnpm | 9.x |

---

## Estructura del Repositorio

```
codequest/
+-- README.md
+-- docker-compose.yml
+-- backend/                          # NestJS (Monolito Modular, ESM)
|   +-- src/
|   |   +-- main.ts                   # Bootstrap: CORS, ValidationPipe, prefijo api/v1
|   |   +-- app.module.ts             # Modulo raiz
|   |   +-- common/                   # Guards, filtros e interceptores globales
|   |   +-- prisma/                   # PrismaService y PrismaModule
|   |   +-- generated/                # Cliente Prisma generado (no se versiona)
|   |   +-- modules/
|   |       +-- auth/                 # Better Auth + Discord/Google/GitHub
|   |       +-- users/                # Perfil del usuario
|   |       +-- assessments/          # Cuestionario y calculo de perfil
|   |       +-- catalog/              # Catalogo de cursos de DevTalles
|   |       +-- roadmaps/             # Generacion y persistencia de rutas
|   |       +-- progress/             # Seguimiento de progreso
|   +-- prisma/
|       +-- schema.prisma
|       +-- seed.ts
+-- frontend/                         # React 19 + Vite + Tailwind v4
|   +-- src/
|   |   +-- index.css                 # Tokens de diseno (@theme), variables CSS
|   |   +-- main.tsx
|   |   +-- Root.tsx
|   |   +-- api/                      # Cliente axios, servicios y queries TanStack
|   |   +-- components/               # Componentes por dominio y UI genericos
|   |   +-- hooks/                    # Hooks personalizados
|   |   +-- lib/                      # Utilidades y cliente de auth
|   |   +-- pages/
|   |   |   +-- auth/                 # LoginPage, RegisterPage
|   |   |   +-- dashboard/            # RoadmapsPage, AssessmentPage, RoadmapDetailPage
|   |   +-- router/                   # Router, GuestRoute, ProtectedRoute
|   |   +-- schemas/                  # Esquemas de validacion (zod)
|   |   +-- types/                    # Tipos compartidos
+-- spec-kits/                        # Documentacion viva del proyecto
|   +-- system-design/                # Arquitectura, entidades, algoritmos
|   +-- nestjs-scaffolding/           # Convenciones de estructura y nombrado NestJS
|   +-- better-auth/                  # Setup de autenticacion (backend y frontend)
|   +-- mocks/                        # Datos mock y documentacion de endpoints
|   +-- checklist.md                  # Estado de avance de tareas por area
+-- tasks/                            # Seguimiento interno del equipo
```

---

## Prerrequisitos

- Node.js >= 22.x
- pnpm >= 9.x
- Acceso a una instancia PostgreSQL (Neon u otra)
- Git

Verificar versiones:

```bash
node --version
pnpm --version
```

---

## Inicializacion del Proyecto

Clonar el repositorio:

```bash
git clone <repo-url> codequest
cd codequest
```

Backend y frontend son proyectos pnpm independientes sin workspace compartido. Instalar y ejecutar cada uno desde su propio directorio.

---

### Backend (NestJS)

#### 1. Instalar dependencias

```bash
cd backend
pnpm install
```

#### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Completar los valores requeridos. Ver la seccion [Variables de Entorno](#variables-de-entorno).

#### 3. Aplicar migraciones de base de datos

```bash
npx prisma migrate deploy
npx prisma generate
```

El cliente Prisma se genera en `src/generated/prisma` y no se versiona. Este paso es obligatorio antes de correr el servidor por primera vez.

Si se modifica `prisma/schema.prisma` durante el desarrollo, crear la nueva migracion con:

```bash
npx prisma migrate dev --name <nombre-descriptivo>
npx prisma generate
```

En Prisma 7, `migrate dev` no regenera el cliente automaticamente; correr `npx prisma generate` por separado.

#### 4. Poblar la base de datos

```bash
pnpm db:seed
```

Carga las preguntas del cuestionario y el catalogo de cursos de DevTalles.

#### 5. Levantar en modo desarrollo

```bash
pnpm start:dev
```

El servidor queda disponible en `http://localhost:3001`.

Verificar que funciona:

```bash
curl http://localhost:3001/api/v1/health
# Respuesta esperada: {"data":{"status":"ok"}}
```

#### Comandos del backend

| Comando | Descripcion |
|---------|-------------|
| `pnpm start:dev` | Servidor en modo watch |
| `pnpm build` | Compilacion a `dist/` |
| `pnpm start:prod` | Servidor desde `dist/` |
| `pnpm test` | Tests unitarios (Vitest) |
| `pnpm test:e2e` | Tests end-to-end |
| `pnpm test:cov` | Tests con cobertura |
| `pnpm lint` | Linting con oxlint |
| `pnpm format` | Formateo con Prettier |
| `pnpm db:seed` | Seed de datos iniciales |
| `npx prisma migrate dev` | Crear y aplicar migracion de desarrollo |
| `npx prisma generate` | Regenerar cliente Prisma |

#### Consideraciones tecnicas del backend

- El proyecto usa **ESM** (`"type": "module"`). Los imports relativos en TypeScript deben incluir la extension `.js` aunque el archivo fuente sea `.ts`. Ejemplo: `import { AppService } from './app.service.js'`.
- **AuthModule** instala un guard global: todo endpoint nuevo queda protegido por defecto. Usar `@AllowAnonymous()` para rutas publicas o `@OptionalAuth()` para rutas con autenticacion opcional.
- Better Auth maneja `/api/auth/*` con su propio prefijo. El prefijo global `api/v1` aplica solo a los modulos propios.
- Para el login con Discord, registrar el siguiente Redirect URI en el Discord Developer Portal: `http://localhost:3001/api/auth/callback/discord`.
- En desarrollo, el header de respuesta `X-Verification-Url` contiene el enlace de verificacion de email, permitiendo confirmar cuentas sin configurar un mailer.

---

### Frontend (React + Vite)

#### 1. Instalar dependencias

```bash
cd frontend
pnpm install
```

#### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Asegurarse de que `VITE_API_URL` apunte al backend: `http://localhost:3001`.

#### 3. Levantar en modo desarrollo

```bash
pnpm dev
```

La aplicacion queda disponible en `http://localhost:5173`.

#### Comandos del frontend

| Comando | Descripcion |
|---------|-------------|
| `pnpm dev` | Servidor de desarrollo con HMR |
| `pnpm build` | Build de produccion (`tsc -b` + `vite build`) |
| `pnpm typecheck` | Verificacion de tipos sin emitir archivos |
| `pnpm check` | Linting y formato con Biome (sin escritura) |
| `pnpm check:fix` | Linting y formato con Biome (aplica correcciones) |
| `pnpm test` | Tests unitarios (Vitest + jsdom) |
| `pnpm test:watch` | Tests en modo watch |
| `pnpm test:coverage` | Tests con cobertura (umbral: 80% lineas/funciones, 70% ramas) |

#### Consideraciones tecnicas del frontend

- **Tailwind CSS v4** se configura exclusivamente en `src/index.css` mediante la directiva `@theme`. No existe `tailwind.config.js`. Para agregar o modificar tokens de diseno, editar ese archivo.
- Los alias de rutas (`@/*` mapeado a `./src/*`) estan declarados en `vite.config.ts` y `tsconfig.app.json`. Cambiar uno requiere cambiar el otro.
- **Biome** reemplaza ESLint y Prettier por completo. Las reglas `useAwait`, `noUnusedImports`, `noUnusedVariables`, `useImportType` y `useConst` son errores. Las supresiones requieren razon explicita: `// biome-ignore lint/<regla>: <razon>`.
- Los imports de solo tipo deben usar `import type` (`verbatimModuleSyntax` activado).
- Enums, parameter properties y namespaces de TypeScript no estan permitidos (`erasableSyntaxOnly`).
- Todas las peticiones al backend deben incluir `credentials: 'include'` para que la cookie de sesion viaje correctamente.

---

## Variables de Entorno

### Backend (`backend/.env`)

| Variable | Descripcion | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | URL de conexion pooled a PostgreSQL | `postgresql://user:pass@host/db?sslmode=require` |
| `DIRECT_URL` | URL de conexion directa (para migraciones) | `postgresql://user:pass@host/db?sslmode=require` |
| `BETTER_AUTH_SECRET` | Secreto para firmar sesiones (minimo 32 caracteres) | generado aleatoriamente |
| `BETTER_AUTH_URL` | URL publica del backend | `http://localhost:3001` |
| `PORT` | Puerto del servidor | `3001` |
| `DISCORD_CLIENT_ID` | Client ID de la app en Discord Developer Portal | requerido para OAuth Discord |
| `DISCORD_CLIENT_SECRET` | Client Secret de Discord | requerido para OAuth Discord |
| `GOOGLE_CLIENT_ID` | Client ID de Google OAuth | opcional |
| `GOOGLE_CLIENT_SECRET` | Client Secret de Google | opcional |
| `GITHUB_CLIENT_ID` | Client ID de GitHub OAuth | opcional |
| `GITHUB_CLIENT_SECRET` | Client Secret de GitHub | opcional |

Los proveedores OAuth se habilitan automaticamente si sus variables de entorno estan presentes.

### Frontend (`frontend/.env`)

| Variable | Descripcion | Ejemplo |
|----------|-------------|---------|
| `VITE_API_URL` | URL base del backend | `http://localhost:3001` |

---

## Estrategia de Ramas Git

```
main  -----+----------------------------------------  produccion
           ^
           | PR (release desde dev)
           |
dev   -----+---+---+---+---+---+-------------------  integracion
               |       ^
               |       | PR + review
               v       |
<tipo>/   -----+-------+  <-- ramas de trabajo
```

### Ramas principales

| Rama | Proposito |
|------|-----------|
| `main` | Produccion. Solo recibe merges desde `dev` como release. |
| `dev` | Integracion. Rama base para todo el desarrollo activo. |

### Prefijos de ramas de trabajo

| Prefijo | Uso |
|---------|-----|
| `feature/` | Nueva funcionalidad |
| `fix/` | Correccion de bug |
| `hotfix/` | Correccion urgente en produccion |
| `refactor/` | Refactorizacion sin cambio funcional |
| `chore/` | Mantenimiento, dependencias, CI |
| `docs/` | Solo documentacion |

### Flujo de trabajo

```bash
# 1. Actualizar dev local
git checkout dev
git pull origin dev

# 2. Crear rama de trabajo
git checkout -b feature/nombre-de-la-feature

# 3. Desarrollar y commitear con Conventional Commits
git commit -m "feat(roadmaps): add pause/resume endpoint"

# 4. Crear Pull Request hacia dev y solicitar review
```

### Convencion de commits (Conventional Commits)

```
feat(roadmaps): add pause/resume endpoint
fix(auth): resolve discord oauth callback redirect
chore(deps): update prisma to 7.x
docs: update environment variables table
```

---

## Spec-Kits

Los **spec-kits** son documentacion viva del proyecto con guias de implementacion, convenciones y datos de referencia.

| Spec-Kit | Descripcion |
|----------|-------------|
| [system-design](./spec-kits/system-design/README.md) | Arquitectura, modelo de datos, algoritmo de rutas, cuestionario y progreso |
| [nestjs-scaffolding](./spec-kits/nestjs-scaffolding/README.md) | Estructura de carpetas, convenciones de nombrado y ejemplo CRUD completo |
| [better-auth](./spec-kits/better-auth/README.md) | Setup de autenticacion en backend y frontend |
| [mocks](./spec-kits/mocks/README.md) | Datos mock y documentacion de contratos de API |
| [checklist](./spec-kits/checklist.md) | Estado de avance de tareas por area |

Leer el spec-kit correspondiente antes de implementar cualquier funcionalidad nueva.

---

## Licencia

MIT. Ver [LICENSE](./LICENSE) para mas detalles.
