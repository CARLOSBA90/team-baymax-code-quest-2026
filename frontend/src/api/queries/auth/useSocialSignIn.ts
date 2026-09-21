import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { authKeys } from "@/api/queries/auth";
import { type SocialProvider, signInSocial } from "@/api/services";
import type { AuthError } from "@/lib";

export function useSocialSignIn(): UseMutationResult<void, AuthError, SocialProvider> {
  return useMutation<void, AuthError, SocialProvider>({
    mutationKey: [...authKeys.all, "social"],
    mutationFn: signInSocial,
  });
}
