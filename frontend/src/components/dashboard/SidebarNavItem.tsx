import type { PropsWithChildren, ReactNode } from "react";
import { NavLink } from "react-router-dom";

interface SidebarNavItemBaseProps {
  icon: ReactNode;
  count?: number;
}

interface SidebarNavLinkProps extends SidebarNavItemBaseProps {
  to: string;
  disabled?: false;
}

interface SidebarNavDisabledProps extends SidebarNavItemBaseProps {
  disabled: true;
  to?: never;
}

export type SidebarNavItemProps = SidebarNavLinkProps | SidebarNavDisabledProps;

const baseClasses =
  "flex h-11 w-full items-center gap-3 rounded-xl px-3 font-body text-sm font-medium";

export function SidebarNavItem(props: PropsWithChildren<SidebarNavItemProps>) {
  const { icon, count, children } = props;

  const pill =
    count === undefined ? null : (
      <span className="ml-auto rounded-full bg-bg-ghost px-2 text-xs text-text-secondary">
        {count}
      </span>
    );

  if (props.disabled) {
    return (
      <button
        type="button"
        disabled
        aria-disabled="true"
        className={`${baseClasses} cursor-not-allowed text-text-muted`}
      >
        {icon}
        <span className="truncate">{children}</span>
        {pill}
      </button>
    );
  }

  return (
    <NavLink
      to={props.to}
      className={({ isActive }) =>
        `${baseClasses} outline-none focus-visible:shadow-ring-focus ${
          isActive
            ? "bg-bg-nav-active text-text-primary [&_svg]:text-accent-soft"
            : "text-text-secondary hover:bg-bg-ghost hover:text-text-primary"
        }`
      }
    >
      {icon}
      <span className="truncate">{children}</span>
      {pill}
    </NavLink>
  );
}
