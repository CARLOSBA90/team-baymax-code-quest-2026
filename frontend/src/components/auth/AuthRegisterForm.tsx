import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import { type RegisterFormValues, registerSchema } from "@/schemas/";
import { PasswordField } from "./PasswordField";
import { PrimaryButton } from "./PrimaryButton";
import { TextField } from "./TextField";

type FormStatus = "idle" | "submitting" | "error";
type FormErrors = Partial<Record<keyof RegisterFormValues, string>>;
type TextFieldName = "name" | "email" | "password" | "confirmPassword";

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
  const [status, setStatus] = useState<FormStatus>("idle");

  const handleFieldChange = (field: TextFieldName) => (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setValues((prev) => ({ ...prev, [field]: value }));
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
    setStatus("submitting");

    // TODO: conectar a Better Auth (fuera de este change). Aquí iría la llamada real de
    // registro con `result.data` (campos ya validados, incluida la coincidencia de
    // contraseñas). Se simula un fallo genérico para dejar el flujo de UI completo.
    window.setTimeout(() => {
      setStatus("error");
    }, 600);
  };

  const isSubmitting = status === "submitting";

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
      {status === "error" && (
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
          No pudimos crear tu cuenta. Intenta nuevamente.
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
          disabled={isSubmitting}
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
          disabled={isSubmitting}
        />
        <PasswordField
          id="password"
          name="password"
          label="Contraseña"
          autoComplete="new-password"
          value={values.password}
          onChange={handleFieldChange("password")}
          error={errors.password}
          disabled={isSubmitting}
        />
        <PasswordField
          id="confirmPassword"
          name="confirmPassword"
          label="Confirmar contraseña"
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={handleFieldChange("confirmPassword")}
          error={errors.confirmPassword}
          disabled={isSubmitting}
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
              disabled={isSubmitting}
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
      <PrimaryButton type="submit" loading={isSubmitting} loadingLabel="Creando cuenta…">
        Crear cuenta
      </PrimaryButton>
    </form>
  );
}
