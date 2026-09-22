import { useLogout, useSession } from "@/api/queries/auth";
import { getAuthErrorMessage, getInitials } from "@/lib";
import { LogoutIcon } from "./SidebarIcons";

export function SidebarUserCard() {
  const { data: session } = useSession();
  const { mutate: logout, isPending, error } = useLogout();

  const name = session?.user.name;
  const email = session?.user.email;
  const displayName = name || email || "Usuario";

  return (
    <div className="mt-auto flex flex-col gap-2">
      <div className="flex items-center gap-3 rounded-xl border border-border-field bg-bg-ghost p-3">
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-accent-hover to-accent font-display text-sm font-bold text-white"
        >
          {getInitials(name, email)}
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-body text-sm font-medium text-text-primary">
            {displayName}
          </span>
          <span className="truncate font-body text-xs text-text-muted">{email ?? ""}</span>
        </div>
        <button
          type="button"
          aria-label="Cerrar sesión"
          disabled={isPending}
          aria-busy={isPending}
          onClick={() => logout()}
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-text-secondary outline-none hover:bg-bg-ghost-hover hover:text-text-primary focus-visible:shadow-ring-focus disabled:cursor-not-allowed disabled:text-text-muted cursor-pointer"
        >
          <LogoutIcon className="size-5" />
        </button>
      </div>
      {error && (
        <p role="alert" className="font-body text-xs text-text-secondary">
          {getAuthErrorMessage(error)}
        </p>
      )}
    </div>
  );
}
