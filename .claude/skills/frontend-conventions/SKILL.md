---
name: frontend-conventions
description: Convenciones de imports, barrels y tipado de componentes React en frontend/. Úsala SIEMPRE que crees o modifiques un componente, hook, página, servicio o cualquier fichero .ts/.tsx dentro de frontend/src, y al añadir imports en ellos.
---

# Convenciones de código del frontend

Aplica a todo fichero nuevo o modificado en `frontend/src/`. Biome no cubre estas reglas, así que hay que cumplirlas a mano y revisarlas antes de terminar.

## 1. Imports: solo `@/` o `./`

- Import de otra carpeta → alias `@/` (`@/components/auth`, `@/lib`).
- Import de un fichero hermano (misma carpeta) → `./` (`./PasswordField`).
- **Prohibido `../`** (ni `../../`). Si te sale, es que falta el alias.
- Esto incluye specs en `__tests__/`: importa el código bajo test con `@/…`, no con `../Componente`. Los specs antiguos con `../` se migran solo si ya se está tocando ese fichero.
- Los paths de `vi.mock("@/…")` deben coincidir con el path que usa el código real.

## 2. Barrels: importa desde el `index.ts` de la carpeta

- Si la carpeta destino tiene `index.ts`, importa desde ella y no desde el fichero concreto:
  - ✅ `import { AuthCard, AuthDivider } from "@/components/auth";`
  - ❌ `import { AuthCard } from "@/components/auth/AuthCard";`
- Agrupa en un solo import todo lo que salga del mismo barrel.
- **Excepción: dentro de la propia carpeta del barrel** usa hermano `./X`, nunca el barrel propio (evita ciclos de importación). Ejemplo: `useLogin.ts` importa `authKeys` con `./keys`, no con `@/api/queries/auth`.
- Barrels existentes: `api/queries/{auth,users}`, `api/services`, `components/{auth,layouts,ui}`, `lib`, `pages`, `schemas`, `types`.
- Al crear un fichero en una carpeta con barrel, **añade su `export * from "./Nombre";`** (orden alfabético). Si el fichero nuevo es de uso interno y no debe ser público, dilo explícitamente en el resumen.
- Si la carpeta no tiene barrel, no lo crees por defecto: import directo `@/ruta/fichero`. Crea uno solo si el usuario lo pide o ya hay 3+ ficheros consumidos desde fuera.

## 3. Componentes con `children`

- Tipa `children` con `PropsWithChildren`, nunca con `children: React.ReactNode` ni `ReactNode` dentro de la interfaz de props.
  ```tsx
  import type { PropsWithChildren } from "react";

  interface AuthNoticeProps {
    variant: "error" | "info";
  }

  export function AuthNotice({ variant, children }: PropsWithChildren<AuthNoticeProps>) {}
  ```
- Sin props propias: `PropsWithChildren` a secas (`{ children }: PropsWithChildren`).
- `ReactNode` sigue siendo válido para **otras** props de slot (`icon`, `footer`), solo no para `children`.

## 4. Reglas adicionales (ya vigentes en el repo)

- **Type imports**: `import type { … }` (o `type X` inline) para tipos; `verbatimModuleSyntax` lo exige. Importa desde `"react"` con nombre (`PropsWithChildren`), no `React.X` ni `import React`.
- **Solo named exports**; no `export default` (no hay ninguno en el repo). Componentes como `export function Nombre`, sin `React.FC`.
- **Props**: interfaz `NombreProps` en el mismo fichero, exportada si los tests o el padre la necesitan. Sin `any`.
- **Nombres**: componentes y páginas en `PascalCase.tsx`; hooks `useXxx.ts`; utilidades `kebab-case.ts` (`auth-errors.ts`).
- **Sin sintaxis TS no borrable** (`enum`, parameter properties, `namespace`): `erasableSyntaxOnly`.
- **Tests** junto al código en `__tests__/Nombre.spec.tsx`, importando `describe/it/expect/vi` de `vitest` y renderizando con `renderWithProviders`.
- **Estilos**: tokens de Tailwind definidos en `src/index.css`; no valores de color hardcodeados.

## Checklist antes de dar por terminado

1. `grep -rn 'from "\.\./' <ficheros tocados>` → sin resultados.
2. Ningún import profundo (`@/carpeta/sub/Fichero`) hacia una carpeta que tiene `index.ts`.
3. Fichero nuevo en carpeta con barrel → `index.ts` actualizado.
4. Ningún `children` tipado como `ReactNode`.
5. `pnpm check:fix && pnpm typecheck` (y `pnpm test` si hay specs afectados) desde `frontend/`.
