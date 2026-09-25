import { useLogout, useSession } from "@/api/queries/auth";
import { DropdownMenu } from "@/components/ui";
import { getAuthErrorMessage } from "@/lib";
import { LogoutIcon } from "./SidebarIcons";
import { UserAvatar } from "./UserAvatar";

/** Avatar del usuario que abre un menú con "Cerrar sesión" (top bar móvil del dashboard). */
export function UserAvatarMenu() {
  const { data: session } = useSession();
  const { mutate: logout, isPending, error } = useLogout();

  const name = session?.user.name;
  const email = session?.user.email;
  const displayName = name || email || "Usuario";

  return (
    <div className="relative flex">
      <DropdownMenu
        triggerLabel={`Menú de usuario de ${displayName}`}
        trigger={<UserAvatar name={name} email={email} />}
        triggerClassName="rounded-full"
        items={[
          {
            id: "logout",
            label: "Cerrar sesión",
            icon: <LogoutIcon className="size-4" />,
            disabled: isPending,
            onSelect: () => logout(),
          },
        ]}
      />
      {error && (
        <p
          role="alert"
          className="absolute top-full right-0 z-20 mt-2 w-max max-w-60 rounded-lg border border-border-card bg-bg-surface-solid px-3 py-2 font-body text-xs text-text-secondary shadow-card"
        >
          {getAuthErrorMessage(error)}
        </p>
      )}
    </div>
  );
}
