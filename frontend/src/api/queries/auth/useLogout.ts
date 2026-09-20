import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authKeys } from "@/api/queries/auth";
import { signOut } from "@/api/services";
import type { AuthError } from "@/lib";

export function useLogout(): UseMutationResult<void, AuthError, void> {
  const queryClient = useQueryClient();

  return useMutation<void, AuthError, void>({
    mutationKey: [...authKeys.all, "logout"],
    mutationFn: signOut,
    onSuccess: () => {
      // Sin navigate manual: al pasar la sesion a null, ProtectedRoute redirige a /auth/login.
      queryClient.clear();
    },
  });
}
