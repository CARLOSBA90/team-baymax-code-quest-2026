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
        "src/{components,pages}/auth/**",
        "src/lib/user-initials.ts",
        "src/lib/assessment-labels.ts",
        "src/lib/roadmaps-location-state.ts",
        "src/components/assessment/**",
        "src/components/ui/GhostButton.tsx",
        "src/components/ui/Modal.tsx",
        "src/hooks/**",
        "src/components/dashboard/**",
        "src/components/ui/NebulaSurface.tsx",
        "src/components/layouts/DashboardLayout.tsx",
        "src/pages/dashboard/**",
        "src/router/{GuestRoute,ProtectedRoute,router}.tsx",
        "src/router/useGuardSession.ts",
      ],
      exclude: ["**/__tests__/**", "**/index.ts"],
      thresholds: { lines: 80, functions: 80, statements: 80, branches: 70 },
    },
  },
});
