import { FaDiscord, FaGithubAlt, FaGoogle } from "react-icons/fa6";
import { useSocialSignIn } from "@/api/queries/auth";
import type { SocialProvider } from "@/api/services";
import { OAuthButton } from "@/components/auth/OAuthButton";
import { getAuthErrorMessage } from "@/lib/auth-errors";

export function AuthSocialSignInButtons() {
  const { mutate, isPending, isError, error, variables } = useSocialSignIn();

  const handleSignIn = (provider: SocialProvider) => mutate(provider);
  const isLoading = (provider: SocialProvider) => isPending && variables === provider;

  return (
    <fieldset aria-label="Continuar con un proveedor" className="flex flex-col gap-3">
      {isError && (
        <div
          role="alert"
          className="rounded-xl px-3 py-3 font-body text-xs"
          style={{
            backgroundColor: "rgba(248, 113, 113, 0.10)",
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: "rgba(248, 113, 113, 0.30)",
            color: "#FCA5A5",
          }}
        >
          {getAuthErrorMessage(error)}
        </div>
      )}
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
