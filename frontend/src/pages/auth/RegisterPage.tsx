import {
  AuthCard,
  AuthDivider,
  AuthLink,
  AuthRegisterForm,
  AuthSocialSignInButtons,
} from "@/components/auth";

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
