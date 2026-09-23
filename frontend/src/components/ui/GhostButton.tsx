import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type GhostButtonSize = "sm" | "md";

export type GhostButtonProps = {
  size?: GhostButtonSize;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const SIZE_CLASSES: Record<GhostButtonSize, string> = {
  sm: "h-10 px-4",
  md: "h-11 px-5",
};

const BASE_CLASSES =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-border-ghost bg-bg-ghost font-body font-semibold text-text-primary cursor-pointer outline-none transition-[background-color,border-color,box-shadow] duration-150 hover:not-disabled:bg-bg-ghost-hover hover:not-disabled:border-border-ghost-hover focus-visible:border-accent-hover focus-visible:shadow-ring-focus disabled:cursor-not-allowed disabled:opacity-50";

export function GhostButton({
  size = "md",
  type = "button",
  className,
  children,
  ...rest
}: PropsWithChildren<GhostButtonProps>) {
  return (
    <button
      type={type}
      {...rest}
      className={`${BASE_CLASSES} ${SIZE_CLASSES[size]} ${className ?? ""}`}
    >
      {children}
    </button>
  );
}
