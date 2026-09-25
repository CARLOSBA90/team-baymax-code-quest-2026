import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type PrimaryButtonVariant = "form" | "cta";
type PrimaryButtonTone = "accent" | "danger";

type PrimaryButtonProps = {
  variant?: PrimaryButtonVariant;
  /** Color del botón: `accent` (violeta, por defecto) o `danger` (rojo, acciones destructivas). */
  tone?: PrimaryButtonTone;
  loading?: boolean;
  loadingLabel?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const VARIANT_WIDTH_CLASSES: Record<PrimaryButtonVariant, string> = {
  form: "w-full",
  cta: "w-fit px-6",
};

const TONE_CLASSES: Record<PrimaryButtonTone, string> = {
  accent:
    "bg-accent shadow-primary focus-visible:border-accent-hover focus-visible:shadow-ring-focus",
  danger:
    "bg-danger-solid shadow-danger focus-visible:border-danger focus-visible:shadow-ring-danger",
};

export function PrimaryButton({
  variant = "form",
  tone = "accent",
  loading = false,
  loadingLabel = "Cargando…",
  children,
  disabled,
  className,
  ...rest
}: PropsWithChildren<PrimaryButtonProps>) {
  return (
    <button
      type="button"
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading}
      className={`flex h-12 ${VARIANT_WIDTH_CLASSES[variant]} items-center justify-center gap-2 rounded-xl border border-transparent ${TONE_CLASSES[tone]} font-body font-bold text-white outline-none transition-[filter,box-shadow,border-color] duration-150 ease-out hover:not-disabled:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${className ?? ""}`}
    >
      {loading ? (
        <>
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span>{loadingLabel}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
