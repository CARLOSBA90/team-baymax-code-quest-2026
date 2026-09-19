import type { ChangeEvent, SubmitEvent } from "react";
import { useState } from "react";
import { type LoginFormValues, loginSchema } from "@/schemas";
import { PasswordField } from "./PasswordField";
import { PrimaryButton } from "./PrimaryButton";
import { TextField } from "./TextField";

type FormStatus = "idle" | "submitting" | "error";
type FormErrors = Partial<Record<keyof LoginFormValues, string>>;

const INITIAL_VALUES: LoginFormValues = { email: "", password: "" };

export function AuthLoginForm() {
  const [values, setValues] = useState<LoginFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<FormStatus>("idle");

  const handleFieldChange =
    (field: keyof LoginFormValues) => (event: ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      setValues((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
    };

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = loginSchema.safeParse(values);
    if (!result.success) {
      const nextErrors: FormErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof LoginFormValues;
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
    // login con `result.data` (email/password ya validados). Se simula un fallo genérico
    // para dejar el flujo de UI (loading -> error banner) completo y verificable.
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
          Email o contraseña incorrectos
        </div>
      )}
      <div className="flex flex-col gap-4">
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
          autoComplete="current-password"
          value={values.password}
          onChange={handleFieldChange("password")}
          error={errors.password}
          disabled={isSubmitting}
          showForgotPassword
        />
      </div>
      <PrimaryButton type="submit" loading={isSubmitting} loadingLabel="Entrando…">
        Entrar
      </PrimaryButton>
    </form>
  );
}
