import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { createMemoryRouter, type RouteObject, RouterProvider } from "react-router-dom";
import { routes } from "@/router/router";
import { createTestQueryClient } from "@/test/renderWithProviders";

type Options = {
  /** `QueryClient` precargado; si no llega, se crea uno nuevo sin retries. */
  queryClient?: QueryClient;
};

/**
 * Renderiza el árbol real de `routes` con un data router en memoria. Hace falta un data
 * router (no `MemoryRouter` + `useRoutes`) porque las páginas y layouts usan `lazy`, que
 * solo resuelven `createBrowserRouter`/`createMemoryRouter`. Las páginas aparecen de forma
 * asíncrona: búscalas con `findBy*`.
 */
export function renderRoutes(
  initialEntries: string[],
  { queryClient = createTestQueryClient() }: Options = {},
) {
  const router = createMemoryRouter(routes, { initialEntries });
  return {
    router,
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    ),
  };
}

type LazyRoute = RouteObject & { lazy?: () => Promise<unknown> };

/**
 * Importa por adelantado todos los módulos `lazy` de `routes` para que el primer `import()`
 * de cada spec no dependa de lo que tarde Vite en transformar el módulo. El router sigue
 * resolviendo `lazy` de forma asíncrona, así que los `findBy*` siguen siendo necesarios.
 */
export async function preloadLazyRoutes(routeObjects: RouteObject[] = routes): Promise<void> {
  const pending: Promise<unknown>[] = [];
  const visit = (list: RouteObject[]) => {
    for (const route of list as LazyRoute[]) {
      if (typeof route.lazy === "function") pending.push(route.lazy());
      if (route.children) visit(route.children);
    }
  };
  visit(routeObjects);
  await Promise.all(pending);
}
