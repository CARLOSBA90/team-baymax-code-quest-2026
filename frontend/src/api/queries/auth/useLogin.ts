import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authKeys } from "@/api/queries/auth";
import { signInEmail } from "@/api/services";
import type { AuthError } from "@/lib";

type LoginInput = { email: string; password: string };

export function useLogin(): UseMutationResult<void, AuthError, LoginInput> {
  const queryClient = useQueryClient();

  return useMutation<void, AuthError, LoginInput>({
    mutationKey: [...authKeys.all, "login"],
    mutationFn: signInEmail,
    onSuccess: () => {
      queryClient.clear();
    },
  });
}
