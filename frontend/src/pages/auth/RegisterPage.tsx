import { AuthCard, AuthLink } from "@/components/auth";
import { AuthRegisterForm } from "@/components/auth/AuthRegisterForm";

export const RegisterPage = () => {
  return (
    <AuthCard
      title="Crea tu cuenta"
      footer={
        <>
          ¿Ya tienes cuenta? <AuthLink href="/auth/login" label="Inicia sesión" />
        </>
      }
    >
      <AuthRegisterForm />
    </AuthCard>
  );
};
