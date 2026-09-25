import type { PropsWithChildren, ReactNode } from "react";
import { NavLink } from "react-router-dom";

interface SidebarNavItemBaseProps {
  icon: ReactNode;
  count?: number;
  /**
   * Texto accesible de la pill (p. ej. "5 rutas"); por defecto, el número. El número visible es
   * `aria-hidden` y este texto va en `sr-only` tras una coma, para que el nombre del enlace sea
   * "Mis Rutas, 5 rutas" y no "Mis Rutas5".
   */
  countLabel?: string;
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
  const { icon, count, countLabel, children } = props;

  const pill =
    count === undefined ? null : (
      <>
        <span
          aria-hidden="true"
          className="ml-auto rounded-full bg-bg-ghost px-2 text-xs text-text-secondary"
        >
          {count}
        </span>
        <span className="sr-only">, {countLabel ?? count}</span>
      </>
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
