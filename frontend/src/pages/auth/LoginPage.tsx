import { useSearchParams } from "react-router-dom";
import {
  AuthCard,
  AuthDivider,
  AuthLink,
  AuthLoginForm,
  AuthSocialSignInButtons,
} from "@/components/auth";
import { Notice } from "@/components/ui";
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
      {oauthError && <Notice variant="error">{oauthError}</Notice>}
      <AuthSocialSignInButtons />
      <AuthDivider />
      <AuthLoginForm />
    </AuthCard>
  );
};
