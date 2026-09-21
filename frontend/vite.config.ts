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
        "src/components/auth/**",
        "src/pages/auth/**",
        "src/router/GuestRoute.tsx",
        "src/router/ProtectedRoute.tsx",
        "src/router/useGuardSession.ts",
      ],
      exclude: ["**/__tests__/**", "**/index.ts"],
      thresholds: { lines: 80, functions: 80, statements: 80, branches: 70 },
    },
  },
});
