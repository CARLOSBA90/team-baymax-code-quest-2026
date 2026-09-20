import type { PropsWithChildren } from "react";

const variants = {
  error: {
    role: "alert",
    backgroundColor: "rgba(248, 113, 113, 0.10)",
    borderColor: "rgba(248, 113, 113, 0.30)",
    color: "#FCA5A5",
  },
  success: {
    role: "status",
    backgroundColor: "rgba(74, 222, 128, 0.10)",
    borderColor: "rgba(74, 222, 128, 0.30)",
    color: "#86EFAC",
  },
} as const;

interface AuthNoticeProps {
  variant: keyof typeof variants;
}

export function AuthNotice({ variant, children }: PropsWithChildren<AuthNoticeProps>) {
  const { role, ...colors } = variants[variant];

  return (
    <div
      role={role}
      className="rounded-xl px-3 py-3 font-body text-xs"
      style={{ ...colors, borderWidth: 1, borderStyle: "solid" }}
    >
      {children}
    </div>
  );
}
