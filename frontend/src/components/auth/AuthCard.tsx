import type { PropsWithChildren, ReactNode } from "react";
import { Link } from "react-router-dom";

type AuthCardProps = {
  title: string;
  description?: string;
  footer: ReactNode;
};

export function AuthCard({
  title,
  description,
  footer,
  children,
}: PropsWithChildren<AuthCardProps>) {
  return (
    <div className="nebula-card flex w-full flex-col gap-5 rounded-3xl border border-border-card bg-bg-surface p-[26px_22px_24px] backdrop-blur-lg shadow-card sm:w-113 sm:rounded-card sm:p-[34px_36px_30px]">
      <header className="flex flex-col gap-1.5 text-center">
        <h2 className="font-display text-2xl font-semibold text-text-primary">{title}</h2>
        {description && <p className="font-body text-sm text-text-secondary">{description}</p>}
      </header>
      {children}
      <footer className="text-center font-body text-sm text-text-muted">{footer}</footer>
    </div>
  );
}

type AuthLinkProps = {
  href: string;
  label: string;
};

export const AuthLink = ({ href, label }: AuthLinkProps) => {
  return (
    <Link
      to={href}
      className="font-semibold text-accent-soft underline-offset-4 transition-colors hover:text-accent-soft-hover hover:underline"
    >
      {label}
    </Link>
  );
};
