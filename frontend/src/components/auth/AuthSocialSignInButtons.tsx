import { FaDiscord, FaGithubAlt, FaGoogle } from "react-icons/fa6";
import { OAuthButton } from "@/components/auth/OAuthButton";

export function AuthSocialSignInButtons() {
  const handleSignIn = (provider: string) => console.log(`Sign In with ${provider}`);

  return (
    <fieldset aria-label="Continuar con un proveedor" className="flex flex-col gap-3">
      <OAuthButton
        variant="discord"
        icon={<FaDiscord size={19} />}
        onClick={() => handleSignIn("discord")}
      >
        Ingresa con Discord
      </OAuthButton>
      <div className="flex gap-3">
        <OAuthButton
          variant="ghost"
          icon={<FaGithubAlt size={18} />}
          onClick={() => handleSignIn("github")}
        >
          GitHub
        </OAuthButton>
        <OAuthButton
          variant="ghost"
          icon={<FaGoogle size={18} />}
          onClick={() => handleSignIn("google")}
        >
          Google
        </OAuthButton>
      </div>
    </fieldset>
  );
}
