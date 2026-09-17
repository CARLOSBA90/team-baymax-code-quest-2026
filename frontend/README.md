# Code Quest - Frontend App

Single-page React 19 + TypeScript + Vite site.

## Prerequisites

- [Node.js](https://nodejs.org) 20 or newer
- [pnpm](https://pnpm.io) (install with `corepack enable` or `npm install -g pnpm`)

## Getting started

1. Move into `/frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Start the dev server:
   ```bash
   pnpm dev
   ```
   The app will be available at `http://localhost:5173`.

## Other scripts

```bash
pnpm build     # typecheck (tsc -b) then build for production into dist/
pnpm preview   # serve the production build locally to sanity-check it
```

## Linting and formatting with Biome

This project uses [Biome](https://biomejs.dev) for linting and formatting, configured in `biome.json`.

```bash
pnpm check       # lint + format check, no writes
pnpm check:fix   # lint + format, writing fixes
```

Also, you will need `.vscode/settings.json` in your local, to allow *auto-format* on *save-file*. `settings.json` looks like this:

```json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.biome": "always",
    "source.organizeImports.biome": "always"
  },
  "[typescript]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[javascript]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[javascriptreact]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[json]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "js/ts.preferences.importModuleSpecifier": "non-relative"
}
```

Feel free to add any rules you need. Take care provided they don't drastically alter the codebase!