import type { PropsWithChildren } from "react";

export type NoticeVariant = "error" | "success" | "info";

const ROLE: Record<NoticeVariant, "alert" | "status"> = {
  error: "alert",
  success: "status",
  info: "status",
};

// Tokens `--color-notice-*` de `index.css` (bloque «Avisos»).
const VARIANT_CLASSES: Record<NoticeVariant, string> = {
  error: "border-notice-error-border bg-notice-error-bg text-notice-error-text",
  success: "border-notice-success-border bg-notice-success-bg text-notice-success-text",
  info: "border-notice-info-border bg-notice-info-bg text-notice-info-text",
};

interface NoticeProps {
  /** `error` → `role="alert"`; `success` e `info` (aviso neutro) → `role="status"`. */
  variant: NoticeVariant;
}

export function Notice({ variant, children }: PropsWithChildren<NoticeProps>) {
  return (
    <div
      role={ROLE[variant]}
      className={`rounded-xl border px-3 py-3 font-body text-xs ${VARIANT_CLASSES[variant]}`}
    >
      {children}
    </div>
  );
}
