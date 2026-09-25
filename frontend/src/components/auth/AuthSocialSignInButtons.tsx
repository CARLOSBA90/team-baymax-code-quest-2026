import { FaDiscord, FaGithubAlt, FaGoogle } from "react-icons/fa6";
import { useSocialSignIn } from "@/api/queries/auth";
import type { SocialProvider } from "@/api/services";
import { Notice } from "@/components/ui";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { OAuthButton } from "./OAuthButton";

export function AuthSocialSignInButtons() {
  const { mutate, isPending, isError, error, variables } = useSocialSignIn();

  const handleSignIn = (provider: SocialProvider) => mutate(provider);
  const isLoading = (provider: SocialProvider) => isPending && variables === provider;

  return (
    <fieldset aria-label="Continuar con un proveedor" className="flex flex-col gap-3">
      {isError && <Notice variant="error">{getAuthErrorMessage(error)}</Notice>}
      <OAuthButton
        variant="discord"
        icon={<FaDiscord size={19} />}
        loading={isLoading("discord")}
        disabled={isPending}
        onClick={() => handleSignIn("discord")}
      >
        Ingresa con Discord
      </OAuthButton>
      <div className="flex gap-3">
        <OAuthButton
          variant="ghost"
          icon={<FaGithubAlt size={18} />}
          loading={isLoading("github")}
          disabled={isPending}
          onClick={() => handleSignIn("github")}
        >
          GitHub
        </OAuthButton>
        <OAuthButton
          variant="ghost"
          icon={<FaGoogle size={18} />}
          loading={isLoading("google")}
          disabled={isPending}
          onClick={() => handleSignIn("google")}
        >
          Google
        </OAuthButton>
      </div>
    </fieldset>
  );
}
