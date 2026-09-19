import type { PropsWithChildren } from "react";

export function NebulaBackground({ children }: PropsWithChildren) {
  return (
    <div className="nebula nebula--responsive relative flex min-h-dvh items-center justify-center overflow-hidden px-5 sm:px-8">
      <div className="relative z-2 flex w-full flex-col items-center">{children}</div>
    </div>
  );
}
