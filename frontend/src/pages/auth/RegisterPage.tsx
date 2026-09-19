import { AuthCard, AuthLink } from "@/components/auth/AuthCard";
import { AuthDivider } from "@/components/auth/AuthDivider";
import { AuthRegisterForm } from "@/components/auth/AuthRegisterForm";
import { AuthSocialSignInButtons } from "@/components/auth/AuthSocialSignInButtons";

export const RegisterPage = () => {
  return (
    <AuthCard
      title="Crea tu cuenta"
      description="Regístrate para empezar tu ruta de aprendizaje."
      footer={
        <>
          ¿Ya tienes cuenta? <AuthLink href="/auth/login" label="Inicia sesión" />
        </>
      }
    >
      <AuthSocialSignInButtons />
      <AuthDivider />
      <AuthRegisterForm />
    </AuthCard>
  );
};
