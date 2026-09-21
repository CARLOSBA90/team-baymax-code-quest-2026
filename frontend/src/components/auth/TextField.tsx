import type { InputHTMLAttributes } from "react";

export type TextFieldProps = {
  id: string;
  label: string;
  name: string;
  type?: "text" | "email";
  autoComplete?: string;
  error?: string;
  disabled?: boolean;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "name" | "type">;

export function TextField({
  id,
  label,
  name,
  type = "text",
  autoComplete,
  error,
  disabled,
  className,
  ...rest
}: TextFieldProps) {
  const errorId = `${id}-error`;
  const hasError = Boolean(error);

  const borderClasses = hasError
    ? "border-danger"
    : "border-border-field hover:not-disabled:border-border-field-hover focus-visible:border-accent-hover";

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-2">
        <label htmlFor={id} className="text-sm font-semibold text-text-label">
          {label}
        </label>
        <input
          id={id}
          name={name}
          type={type}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={hasError ? "true" : undefined}
          aria-describedby={hasError ? errorId : undefined}
          className={`h-12 rounded-xl border bg-bg-field px-3 font-body text-sm text-text-field outline-none transition-[box-shadow,border-color,background-color] duration-120 ease-out placeholder:text-text-placeholder focus-visible:bg-bg-field-focus focus-visible:shadow-ring-focus disabled:cursor-not-allowed disabled:opacity-50 ${borderClasses} ${className ?? ""}`}
          {...rest}
        />
      </div>
      {hasError && (
        <p id={errorId} className="mt-2 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
