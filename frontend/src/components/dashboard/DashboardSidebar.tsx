import { BrandMark } from "@/components/ui";
import { getRoadmapsCountLabel } from "@/lib";
import { ProfileIcon, RoutesIcon } from "./SidebarIcons";
import { SidebarNavItem } from "./SidebarNavItem";
import { SidebarUserCard } from "./SidebarUserCard";

export interface DashboardSidebarProps {
  /** Total de rutas para la pill de "Mis Rutas"; sin valor (carga/error) no se muestra. */
  roadmapsCount?: number;
}

export function DashboardSidebar({ roadmapsCount }: DashboardSidebarProps) {
  return (
    <aside className="sidebar-surface hidden w-[calc(16rem+env(safe-area-inset-left))] shrink-0 flex-col md:flex gap-7 border-r border-border-field pl-[max(1rem,env(safe-area-inset-left))] pr-4 pt-7 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
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
              countLabel={
                roadmapsCount === undefined ? undefined : getRoadmapsCountLabel(roadmapsCount)
              }
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
