import { QueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        const status = isAxiosError(error) ? error.response?.status : undefined;
        const isClientError = status !== undefined && status >= 400 && status < 500;
        return !isClientError && failureCount < 3;
      },
    },
  },
});
