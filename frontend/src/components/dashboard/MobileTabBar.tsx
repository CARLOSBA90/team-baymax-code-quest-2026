import { MobileTabBarItem } from "./MobileTabBarItem";
import { ProfileIcon, RoutesIcon } from "./SidebarIcons";

/**
 * Tab bar inferior del dashboard en móvil (<md). No es `position: fixed`: es la última hija de
 * la columna `h-dvh` del layout, así que queda anclada al fondo y nunca tapa el contenido.
 */
export function MobileTabBar() {
  return (
    <nav
      aria-label="Navegación inferior"
      className="shrink-0 border-t border-border-field bg-bg-sidebar px-5 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden"
    >
      <ul className="grid grid-cols-2 gap-3">
        <li>
          <MobileTabBarItem to="/dashboard/roadmaps" icon={<RoutesIcon className="size-5" />}>
            Mis Rutas
          </MobileTabBarItem>
        </li>
        <li>
          <MobileTabBarItem disabled icon={<ProfileIcon className="size-5" />}>
            Mi Perfil
          </MobileTabBarItem>
        </li>
      </ul>
    </nav>
  );
}
