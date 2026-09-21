import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { signUpEmail } from "@/api/services";
import type { AuthError } from "@/lib";
import { authKeys } from "./keys";

type RegisterInput = { name: string; email: string; password: string };
type RegisterResult = { verificationUrl: string | null };

export function useRegister(): UseMutationResult<RegisterResult, AuthError, RegisterInput> {
  return useMutation<RegisterResult, AuthError, RegisterInput>({
    mutationKey: [...authKeys.all, "register"],
    mutationFn: signUpEmail,
    onSuccess: ({ verificationUrl }) => {
      if (import.meta.env.DEV && verificationUrl) {
        console.log("[auth] URL de verificación:", verificationUrl);
      }
    },
  });
}
