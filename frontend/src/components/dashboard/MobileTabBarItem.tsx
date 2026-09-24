import type { PropsWithChildren, ReactNode } from "react";
import { NavLink } from "react-router-dom";

interface MobileTabBarItemBaseProps {
  icon: ReactNode;
}

interface MobileTabBarLinkProps extends MobileTabBarItemBaseProps {
  to: string;
  disabled?: false;
}

interface MobileTabBarDisabledProps extends MobileTabBarItemBaseProps {
  disabled: true;
  to?: never;
}

export type MobileTabBarItemProps = MobileTabBarLinkProps | MobileTabBarDisabledProps;

const baseClasses =
  "flex h-14 w-full flex-col items-center justify-center gap-1 rounded-xl font-body text-xs font-semibold";

/** Item de la tab bar inferior: icono encima del texto. NavLink sin `end` (activo en subrutas). */
export function MobileTabBarItem(props: PropsWithChildren<MobileTabBarItemProps>) {
  const { icon, children } = props;

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
    </NavLink>
  );
}
