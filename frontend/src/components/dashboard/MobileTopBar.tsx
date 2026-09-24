import { BrandMark } from "@/components/ui";
import { UserAvatarMenu } from "./UserAvatarMenu";

/** Barra superior del dashboard en móvil (<md): marca + avatar con menú de usuario. */
export function MobileTopBar() {
  return (
    <header className="flex shrink-0 items-center justify-between px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-3 md:hidden">
      <BrandMark as="link" href="/dashboard/roadmaps" />
      <UserAvatarMenu />
    </header>
  );
}
