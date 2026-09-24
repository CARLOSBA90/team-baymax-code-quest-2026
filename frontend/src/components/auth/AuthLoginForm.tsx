import type { ChangeEvent, SubmitEvent } from "react";
import { useState } from "react";
import { useLogin } from "@/api/queries/auth";
import { Notice, PrimaryButton } from "@/components/ui";
import { getAuthErrorMessage } from "@/lib";
import { type LoginFormValues, loginSchema } from "@/schemas";
import { PasswordField } from "./PasswordField";
import { TextField } from "./TextField";

type FormErrors = Partial<Record<keyof LoginFormValues, string>>;

const INITIAL_VALUES: LoginFormValues = { email: "", password: "" };

export function AuthLoginForm() {
  const [values, setValues] = useState<LoginFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const { mutate, isPending, isError, error, reset } = useLogin();

  const handleFieldChange =
    (field: keyof LoginFormValues) => (event: ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      setValues((prev) => ({ ...prev, [field]: value }));
      if (isError) reset();
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
    mutate({ email: result.data.email, password: result.data.password });
  };

  const isSubmitting = isPending;

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
      {isError && <Notice variant="error">{getAuthErrorMessage(error)}</Notice>}
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
        />
      </div>
      <PrimaryButton type="submit" loading={isSubmitting} loadingLabel="Entrando…">
        Entrar
      </PrimaryButton>
    </form>
  );
}
