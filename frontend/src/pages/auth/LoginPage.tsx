import { AuthCard, AuthLink } from "@/components/auth/AuthCard";
import { AuthDivider } from "@/components/auth/AuthDivider";
import { AuthLoginForm } from "@/components/auth/AuthLoginForm";
import { AuthSocialSignInButtons } from "@/components/auth/AuthSocialSignInButtons";

export const LoginPage = () => {
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
      <AuthSocialSignInButtons />
      <AuthDivider />
      <AuthLoginForm />
    </AuthCard>
  );
};
