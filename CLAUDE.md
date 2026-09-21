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

pnpm test                       # vitest run (specs in src/**/__tests__/*.spec.{ts,tsx})
pnpm test:watch
pnpm test:coverage              # v8 coverage with thresholds (80% lines/functions/statements, 70% branches)
```

Frontend tests use Vitest + jsdom + Testing Library; see `frontend/CLAUDE.md` for conventions.

## Architecture: plan vs. current state

`README.md` and `spec-kits/` describe the **target** architecture: three separate NestJS services — Auth API (`:3001`, Better Auth), Core API (`:3002`, business logic), Notifications API (`:3003`) — plus a React frontend, all over PostgreSQL.

What actually exists today:

- `backend/` is **one** freshly scaffolded NestJS app (untracked in git as of this writing), not three. It listens on `PORT ?? 3000`, `AppModule` is empty, and there is no `prisma/` directory, no `.env.example`, and no Better Auth wiring yet.
- `better-auth`, `@thallesp/nestjs-better-auth`, `@nestjs/config`, `@prisma/client`, and `prisma` are already **installed** but not yet used anywhere in `src/`.
- `class-validator`, `class-transformer`, and `@nestjs/swagger` are **not** installed, even though the spec-kits assume them.
- `frontend/` is a React 19 + Vite + Tailwind v4 SPA (`package.json` name `code-quest-frontend-app`). It has `react-router-dom` routing (`GuestRoute` for `/auth/*`, `ProtectedRoute` for `/dashboard/*`), a Better Auth client (`src/lib/auth-client.ts`), an API layer (axios + TanStack React Query in `src/api/`), login/register pages and a dashboard roadmaps page, and Vitest tests for the auth flow.

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
