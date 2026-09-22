# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager: pnpm.

```bash
pnpm dev              # start Vite dev server
pnpm build            # tsc -b (typecheck all project refs) then vite build
pnpm preview          # preview production build
pnpm typecheck        # tsc -b only

pnpm check            # biome check (lint + format), no writes
pnpm check:fix        # biome check --write

pnpm test             # vitest run
pnpm test:watch       # vitest in watch mode
pnpm test:coverage    # vitest run --coverage (v8), enforces thresholds
```

## Architecture

React 19 + TypeScript + Vite SPA.

- `src/main.tsx` — entry point, mounts the app in strict mode. `src/Root.tsx` is the root route element.
- `src/router/` — `react-router-dom`. `router.tsx` exports `routes: RouteObject[]` and `router = createBrowserRouter(routes)`. `GuestRoute` protects `/auth/*` (guests only), `ProtectedRoute` protects `/dashboard/*`; both use `useGuardSession`. `/dashboard` index redirects to `/dashboard/roadmaps`; dashboard routes render under `DashboardLayout`.
- `src/pages/` — route pages (`auth/LoginPage`, `auth/RegisterPage`, `dashboard/RoadmapsPage`).
- `src/components/` — `auth/` (forms, fields, notices), `dashboard/` (`DashboardSidebar`, `SidebarNavItem`, `SidebarUserCard`, `SidebarIcons` — the dashboard sidebar shell), `layouts/` (`AuthLayout`, `DashboardLayout`), `ui/`.
- `src/lib/auth-client.ts` — Better Auth client (`better-auth/react`). `src/lib/auth-errors.ts` — auth error mapping.
- `src/api/` — axios `client.ts`, `queryClient.ts`, `services/` (auth/users), and `queries/` (TanStack React Query hooks + query keys).
- `src/schemas/` — zod schemas. `src/types/` — shared types.
- `@/*` aliases `./src/*` (in both `vite.config.ts` and `tsconfig.app.json`).

## Conventions

When creating or modifying any file in `src/`, always invoke the `frontend-conventions` skill (`.claude/skills/frontend-conventions/SKILL.md`): imports only via `@/` or `./`, imports through the folder's `index.ts` barrel, and `PropsWithChildren` for `children`. Biome (`noRestrictedImports`) enforces the first two rules.

## Styling

Tailwind v4 via `@tailwindcss/vite`, CSS-first (no `tailwind.config.js`). Design tokens are declared in `src/index.css` under `@theme`; add or change theme values there.

## Testing

Vitest 5 + jsdom + Testing Library (config in the `test` block of `vite.config.ts`).

- Specs live in `__tests__/` folders beside the code: `src/**/__tests__/**/*.spec.{ts,tsx}`.
- `globals: false` — import `describe`, `it`, `expect`, `vi`, etc. from `vitest` explicitly. `src/test/setup.ts` loads `@testing-library/jest-dom/vitest` and runs `cleanup` after each test. `restoreMocks` and `unstubGlobals` are on.
- Render components with `renderWithProviders(ui, { route })` from `src/test/renderWithProviders.tsx` (fresh `QueryClient` with no retries + `MemoryRouter`).
- Mock the API layer with `vi.mock("@/api/services", ...)`; `GuestRoute`/`ProtectedRoute` specs mock `@/router/useGuardSession`; only `useGuardSession.spec.tsx` mocks `@/lib/auth-client` (`authClient.useSession`).
- Fake timers: Testing Library only detects Jest fake timers, so with `vi.useFakeTimers()` also stub a global `jest` (`vi.stubGlobal("jest", { advanceTimersByTime: vi.advanceTimersByTime.bind(vi) })`). See `useFakeTimersForTestingLibrary` in `RegisterPage.spec.tsx`.
- Coverage is scoped to auth code (`lib/auth-errors.ts`, `components/auth/**`, `pages/auth/**`, router guards) and the dashboard shell (`lib/user-initials.ts`, `components/dashboard/**`, `components/ui/EmptyStateSurface.tsx`, `components/layouts/DashboardLayout.tsx`, `pages/dashboard/**`, `router/{GuestRoute,ProtectedRoute,router}.tsx`, `router/useGuardSession.ts`) — currently 16 spec files, 144 tests, including `components/auth/__tests__/{PasswordField,PrimaryButton}.spec.tsx` and `components/dashboard/__tests__/{SidebarNavItem,SidebarUserCard,DashboardSidebar,RoadmapsEmptyState}.spec.tsx` — with thresholds 80% lines/functions/statements and 70% branches. Widen `coverage.include` as more code gets tests.

## Linting & formatting

Biome (`@biomejs/biome`) replaces ESLint/Prettier entirely — there is no ESLint config in this repo. Config is in `biome.json`:

- 2-space indent, double quotes, semicolons, trailing commas, 100-char line width.
- `a11y` recommended rules are enabled and enforced — decorative `<svg>` elements need a `<title>`, and links need non-ambiguous accessible text.
- `useAwait`, `noUnusedImports`, `noUnusedVariables`, `useImportType`, `useConst` are errors.
- `organizeImports` runs as a formatter action.
- Run `pnpm check:fix` before committing to apply both lint fixes and formatting.
