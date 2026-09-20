import { useSearchParams } from "react-router-dom";
import { AuthCard, AuthLink } from "@/components/auth/AuthCard";
import { AuthDivider } from "@/components/auth/AuthDivider";
import { AuthLoginForm } from "@/components/auth/AuthLoginForm";
import { AuthSocialSignInButtons } from "@/components/auth/AuthSocialSignInButtons";
import { getOAuthQueryErrorMessage } from "@/lib";

export const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const oauthError = getOAuthQueryErrorMessage(searchParams.get("error"));

  return (
    <AuthCard
      title="Iniciar sesión"
      description="Entra con tu cuenta para retomar tu ruta."
      footer={
        <>
          ¿No tienes cuenta? <AuthLink href="/auth/register" label="Regístrate" />
        </>
      }
    >
      {oauthError && (
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
          {oauthError}
        </div>
      )}
      <AuthSocialSignInButtons />
      <AuthDivider />
      <AuthLoginForm />
    </AuthCard>
  );
};
