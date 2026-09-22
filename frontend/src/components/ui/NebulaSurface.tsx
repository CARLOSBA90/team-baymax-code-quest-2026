import type { PropsWithChildren } from "react";

export function NebulaSurface({ children }: PropsWithChildren) {
  return (
    <div className="empty-state-surface flex flex-1 flex-col items-center justify-center p-12">
      {children}
    </div>
  );
}
