import { AuthCard, AuthLink } from "@/components/auth";
import { AuthLoginForm } from "@/components/auth/AuthLoginForm";

export const LoginPage = () => {
  return (
    <AuthCard
      title="Inicia sesión"
      footer={
        <>
          ¿No tienes cuenta? <AuthLink href="/auth/register" label="Regístrate" />
        </>
      }
    >
      <AuthLoginForm />
    </AuthCard>
  );
};
