import { useState } from "react";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import type { TextFieldProps } from "./TextField";

export type PasswordFieldProps = Omit<TextFieldProps, "type"> & {
  autoComplete?: "current-password" | "new-password";
  showForgotPassword?: boolean;
};

export function PasswordField({
  id,
  label,
  name,
  autoComplete,
  error,
  disabled,
  className,
  showForgotPassword = false,
  ...rest
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const errorId = `${id}-error`;
  const hasError = Boolean(error);

  const borderClasses = hasError
    ? "border-danger"
    : "border-border-field hover:not-disabled:border-border-field-hover focus-visible:border-accent-hover";

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-2">
        <div className="flex justify-between">
          <label htmlFor={id} className="text-sm font-semibold text-text-label">
            {label}
          </label>
          {showForgotPassword && (
            <a
              // TODO: recuperación de contraseña fuera de scope de este change. Ruta destino
              // aún no existe en el router; se deja apuntando a la ruta prevista.
              href="/auth/forgot-password"
              className="self-end font-body text-xs font-medium text-accent-soft transition-colors hover:text-accent-soft-hover hover:underline"
            >
              ¿La olvidaste?
            </a>
          )}
        </div>
        <div className="relative flex items-center">
          <input
            id={id}
            name={name}
            type={visible ? "text" : "password"}
            autoComplete={autoComplete}
            disabled={disabled}
            aria-invalid={hasError ? "true" : undefined}
            aria-describedby={hasError ? errorId : undefined}
            className={`h-11 w-full rounded-xl border bg-bg-field py-0 pr-12 pl-3 font-body text-sm text-text-field outline-none transition-[box-shadow,border-color,background-color] duration-120 ease-out placeholder:text-text-placeholder focus-visible:bg-bg-field-focus focus-visible:shadow-ring-focus disabled:cursor-not-allowed disabled:opacity-50 ${borderClasses} ${className ?? ""}`}
            {...rest}
          />
          <button
            type="button"
            onClick={() => setVisible((prev) => !prev)}
            disabled={disabled}
            aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={visible}
            className="absolute right-0 flex h-11 w-11 items-center justify-center bg-transparent text-text-muted outline-none focus-visible:shadow-ring-focus disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            {visible ? (
              <IoEyeOffOutline size={19} aria-hidden="true" />
            ) : (
              <IoEyeOutline size={19} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
      {hasError && (
        <p id={errorId} className="mt-2 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
