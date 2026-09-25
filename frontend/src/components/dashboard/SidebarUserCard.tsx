import { useLogout, useSession } from "@/api/queries/auth";
import { getAuthErrorMessage } from "@/lib";
import { LogoutIcon } from "./SidebarIcons";
import { UserAvatar } from "./UserAvatar";

export function SidebarUserCard() {
  const { data: session } = useSession();
  const { mutate: logout, isPending, error } = useLogout();

  const name = session?.user.name;
  const email = session?.user.email;
  const displayName = name || email || "Usuario";

  return (
    <div className="mt-auto flex flex-col gap-2">
      <div className="flex items-center gap-3 rounded-xl border border-border-field bg-bg-ghost p-3">
        <UserAvatar name={name} email={email} />
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
