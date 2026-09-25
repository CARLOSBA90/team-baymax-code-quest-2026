import type { PropsWithChildren } from "react";

export function NebulaSurface({ children }: PropsWithChildren) {
  return (
    <div className="empty-state-surface flex shrink-0 grow flex-col items-center justify-center px-5 py-8 md:p-12">
      {children}
    </div>
  );
}
