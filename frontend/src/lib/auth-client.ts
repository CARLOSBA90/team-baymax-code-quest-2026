import { createAuthClient } from "better-auth/react";

const rawBaseUrl = import.meta.env.VITE_API_URL?.trim();

if (!rawBaseUrl) {
  throw new Error(
    "VITE_API_URL no está definida. Configúrala en .env (solo origen, p. ej. http://localhost:3001).",
  );
}

export const authClient = createAuthClient({ baseURL: rawBaseUrl.replace(/\/+$/, "") });

export const buildFrontendUrl = (path: string): string => `${window.location.origin}${path}`;
