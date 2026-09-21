import type { ButtonHTMLAttributes, PropsWithChildren, ReactNode } from "react";

type OAuthButtonProps = {
  variant: "discord" | "ghost";
  icon: ReactNode;
  loading?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function OAuthButton({
  variant,
  icon,
  loading = false,
  disabled,
  children,
  className,
  ...rest
}: PropsWithChildren<OAuthButtonProps>) {
  const isDiscord = variant === "discord";

  const variantClasses = isDiscord
    ? "h-12 w-full border border-transparent bg-brand-discord font-semibold text-white hover:not-disabled:brightness-110"
    : "min-h-11 flex-grow border border-ghost bg-ghost font-semibold text-sm text-text-body hover:not-disabled:border-ghost-hover hover:not-disabled:bg-ghost-hover";

  return (
    <button
      type="button"
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading}
      className={`flex min-h-11 min-w-11 items-center justify-center gap-3 rounded-xl font-body outline-none transition-[filter,background-color,border-color,box-shadow] duration-150 ease-out focus-visible:border-accent-hover focus-visible:shadow-ring-focus disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${variantClasses} ${className ?? ""}`}
    >
      <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center" aria-hidden="true">
        {icon}
      </span>
      <span>{children}</span>
    </button>
  );
}
