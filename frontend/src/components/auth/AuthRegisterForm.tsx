import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRegister } from "@/api/queries/auth";
import { getAuthErrorMessage } from "@/lib";
import { type RegisterFormValues, registerSchema } from "@/schemas/";
import { AuthLink } from "./AuthCard";
import { PasswordField } from "./PasswordField";
import { PrimaryButton } from "./PrimaryButton";
import { TextField } from "./TextField";

type FormErrors = Partial<Record<keyof RegisterFormValues, string>>;
type TextFieldName = "name" | "email" | "password" | "confirmPassword";

const REGISTER_REDIRECT_DELAY_MS = 4000;

const INITIAL_VALUES: RegisterFormValues = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  acceptTerms: false,
};

export function AuthRegisterForm() {
  const [values, setValues] = useState<RegisterFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const { mutate, isPending, isError, isSuccess, error, reset } = useRegister();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isSuccess) return;
    const timeoutId = window.setTimeout(() => {
      navigate("/auth/login");
    }, REGISTER_REDIRECT_DELAY_MS);
    return () => window.clearTimeout(timeoutId);
  }, [isSuccess, navigate]);

  const handleFieldChange = (field: TextFieldName) => (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setValues((prev) => ({ ...prev, [field]: value }));
    if (isError) reset();
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const handleAcceptTermsChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { checked } = event.target;
    setValues((prev) => ({ ...prev, acceptTerms: checked }));
    setErrors((prev) => (prev.acceptTerms ? { ...prev, acceptTerms: undefined } : prev));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = registerSchema.safeParse(values);
    if (!result.success) {
      const nextErrors: FormErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof RegisterFormValues;
        if (!nextErrors[field]) {
          nextErrors[field] = issue.message;
        }
      }
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    mutate({
      name: result.data.name,
      email: result.data.email,
      password: result.data.password,
    });
  };

  const isSubmitting = isPending;
  const isLocked = isPending || isSuccess;

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
      {isSuccess && (
        <div
          role="status"
          className="flex flex-col gap-2 rounded-xl px-3 py-3 font-body text-xs"
          style={{
            backgroundColor: "rgba(74, 222, 128, 0.10)",
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: "rgba(74, 222, 128, 0.30)",
            color: "#86EFAC",
          }}
        >
          <p>
            ¡Cuenta creada con éxito! Revisa tu correo para verificar tu cuenta. Te llevaremos al
            inicio de sesión en unos segundos.
          </p>
          <AuthLink href="/auth/login" label="Ir a iniciar sesión" />
        </div>
      )}
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
      <div className="flex flex-col gap-4">
        <TextField
          id="name"
          name="name"
          label="Nombre"
          autoComplete="name"
          value={values.name}
          onChange={handleFieldChange("name")}
          error={errors.name}
          disabled={isLocked}
        />
        <TextField
          id="email"
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={values.email}
          onChange={handleFieldChange("email")}
          error={errors.email}
          disabled={isLocked}
        />
        <PasswordField
          id="password"
          name="password"
          label="Contraseña"
          autoComplete="new-password"
          value={values.password}
          onChange={handleFieldChange("password")}
          error={errors.password}
          disabled={isLocked}
        />
        <PasswordField
          id="confirmPassword"
          name="confirmPassword"
          label="Confirmar contraseña"
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={handleFieldChange("confirmPassword")}
          error={errors.confirmPassword}
          disabled={isLocked}
        />
        <div className="flex flex-col gap-4">
          <label
            htmlFor="acceptTerms"
            className="flex items-start gap-3 font-body text-xs text-text-secondary"
          >
            <input
              id="acceptTerms"
              type="checkbox"
              name="acceptTerms"
              checked={values.acceptTerms}
              onChange={handleAcceptTermsChange}
              disabled={isLocked}
              aria-invalid={errors.acceptTerms ? "true" : undefined}
              aria-describedby={errors.acceptTerms ? "acceptTerms-error" : undefined}
              className="h-4 w-4 shrink-0 accent-accent disabled:cursor-not-allowed disabled:opacity-50"
            />
            <span>Acepto los términos y condiciones</span>
          </label>
          {errors.acceptTerms && (
            <p id="acceptTerms-error" className="text-xs text-danger">
              {errors.acceptTerms}
            </p>
          )}
        </div>
      </div>
      <PrimaryButton
        type="submit"
        disabled={isSuccess}
        loading={isSubmitting}
        loadingLabel="Creando cuenta…"
      >
        Crear cuenta
      </PrimaryButton>
    </form>
  );
}
