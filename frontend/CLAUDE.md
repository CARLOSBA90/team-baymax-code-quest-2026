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
- `src/router/` — `react-router-dom`. `router.tsx` exports `routes: RouteObject[]` and `router = createBrowserRouter(routes)`. `GuestRoute` protects `/auth/*` (guests only), `ProtectedRoute` protects `/dashboard/*`; both use `useGuardSession`. `/dashboard` index redirects to `/dashboard/roadmaps`; dashboard routes (`roadmaps`, `roadmaps/new`) render under `DashboardLayout`. `/dashboard/roadmaps/new` is the assessment wizard, reached from the roadmaps empty-state CTA; "Mis Rutas" stays active on it.
- `src/pages/` — route pages (`auth/LoginPage`, `auth/RegisterPage`, `dashboard/RoadmapsPage` — shows a one-shot success notice when `location.state` matches `ASSESSMENT_COMPLETED_STATE` (`lib/roadmaps-location-state.ts`) and then clears the state with `replace`; the notice is tied to the history entry (`location.key`), so back/forward to another Mis Rutas entry hides it; `dashboard/AssessmentPage` — the "Descubre tu ruta" questionnaire: breadcrumb, "Salir", and inside a `NebulaSurface` a state machine (skeleton while loading, load error with "Reintentar", empty-list message, wizard with a submit-error notice above it); a successful submit navigates to `/dashboard/roadmaps` with `replace` and the completed state).
- `src/components/` — `auth/` (forms, fields, notices; `TermsDialog` — the register terms modal opened from the "términos y condiciones" button next to the checkbox, which stays independent: "Aceptar" marks it and closes, any other close leaves it untouched; "Aceptar" is disabled until the text is scrolled to the end via the shared `useScrolledToEnd` hook (`src/hooks/shared/`, exported from the `@/hooks` barrel); the official terms text lives in `auth/terms-text.ts` as typed data — `TERMS_TITLE` (kept as "Términos y condiciones", the dialog's accessible name), `TERMS_INTRO`, `TERMS_SECTIONS` (`{ heading, paragraphs }`, rendered as `<h3>` + `<p>`), `TERMS_CLOSING` (after an `<hr>`); a `TermsParagraph` is a string or an array of string / `{ bold }` segments (rendered as `<strong>`), and `termsParagraphText()` flattens one to plain text; a `TODO(terms-modal)` flags the placeholders `[FECHA]`, `[NOMBRE DE LA PLATAFORMA]` and `[CORREO DE CONTACTO]` that must be filled before production — all of it plus `TermsDialog` is exported from the `auth` barrel), `dashboard/` (`DashboardSidebar`, `SidebarNavItem`, `SidebarUserCard`, `SidebarIcons` — the dashboard sidebar shell), `assessment/` (the questionnaire wizard: `AssessmentWizard`, `AssessmentWizardSkeleton`, `AssessmentProgress`, `AssessmentQuestion`, `AssessmentOptionCard`, `AssessmentNav`, `AssessmentIcons`, and the `useAssessmentWizard` reducer hook), `layouts/` (`AuthLayout`, `DashboardLayout`), `ui/` (incl. `Modal` — generic controlled shell over native `<dialog>` + `showModal()`: blurred backdrop, glass panel and an X button labelled "Cerrar diálogo"; no title/footer, the consumer passes heading and buttons as `children` and names it with `aria-labelledby`/`aria-label`; closes via `onClose` on X, Esc (`cancel`, default prevented) and backdrop click; locks page scroll with `overflow-hidden` on `<html>` and returns focus to the opener; both are released whenever `open` turns `false`, even if the browser already closed the `<dialog>` natively).
- `src/lib/auth-client.ts` — Better Auth client (`better-auth/react`). `src/lib/auth-errors.ts` — auth error mapping.
- `src/api/` — axios `client.ts`, `errors.ts` (`getApiErrorMessage`), `queryClient.ts`, `services/` (auth/users, assessments — `GET /assessments/questions` and `POST /assessments/submit` through `get`/`post` of `@/api/client`), and `queries/` (TanStack React Query hooks + query keys; `auth`, `users`, `assessments`).
- `src/schemas/` — zod schemas. `src/types/` — shared types.
- `src/hooks/` — shared React hooks, exported from the `@/hooks` barrel (`shared/useScrolledToEnd` — latches `hasReachedEnd` once a scroll container reaches its end within an 8px threshold, or immediately when the content does not overflow; while the element has no layout — `clientHeight === 0`, e.g. inside a `<dialog>` before `showModal()` — it does not evaluate, and the `ResizeObserver` re-checks once it gets size).
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
- `renderWithProviders` also accepts `initialEntries`/`initialIndex` (entries may carry `state`; `initialEntries` wins over `route`) and a preloaded `queryClient`; it returns the `queryClient` it used. `createTestQueryClient()` builds the same no-retry client.
- Test fixtures live in `src/test/fixtures/` (`assessments.ts` — questions + `buildAssessmentResultMock`; `api-errors.ts` — `buildAxiosError`, `buildNetworkError`). No barrel: import them directly (`@/test/fixtures/assessments`) and **only from specs** — production code never imports fixtures.
- Mock the API layer with `vi.mock("@/api/services", ...)` in page/component specs; the assessments hooks spec (`api/queries/assessments/__tests__/assessments.spec.tsx`) mocks `@/api/client` instead. `GuestRoute`/`ProtectedRoute` specs mock `@/router/useGuardSession`; only `useGuardSession.spec.tsx` mocks `@/lib/auth-client` (`authClient.useSession`).
- `<dialog>` in jsdom: `src/test/setup.ts` polyfills `HTMLDialogElement.prototype.showModal`/`close` (`showModal` sets `open` and focuses the first focusable descendant; `close` clears `open` and dispatches `close` synchronously). No top layer, focus trap, inertness or native Esc — those are manual QA only. Simulate Esc with `fireEvent(dialog, new Event("cancel", { cancelable: true }))`. jsdom has no layout, so scroll overflow is simulated with `vi.spyOn(HTMLElement.prototype, "scrollHeight" | "clientHeight", "get").mockReturnValue(…)` **before** opening, then `region.scrollTop = N` + `fireEvent.scroll(region)`; without the spies `clientHeight` is 0, which `useScrolledToEnd` treats as "no layout yet" and never evaluates — so the terms "Aceptar" stays disabled. To simulate content that fits, mock equal heights (e.g. `300`/`300`).
- **Known debt — `rerender` loses providers:** the `rerender` returned by `renderWithProviders` is Testing Library's raw one, so it re-renders the UI **without** `QueryClientProvider`/`MemoryRouter`; the root element type changes and React remounts the whole tree (state and effects reset). Until the helper is fixed, change props through a stateful test wrapper (e.g. trigger button + `useState`, as in `Modal.spec.tsx`/`TermsDialog.spec.tsx`) instead of `rerender`.
- Fake timers: Testing Library only detects Jest fake timers, so with `vi.useFakeTimers()` also stub a global `jest` (`vi.stubGlobal("jest", { advanceTimersByTime: vi.advanceTimersByTime.bind(vi) })`). See `useFakeTimersForTestingLibrary` in `RegisterPage.spec.tsx`.
- Coverage is scoped to auth code (`lib/auth-errors.ts`, `components/auth/**`, `pages/auth/**`, router guards), the dashboard shell (`lib/user-initials.ts`, `components/dashboard/**`, `components/ui/NebulaSurface.tsx`, `components/layouts/DashboardLayout.tsx`, `pages/dashboard/**`, `router/{GuestRoute,ProtectedRoute,router}.tsx`, `router/useGuardSession.ts`) and the assessment wizard (`lib/assessment-labels.ts`, `lib/roadmaps-location-state.ts`, `components/assessment/**`, `components/ui/GhostButton.tsx`), plus `components/ui/Modal.tsx` and `hooks/**` (the terms modal pieces are already under `components/auth/**`) — currently 31 spec files, 344 tests, including `components/auth/__tests__/{PasswordField,PrimaryButton,TermsDialog}.spec.tsx`, `hooks/shared/__tests__/useScrolledToEnd.spec.tsx`, `components/ui/__tests__/Modal.spec.tsx`, `components/dashboard/__tests__/{SidebarNavItem,SidebarUserCard,DashboardSidebar,RoadmapsEmptyState}.spec.tsx`, `components/assessment/__tests__/*.spec.{ts,tsx}` (incl. `AssessmentWizardSkeleton`), `lib/__tests__/roadmaps-location-state.spec.ts` and `pages/dashboard/__tests__/{AssessmentPage,RoadmapsPage}.spec.tsx` (`api/queries/assessments/__tests__/assessments.spec.tsx` runs but `api/**` is outside coverage) — with thresholds 80% lines/functions/statements and 70% branches. Widen `coverage.include` as more code gets tests.

## Linting & formatting

Biome (`@biomejs/biome`) replaces ESLint/Prettier entirely — there is no ESLint config in this repo. Config is in `biome.json`:

- 2-space indent, double quotes, semicolons, trailing commas, 100-char line width.
- `a11y` recommended rules are enabled and enforced — decorative `<svg>` elements need a `<title>`, and links need non-ambiguous accessible text.
- `useAwait`, `noUnusedImports`, `noUnusedVariables`, `useImportType`, `useConst` are errors.
- `organizeImports` runs as a formatter action.
- Run `pnpm check:fix` before committing to apply both lint fixes and formatting.
