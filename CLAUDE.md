# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repo shape

CodeQuest — a polyrepo-in-one-folder: `backend/` and `frontend/` are **independent pnpm projects**. There is no root `package.json` and no pnpm workspace linking them. Install and run each one from its own directory.

`frontend/` has its own `CLAUDE.md` with frontend-specific detail.

## Commands

### Backend (`cd backend`)

```bash
pnpm install
pnpm start:dev                  # nest start --watch
pnpm build                      # nest build -> dist/
pnpm start:prod                 # node dist/main

pnpm lint                       # oxlint src/ test/   (NOT eslint)
pnpm format                     # prettier --write on src/ and test/

pnpm test                       # vitest run, matches **/*.spec.ts
pnpm test:watch
pnpm test:cov
pnpm test:e2e                   # vitest run --config ./vitest.config.e2e.ts, matches **/*.e2e-spec.ts

pnpm test src/app.controller.spec.ts       # single file
pnpm test -- -t "should return"            # single test by name
```

### Frontend (`cd frontend`)

```bash
pnpm install
pnpm dev                        # Vite on http://localhost:5173
pnpm build                      # tsc -b then vite build
pnpm typecheck                  # tsc -b only
pnpm check                      # biome lint + format check, no writes
pnpm check:fix                  # biome lint + format, writes fixes
```

No test runner is configured on the frontend.

## Architecture: plan vs. current state

`README.md` and `spec-kits/` describe the **target** architecture: three separate NestJS services — Auth API (`:3001`, Better Auth), Core API (`:3002`, business logic), Notifications API (`:3003`) — plus a React frontend, all over PostgreSQL.

What actually exists today:

- `backend/` is **one** NestJS 12 app, not three: it covers the Auth API and Core API roles together. `main.ts` disables the body parser for Better Auth, enables CORS from `TRUSTED_ORIGINS` with `credentials: true`, sets the global prefix `api/v1` and listens on `PORT ?? 3001`. Better Auth routes live at `/api/auth/*`, outside the prefix.
- `AppModule` wires `ConfigModule` (global), `PrismaModule`, `AuthModule.forRoot({ auth })` and the feature modules in `src/modules/`: `users` (`GET /api/v1/users/me`) and `assessments` (`GET questions`, `POST submit`, `GET my-result`). Only `GET /api/v1/health` is `@AllowAnonymous()`; every other endpoint requires a session.
- `src/modules/auth/auth.ts` is the Better Auth instance, not a Nest module: email/password (min 6 chars) with email verification, Google/GitHub/Discord registered only when both of their env vars are set, a sign-up `before` hook that runs `AuthValidator`, and a dev-only `X-Verification-Url` header gated by `EXPOSE_VERIFICATION_URL=true` plus `NODE_ENV=development`.
- Prisma 7 with the `prisma-client` generator (output `src/generated/prisma`, gitignored) and `@prisma/adapter-pg` on Neon. The app uses `DATABASE_URL` (pooler); `prisma.config.ts` points the CLI at `DIRECT_URL`. `prisma.service.ts` exports one shared `prisma` instance used by both Nest and Better Auth. Models: the Better Auth tables (`User`, `Session`, `Account`, `Verification`) plus `Question`, `QuestionOption`, `Assessment`, `AssessmentAnswer`. Questions are seeded with `pnpm db:seed`. Env vars are documented in `backend/.env.example`.
- `class-validator`, `class-transformer`, and `@nestjs/swagger` are still **not** installed; bodies are checked by hand-written validators (`auth.validator.ts`, `assessments/validators/`). Endpoints return the `{ data }` envelope.
- `test/auth-verification.e2e-spec.ts` boots the real `AppModule` on Better Auth's memory adapter, so `pnpm test:e2e` needs no PostgreSQL.
- `frontend/` (`code-quest-frontend-app`) has React Router (`src/router/`, with `ProtectedRoute` and `GuestRoute`), TanStack Query over an axios client in `src/api/` (base `${VITE_API_URL}/api/v1`, `withCredentials`), the Better Auth client in `src/lib/auth-client.ts`, zod schemas, and pages for login, register and `dashboard/roadmaps`. `VITE_API_URL` (origin only) is required; see `frontend/.env.example`.
- Pending work is tracked in `spec-kits/checklist.md`: catalog, roadmaps and progress modules on the backend; assessment UI and results dashboard on the frontend.

