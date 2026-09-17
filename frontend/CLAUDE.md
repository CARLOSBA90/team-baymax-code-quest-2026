# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager: pnpm.

```bash
pnpm dev          # start Vite dev server
pnpm build        # tsc -b (typecheck all project refs) then vite build
pnpm preview      # preview production build

pnpm lint         # biome lint only
pnpm format       # biome format only, writes changes
pnpm check        # biome lint + format check, no writes
pnpm check:fix    # biome lint + format, writes fixes
```

No test runner set up. No `pnpm test` script exists.

## Architecture

Single-page React 19 + TypeScript + Vite app. No router, no state management library, no CSS framework.

- `src/main.tsx` — entry point, mounts `<App />` into `#root` in strict mode.
- `src/App.tsx` — the entire UI lives here as one component (hero section, docs links, social links).
- `src/App.css` / `src/index.css` — plain CSS with nesting (no CSS-in-JS, no Tailwind).
- `public/icons.svg` — a single sprite sheet of `<symbol>` icons, referenced from `App.tsx` via `<use href="/icons.svg#icon-id">`. Add new icons as `<symbol>` entries here rather than importing separate SVG files.
- TypeScript project is split into `tsconfig.app.json` (app source, bundler resolution, `verbatimModuleSyntax`) and `tsconfig.node.json` (Vite config), tied together by `tsconfig.json` project references.

## Linting & formatting

Biome (`@biomejs/biome`) replaces ESLint/Prettier entirely — there is no ESLint config in this repo. Config is in `biome.json`:

- 2-space indent, double quotes, semicolons, trailing commas, 100-char line width.
- `a11y` recommended rules are enabled and enforced (e.g. `noSvgWithoutTitle`, `noAmbiguousAnchorText`) — decorative `<svg>`/`<symbol>` elements need a `<title>`, and links need non-ambiguous accessible text.
- `organizeImports` runs as a formatter action.
- Run `pnpm check:fix` before committing to apply both lint fixes and formatting.
