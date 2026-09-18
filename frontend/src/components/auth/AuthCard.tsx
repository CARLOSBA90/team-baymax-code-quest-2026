import type { PropsWithChildren } from "react";
import { Link } from "react-router-dom";
import { AuthSocialSignInButtons } from "@/components/auth";
import { AuthDivider } from "@/components/auth/AuthDivider";

type AuthCardProps = {
  title: string;
  footer: React.ReactNode;
};

export function AuthCard({ title, footer, children }: PropsWithChildren<AuthCardProps>) {
  return (
    <div className="flex min-h-full">
      <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-black">
        <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <header className="mb-4 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {title}
            </h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Elige el servicio de tu preferencia
            </p>
          </header>
          <AuthSocialSignInButtons />
          <AuthDivider />
          {children}
          <footer className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
            {footer}
          </footer>
        </div>
      </div>
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
      className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-50 cursor-pointer"
    >
      {label}
    </Link>
  );
};
