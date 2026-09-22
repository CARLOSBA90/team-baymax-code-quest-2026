import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { signInEmail } from "@/api/services";
import type { AuthError } from "@/lib";
import { authKeys } from "./keys";

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
