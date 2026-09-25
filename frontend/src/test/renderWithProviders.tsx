import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter, type MemoryRouterProps } from "react-router-dom";

type InitialEntry = NonNullable<MemoryRouterProps["initialEntries"]>[number];

type Options = {
  route?: InitialEntry;
  /** Si llega, prevalece sobre `route`. */
  initialEntries?: InitialEntry[];
  initialIndex?: number;
  /** `QueryClient` precargado; si no llega, se crea uno nuevo sin retries. */
  queryClient?: QueryClient;
};

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
}

export function renderWithProviders(
  ui: ReactElement,
  { route, initialEntries, initialIndex, queryClient = createTestQueryClient() }: Options = {},
) {
  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries ?? [route ?? "/"]} initialIndex={initialIndex}>
          {ui}
        </MemoryRouter>
      </QueryClientProvider>,
    ),
  };
}
