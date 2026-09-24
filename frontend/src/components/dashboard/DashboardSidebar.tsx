import { BrandMark } from "@/components/ui";
import { ProfileIcon, RoutesIcon } from "./SidebarIcons";
import { SidebarNavItem } from "./SidebarNavItem";
import { SidebarUserCard } from "./SidebarUserCard";

export interface DashboardSidebarProps {
  /** Total de rutas para la pill de "Mis Rutas"; sin valor (carga/error) no se muestra. */
  roadmapsCount?: number;
}

export function DashboardSidebar({ roadmapsCount }: DashboardSidebarProps) {
  return (
    <aside className="sidebar-surface hidden w-64 shrink-0 flex-col md:flex gap-7 border-r border-border-field px-4 pt-7 pb-5">
      <BrandMark as="link" href="/dashboard/roadmaps" />
      <nav aria-label="Navegación principal">
        <p className="mb-2 px-3 font-body text-xs font-semibold tracking-widest text-text-muted">
          MENÚ
        </p>
        <ul className="flex flex-col gap-1">
          <li>
            <SidebarNavItem
              to="/dashboard/roadmaps"
              count={roadmapsCount}
              icon={<RoutesIcon className="size-5" />}
            >
              Mis Rutas
            </SidebarNavItem>
          </li>
          <li>
            <SidebarNavItem disabled icon={<ProfileIcon className="size-5" />}>
              Mi Perfil
            </SidebarNavItem>
          </li>
        </ul>
      </nav>
      <SidebarUserCard />
    </aside>
  );
}
