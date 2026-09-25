import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    rolldownOptions: {
      output: {
        // Vendors estables en chunks propios: un deploy que solo cambia código de la app no
        // invalida la caché de React/router, TanStack Query ni Better Auth. Las páginas ya se
        // separan por ruta con `lazy` (src/router/router.tsx); zod queda en el chunk de las
        // páginas de auth, que son las únicas que lo usan.
        codeSplitting: {
          groups: [
            {
              name: "react-vendor",
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom)[\\/]/,
              priority: 30,
            },
            {
              name: "query-vendor",
              test: /[\\/]node_modules[\\/]@tanstack[\\/]/,
              priority: 20,
            },
            {
              name: "auth-vendor",
              test: /[\\/]node_modules[\\/](better-auth|@better-auth|@better-fetch|better-call|nanostores|@nanostores|defu)[\\/]/,
              priority: 10,
            },
          ],
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: false,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/__tests__/**/*.spec.{ts,tsx}"],
    env: { VITE_API_URL: "http://localhost:3001" },
    restoreMocks: true,
    unstubGlobals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: [
        "src/lib/auth-errors.ts",
        "src/lib/chunk-error-reload.ts",
        "src/{components,pages}/auth/**",
        "src/lib/user-initials.ts",
        "src/lib/assessment-labels.ts",
        "src/lib/roadmaps-location-state.ts",
        "src/lib/roadmap-{detail,filters,labels,presentation}.ts",
        "src/lib/roadmap-delete-errors.ts",
        "src/api/services/roadmaps.service.ts",
        "src/api/queries/roadmaps/**",
        "src/components/roadmaps/**",
        "src/components/roadmap-detail/**",
        "src/components/ui/DropdownMenu.tsx",
        "src/components/assessment/**",
        "src/components/ui/GhostButton.tsx",
        "src/components/ui/Modal.tsx",
        "src/components/ui/Notice.tsx",
        "src/components/ui/PrimaryButton.tsx",
        "src/hooks/**",
        "src/components/dashboard/**",
        "src/components/ui/NebulaSurface.tsx",
        "src/components/layouts/DashboardLayout.tsx",
        "src/pages/dashboard/**",
        "src/router/{GuestRoute,ProtectedRoute,RouteErrorBoundary,router}.tsx",
        "src/router/useGuardSession.ts",
      ],
      exclude: ["**/__tests__/**", "**/index.ts"],
      thresholds: { lines: 80, functions: 80, statements: 80, branches: 70 },
    },
  },
});
