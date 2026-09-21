import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type PrimaryButtonProps = {
  loading?: boolean;
  loadingLabel?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function PrimaryButton({
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
      className={`flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-transparent bg-accent font-body font-bold text-white  shadow-primary outline-none transition-[filter,box-shadow,border-color] duration-150 ease-out hover:not-disabled:brightness-110 focus-visible:border-accent-hover focus-visible:shadow-ring-focus disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${className ?? ""}`}
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