When implementing, decide explicitly whether to keep the single-service layout or split into the three services the docs describe — don't assume the docs match the tree.

## spec-kits/ is the convention source of truth

`spec-kits/` is living documentation (in Spanish) that defines how this project is meant to be built. Read the relevant kit before implementing:

- `spec-kits/nestjs-scaffolding/` — project setup steps and `structure.md`: the `common/ config/ prisma/ modules/` layout, file/class naming tables, controller method names (`findAll`/`findOne`/`create`/`update`/`remove`), and rules like "no logic in controllers", "DTOs always, never untyped bodies". `example-resource/` is a complete copy-and-adapt CRUD reference.
- `spec-kits/better-auth/setup-backend.md` — the Better Auth wiring: `bodyParser: false` in `NestFactory.create`, `AuthModule.forRoot({ auth, bodyParser: {...} })`, CORS with `credentials: true`, `trustedOrigins`. **The `AuthModule` installs a global guard — every endpoint is protected unless marked `@AllowAnonymous()` or `@OptionalAuth()`.** Includes a "common errors" table worth checking before debugging auth by hand.
- `spec-kits/better-auth/setup-frontend.md` — `createAuthClient` from `better-auth/react`, `useSession`, and the rule that every cross-service fetch needs `credentials: 'include'`.
- `spec-kits/mocks/backend/api-endpoints.md` — the API contract. Note the response envelope every endpoint is expected to use: `{ data }`, `{ data, meta: { total, page, limit, totalPages } }` for lists, `{ message, data }` for writes.

`better-auth-schema.pdf` at the repo root is the Better Auth database schema reference.

## Backend toolchain gotchas

The scaffold deliberately diverges from the NestJS defaults the spec-kits were written against:

- **ESM.** `"type": "module"` with `module: nodenext`. Relative imports must carry the `.js` extension even in TypeScript source — `import { AppService } from './app.service.js'`. Omitting it breaks the build.
- **Vitest, not Jest.** `globals: true`, so `describe`/`it`/`expect` are ambient (declared via `types: ["vitest/globals"]` in `tsconfig.json`). Unit specs live beside the source as `*.spec.ts`; e2e specs live in `test/` as `*.e2e-spec.ts` and need the separate config. Path aliases resolve through `vite-tsconfig-paths`.
- **oxlint, not ESLint.** Config is `oxlint.json`; there is no `.eslintrc`. Prettier handles formatting only (`singleQuote`, `trailingComma: all`).
- `strict: true` but `strictPropertyInitialization: false` — DTO/entity class fields don't need definite-assignment assertions.

## Frontend toolchain gotchas

- **Tailwind v4 via `@tailwindcss/vite`**, configured CSS-first — there is no `tailwind.config.js`. Design tokens are declared in `src/index.css` under `@theme`, backed by raw-RGB CSS variables swapped by `:root[data-theme="dark"]` / `[data-theme="light"]`. Add or change theme colors there, not in a JS config.
- `@/*` aliases `./src/*`, configured in **both** `vite.config.ts` (resolve.alias) and `tsconfig.app.json` (paths). Changing one requires changing the other.
- Biome replaces ESLint and Prettier entirely. `useAwait`, `noUnusedImports`, `noUnusedVariables`, `useImportType`, and `useConst` are errors; a11y recommended rules are on. Suppress with `// biome-ignore lint/<rule>: <reason>` — the reason is required.
- `verbatimModuleSyntax` + `erasableSyntaxOnly` are on: type-only imports need `import type`, and TS-only runtime syntax (enums, parameter properties, namespaces) is rejected.

## Git conventions

Work branches off `dev`, PR back into `dev`; `main` is production and merges from `dev` as a release. Branch names are `<type>/<kebab-case>` using `feature/`, `fix/`, `hotfix/`, `refactor/`, or `docs/`. Commits follow Conventional Commits with the service as scope — `feat(core-api): add tasks CRUD endpoints`, `fix(auth-api): resolve session cookie domain`.
